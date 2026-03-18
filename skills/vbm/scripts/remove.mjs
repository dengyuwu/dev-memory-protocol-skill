import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildClaudeHookConfig,
  readJsonMaybe,
  removeClaudeHooks,
  resolveClaudeSettingsPath,
  writeJson
} from "./lib/claude-hooks.mjs";
import { removeGlobalBootstrapBlock } from "./lib/global-bootstrap.mjs";
import { rebuildIndexes } from "./lib/memory-store.mjs";
import { fileExists, readTextMaybe, resolveProjectPath, toPosixPath, writeText } from "./lib/path-utils.mjs";
import { removeManagedBlock, resolveRuleTargets } from "./lib/rules-append.mjs";

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

async function removeProjectRules(projectRoot, tool, actions) {
  for (const relativeTarget of resolveRuleTargets(tool)) {
    const targetPath = path.join(projectRoot, relativeTarget);
    if (!(await fileExists(targetPath))) {
      actions.push(`跳过不存在的 ${relativeTarget}`);
      continue;
    }

    const existingText = await readTextMaybe(targetPath);
    const nextText = removeManagedBlock(existingText);

    if (nextText === existingText.replace(/\r\n/g, "\n")) {
      actions.push(`${relativeTarget} 中没有找到受控区块`);
      continue;
    }

    await writeText(targetPath, nextText);
    actions.push(`已从 ${relativeTarget} 移除受控区块`);
  }
}

async function removeGlobalBootstrap(actions) {
  const agentsPath = path.join(os.homedir(), ".codex", "AGENTS.md");

  if (!(await fileExists(agentsPath))) {
    actions.push("已跳过不存在的全局 AGENTS.md");
    return "";
  }

  const existingText = await readTextMaybe(agentsPath);
  const nextText = removeGlobalBootstrapBlock(existingText);

  if (nextText === existingText.replace(/\r\n/g, "\n")) {
    actions.push("没有找到全局引导区块");
    return agentsPath;
  }

  await writeText(agentsPath, nextText);
  actions.push("已移除 Codex 全局引导");
  return agentsPath;
}

async function removeClaudeProjectHooks(skillRoot, scope, projectRoot, actions) {
  const settingsPath = resolveClaudeSettingsPath(scope, projectRoot);
  if (!(await fileExists(settingsPath))) {
    actions.push(`已跳过不存在的 Claude hooks 配置（scope=${scope}）`);
    return "";
  }

  const settings = await readJsonMaybe(settingsPath);
  const next = removeClaudeHooks(settings, buildClaudeHookConfig(skillRoot));
  await writeJson(settingsPath, next);
  actions.push(`已移除 Claude Code hooks（scope=${scope}）`);
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
  const updated = [];
  const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  await removeProjectRules(projectRoot, tool, actions);

  if (!skipGlobal && usesCodex(tool)) {
    const agentsPath = await removeGlobalBootstrap(actions);
    if (agentsPath) {
      updated.push(toPosixPath(agentsPath));
    }
  }

  if (!skipClaudeHooks && usesClaude(tool)) {
    const settingsPath = await removeClaudeProjectHooks(skillRoot, hookScope, projectRoot, actions);
    if (settingsPath) {
      updated.push(toPosixPath(settingsPath));
    }
  }

  await rebuildIndexes(projectRoot, {
    卸载时间: new Date().toISOString(),
    工具: tool,
    项目根目录: toPosixPath(projectRoot),
    说明: "已移除受控规则、可选全局引导与可选 Claude hooks，保留项目记忆文件。"
  });
  actions.push("已重建 .ai 索引");

  console.log(
    JSON.stringify(
      {
        工具: tool,
        项目根目录: toPosixPath(projectRoot),
        ClaudeHookScope: usesClaude(tool) && !skipClaudeHooks ? hookScope : "未处理",
        已更新: updated,
        动作: actions,
        保留内容: [".ai/project/*", ".ai/memory/*", ".ai/index/*"]
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
