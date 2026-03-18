import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGlobalBootstrapBlock, upsertGlobalBootstrapBlock } from "./lib/global-bootstrap.mjs";
import { runInstall } from "./install.mjs";
import { 记忆路径 } from "./lib/memory-paths.mjs";
import { fileExists, readTextMaybe, resolveProjectPath, toPosixPath, writeText } from "./lib/path-utils.mjs";

const PROJECT_MARKERS = [
  ".git",
  "package.json",
  "pnpm-workspace.yaml",
  "pom.xml",
  "build.gradle",
  "settings.gradle",
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Makefile"
];

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

async function ensureGlobalBootstrap(skillRoot) {
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const agentsPath = path.join(homeDir, ".codex", "AGENTS.md");
  const existingText = await readTextMaybe(agentsPath);
  const nextText = upsertGlobalBootstrapBlock(existingText, buildGlobalBootstrapBlock(skillRoot));
  await writeText(agentsPath, nextText);
  return agentsPath;
}

async function isProjectDirectory(projectRoot) {
  try {
    const entries = await fs.readdir(projectRoot);
    return PROJECT_MARKERS.some((marker) => entries.includes(marker));
  } catch {
    return false;
  }
}

async function initializeProjectIfNeeded(projectRoot) {
  if (!(await isProjectDirectory(projectRoot))) {
    return {
      initialized: false,
      reason: "当前目录看起来不是项目根目录"
    };
  }

  const manifestPath = path.join(projectRoot, ...记忆路径.索引清单.split("/"));
  if (await fileExists(manifestPath)) {
    return {
      initialized: false,
      reason: ".ai 已初始化"
    };
  }

  await runInstall({ project: projectRoot });

  return {
    initialized: true,
    reason: "已初始化当前项目"
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const skillRoot = path.resolve(scriptDir, "..");
  const projectRoot = resolveProjectPath(args.project || ".");
  const skipProject = args["skip-project"] === "true";
  const actions = [];

  const agentsPath = await ensureGlobalBootstrap(skillRoot);
  actions.push(`已更新 ${toPosixPath(agentsPath)}`);

  let projectResult = {
    initialized: false,
    reason: "已跳过项目初始化"
  };

  if (!skipProject) {
    projectResult = await initializeProjectIfNeeded(projectRoot);
    actions.push(projectResult.reason);
  }

  console.log(
    JSON.stringify(
      {
        技能目录: toPosixPath(skillRoot),
        项目根目录: toPosixPath(projectRoot),
        跳过项目初始化: skipProject,
        动作: actions
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
