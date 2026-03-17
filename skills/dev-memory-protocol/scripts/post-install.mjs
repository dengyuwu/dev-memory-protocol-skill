import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGlobalBootstrapBlock, upsertGlobalBootstrapBlock } from "./lib/global-bootstrap.mjs";
import { runInstall } from "./install.mjs";
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
      reason: "current directory does not look like a project root"
    };
  }

  const manifestPath = path.join(projectRoot, ".ai", "index", "manifest.json");
  if (await fileExists(manifestPath)) {
    return {
      initialized: false,
      reason: ".ai already initialized"
    };
  }

  await runInstall({ project: projectRoot });

  return {
    initialized: true,
    reason: "initialized current project"
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
  actions.push(`updated ${toPosixPath(agentsPath)}`);

  let projectResult = {
    initialized: false,
    reason: "project initialization skipped"
  };

  if (!skipProject) {
    projectResult = await initializeProjectIfNeeded(projectRoot);
    actions.push(projectResult.reason);
  }

  console.log(
    JSON.stringify(
      {
        skillRoot: toPosixPath(skillRoot),
        projectRoot: toPosixPath(projectRoot),
        skipProject,
        actions
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
