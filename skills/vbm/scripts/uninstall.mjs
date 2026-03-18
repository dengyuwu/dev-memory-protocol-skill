import path from "node:path";
import { fileExists, readTextMaybe, resolveProjectPath, toPosixPath, writeText } from "./lib/path-utils.mjs";
import { rebuildIndexes } from "./lib/memory-store.mjs";
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectPath(args.project || ".");
  const tool = args.tool || (await detectTool(projectRoot));

  if (!["codex", "claude", "both"].includes(tool)) {
    throw new Error(`无效的 --tool 参数：${tool}`);
  }

  const actions = [];
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

  await rebuildIndexes(projectRoot, {
    卸载时间: new Date().toISOString(),
    工具: tool,
    项目根目录: toPosixPath(projectRoot),
    说明: "仅移除规则区块，保留项目记忆文件。"
  });
  actions.push("已重建 .ai 索引");

  console.log(
    JSON.stringify(
      {
        工具: tool,
        项目根目录: toPosixPath(projectRoot),
        动作: actions,
        保留内容: [
          ".ai/project/*",
          ".ai/memory/*",
          ".ai/index/*"
        ]
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
