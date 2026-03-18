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
    tool: explicitTool,
    silent = false
  } = options;

  const projectRoot = resolveProjectPath(project);
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const templateRoot = path.resolve(scriptDir, "../assets/templates");
  const aiRoot = path.join(projectRoot, ".ai");
  const tool = explicitTool || (await detectTool(projectRoot));

  if (!["codex", "claude", "both"].includes(tool)) {
    throw new Error(`无效的 --tool 参数：${tool}`);
  }

  const actions = [];
  await copyDir(templateRoot, aiRoot, { skipExisting: true });
  actions.push("已初始化 .ai 模板目录");

  const block = buildManagedBlock();
  for (const relativeTarget of resolveRuleTargets(tool)) {
    const targetPath = path.join(projectRoot, relativeTarget);
    const existingText = await readTextMaybe(targetPath);
    const nextText = upsertManagedBlock(existingText, block);
    const existed = Boolean(existingText);
    await writeText(targetPath, nextText);
    actions.push(`${existed ? "已更新" : "已创建"} ${relativeTarget}`);
  }

  await rebuildIndexes(projectRoot, {
    安装时间: new Date().toISOString(),
    工具: tool,
    项目根目录: toPosixPath(projectRoot)
  });
  actions.push("已重建 .ai 索引");

  if (!silent) {
    console.log(
      JSON.stringify(
        {
          工具: tool,
          项目根目录: toPosixPath(projectRoot),
          动作: actions
        },
        null,
        2
      )
    );
  }

  return {
    tool,
    projectRoot,
    actions
  };
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
