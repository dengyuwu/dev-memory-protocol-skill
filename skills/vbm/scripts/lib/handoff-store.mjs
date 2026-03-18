import path from "node:path";
import { rebuildIndexes } from "./memory-store.mjs";
import { 记忆路径 } from "./memory-paths.mjs";
import { toPosixPath, writeText } from "./path-utils.mjs";

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderList(items, fallback) {
  if (items.length === 0) {
    return `- ${fallback}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function buildHandoffContent(options = {}) {
  const {
    summary = "本轮会话已结束，请结合当前代码和 diff 继续推进。",
    openQuestions = [],
    nextChecks = []
  } = options;

  const timestamp = new Date().toISOString();
  const pendingItems = normalizeList(openQuestions);
  const nextItems = normalizeList(nextChecks);

  return `# 交接记录

## 当前焦点

- 更新时间：${timestamp}
- 本轮摘要：${summary}

## 待确认问题

${renderList(pendingItems, "暂无，若后续发现疑点请及时补充。")}

## 下一步检查

${renderList(nextItems, "优先检查当前 diff、相关测试和受影响模块。")}
`;
}

export async function writeHandoff(projectRoot, options = {}) {
  const targetPath = path.join(projectRoot, ...记忆路径.交接记录.split("/"));
  const content = buildHandoffContent(options);

  await writeText(targetPath, `${content.trim()}\n`);
  return toPosixPath(path.relative(projectRoot, targetPath));
}

export async function rebuildAfterHandoff(projectRoot, updatedBy = "session-close.mjs") {
  const result = await rebuildIndexes(projectRoot, {
    最近更新脚本: updatedBy
  });
  return result.documents.length;
}
