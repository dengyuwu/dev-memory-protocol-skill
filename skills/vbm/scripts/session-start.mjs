import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInstall } from "./install.mjs";
import { 基础记忆文件, 记忆路径 } from "./lib/memory-paths.mjs";
import { fileExists, resolveProjectPath, toPosixPath } from "./lib/path-utils.mjs";

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

async function isProjectDirectory(projectRoot) {
  for (const marker of PROJECT_MARKERS) {
    if (await fileExists(path.join(projectRoot, marker))) {
      return true;
    }
  }

  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectPath(args.project || ".");

  if (!(await isProjectDirectory(projectRoot))) {
    console.log(
      JSON.stringify(
        {
          项目根目录: toPosixPath(projectRoot),
          动作: ["当前目录不是项目，已跳过 vbm 启动同步"]
        },
        null,
        2
      )
    );
    return;
  }

  const manifestPath = path.join(projectRoot, ...记忆路径.索引清单.split("/"));
  const actions = [];

  if (!(await fileExists(manifestPath))) {
    await runInstall({ project: projectRoot });
    actions.push("检测到 .ai 缺失，已自动初始化 vbm");
  } else {
    actions.push("已检测到现有 .ai，跳过初始化");
  }

  const availableBaseline = [];
  for (const relativePath of 基础记忆文件) {
    if (await fileExists(path.join(projectRoot, relativePath))) {
      availableBaseline.push(relativePath);
    }
  }

  console.log(
    JSON.stringify(
      {
        项目根目录: toPosixPath(projectRoot),
        动作: actions,
        基础记忆: availableBaseline
      },
      null,
      2
    )
  );
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
