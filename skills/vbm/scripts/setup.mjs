import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInstall } from "./install.mjs";
import { buildClaudeHookConfig, readJsonMaybe, resolveClaudeSettingsPath, upsertClaudeHooks, writeJson } from "./lib/claude-hooks.mjs";
import { buildGlobalBootstrapBlock, upsertGlobalBootstrapBlock } from "./lib/global-bootstrap.mjs";
import { fileExists, readTextMaybe, resolveProjectPath, toPosixPath, writeText } from "./lib/path-utils.mjs";

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

function usesCodex(tool) {
  return tool === "codex" || tool === "both";
}

function usesClaude(tool) {
  return tool === "claude" || tool === "both";
}

async function ensureGlobalBootstrap(skillRoot) {
  const agentsPath = path.join(os.homedir(), ".codex", "AGENTS.md");
  const existingText = await readTextMaybe(agentsPath);
  const nextText = upsertGlobalBootstrapBlock(existingText, buildGlobalBootstrapBlock(skillRoot));
  await writeText(agentsPath, nextText);
  return agentsPath;
}

async function ensureClaudeHooks(skillRoot, scope, projectRoot) {
  const settingsPath = resolveClaudeSettingsPath(scope, projectRoot);
  const settings = await readJsonMaybe(settingsPath);
  const next = upsertClaudeHooks(settings, buildClaudeHookConfig(skillRoot));
  await writeJson(settingsPath, next);
  return settingsPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectPath(args.project || ".");
  const tool = args.tool || (await detectTool(projectRoot));
  const hookScope = args["hook-scope"] || "project";
  const skipGlobal = args["skip-global"] === "true";
  const skipClaudeHooks = args["skip-claude-hooks"] === "true";
  const actions = [];
  const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  await runInstall({
    project: projectRoot,
    tool,
    silent: true
  });
  actions.push("已完成项目规则追加与 .ai 初始化");

  let globalPath = "";
  if (!skipGlobal && usesCodex(tool)) {
    globalPath = await ensureGlobalBootstrap(skillRoot);
    actions.push("已启用 Codex 全局引导");
  }

  let claudeSettingsPath = "";
  if (!skipClaudeHooks && usesClaude(tool)) {
    claudeSettingsPath = await ensureClaudeHooks(
      skillRoot,
      hookScope,
      projectRoot
    );
    actions.push(`已安装 Claude Code hooks（scope=${hookScope}）`);
  }

  console.log(
    JSON.stringify(
      {
        工具: tool,
        项目根目录: toPosixPath(projectRoot),
        ClaudeHookScope: usesClaude(tool) && !skipClaudeHooks ? hookScope : "未启用",
        已更新: [globalPath, claudeSettingsPath].filter(Boolean).map((item) => toPosixPath(item)),
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
