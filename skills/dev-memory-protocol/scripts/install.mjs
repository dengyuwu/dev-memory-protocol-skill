import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  copyDir,
  fileExists,
  readTextMaybe,
  resolveProjectPath,
  toPosixPath,
  writeText
} from "./lib/path-utils.mjs";
import {
  buildManagedBlock,
  resolveRuleTargets,
  upsertManagedBlock
} from "./lib/rules-append.mjs";
import { rebuildIndexes } from "./lib/memory-store.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? next : "true";
    if (args[key] === next) {
      index += 1;
    }
  }
  return args;
}

async function detectTool(projectRoot) {
  const hasAgents = await fileExists(path.join(projectRoot, "AGENTS.md"));
  const hasClaude = await fileExists(path.join(projectRoot, "CLAUDE.md"));

  if (hasAgents && hasClaude) {
    return "both";
  }

  if (hasAgents) {
    return "codex";
  }

  if (hasClaude) {
    return "claude";
  }

  return "both";
}

export async function runInstall(options = {}) {
  const {
    project = ".",
    tool: explicitTool
  } = options;

  const projectRoot = resolveProjectPath(project);
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const templateRoot = path.resolve(scriptDir, "../assets/templates");
  const aiRoot = path.join(projectRoot, ".ai");
  const tool = explicitTool || (await detectTool(projectRoot));

  if (!["codex", "claude", "both"].includes(tool)) {
    throw new Error(`Invalid --tool value: ${tool}`);
  }

  const actions = [];
  await copyDir(templateRoot, aiRoot, { skipExisting: true });
  actions.push("initialized .ai templates");

  const block = buildManagedBlock();
  for (const relativeTarget of resolveRuleTargets(tool)) {
    const targetPath = path.join(projectRoot, relativeTarget);
    const existingText = await readTextMaybe(targetPath);
    const nextText = upsertManagedBlock(existingText, block);
    const existed = Boolean(existingText);
    await writeText(targetPath, nextText);
    actions.push(`${existed ? "updated" : "created"} ${relativeTarget}`);
  }

  await rebuildIndexes(projectRoot, {
    installedAt: new Date().toISOString(),
    tool,
    projectRoot: toPosixPath(projectRoot)
  });
  actions.push("rebuilt .ai index");

  console.log(
    JSON.stringify(
      {
        tool,
        projectRoot: toPosixPath(projectRoot),
        actions
      },
      null,
      2
    )
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await runInstall({
    project: args.project || ".",
    tool: args.tool
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
