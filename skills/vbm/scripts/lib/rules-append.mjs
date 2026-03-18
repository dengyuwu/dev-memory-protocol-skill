import { 记忆路径 } from "./memory-paths.mjs";

const LEGACY_BLOCK_IDS = ["dev-memory-protocol"];
export const BLOCK_ID = "vbm";
export const BLOCK_START = `<!-- ${BLOCK_ID}:start -->`;
export const BLOCK_END = `<!-- ${BLOCK_ID}:end -->`;

export function buildManagedBlock() {
  return `${BLOCK_START}
## Vibe Memory

先遵守现有用户规则和项目规则。
本区块只补充记忆工作流，不覆盖已有规则。

1. 每次任务开始时，先读取：
   - \`${记忆路径.项目概览}\`
   - \`${记忆路径.配置映射}\`
   - \`${记忆路径.交接记录}\`
   - \`${记忆路径.已知风险}\`

2. 修改代码前，先搜索相关记忆：
   - \`${记忆路径.问题记录目录}/\`
   - \`${记忆路径.决策记录目录}/\`
   - \`${记忆路径.业务规则}\`

3. 如果项目记忆中已经存在配置位置、业务规则或历史行为说明，禁止凭猜测回答，必须先检索。

4. 每轮任务结束时，优先自动执行会话收尾流程：
   - 更新 \`${记忆路径.交接记录}\`
   - 有代码变更时优先生成候选记忆
   - 只有内容已验证时，才正式写入 \`${记忆路径.问题记录目录}/\` 或 \`${记忆路径.决策记录目录}/\`
   - 最后重建 \`${记忆路径.索引目录}/\`

5. 只允许写回已验证、可复用、与项目相关的知识：
   - 稳定事实
   - 业务规则
   - 问题根因
   - 回归风险
   - 实现决策

6. 禁止把密码、令牌、私钥或完整连接串写入记忆文件。

7. 项目记忆优先级高于全局偏好；新的已验证记录优先级高于旧记录。

8. 只更新本受控区块和本协议创建的 \`.ai/\` 文件，禁止覆盖用户自行编写的其他规则内容。

9. 默认不需要点名 \`vbm\`；只要当前任务属于项目开发且已启用本协议，就应自动读取、自动整理、自动更新交接记忆。

10. 当用户明确说“使用vbm记下来刚刚的事情”、“使用 vbm 记下来刚刚的事情”或相近表达时，优先更新 \`${记忆路径.交接记录}\`。

11. 当用户明确说“使用vbm记住这个 bug”、“使用 vbm 记住这个 bug”、“使用vbm记录这次决策”或“使用 vbm 记录这次决策”时，优先写入正式记忆。
${BLOCK_END}
`;
}

export function upsertManagedBlock(existingText, blockText) {
  const normalized = existingText.replace(/\r\n/g, "\n");
  const { startIndex, endIndex, endMarkerLength } = findManagedBlock(normalized);

  if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
    const before = normalized.slice(0, startIndex).replace(/\s*$/, "");
    const after = normalized.slice(endIndex + endMarkerLength).replace(/^\s*/, "");
    return [before, blockText.trimEnd(), after].filter(Boolean).join("\n\n") + "\n";
  }

  if (!normalized.trim()) {
    return `${blockText.trimEnd()}\n`;
  }

  return `${normalized.replace(/\s*$/, "")}\n\n${blockText.trimEnd()}\n`;
}

export function removeManagedBlock(existingText) {
  const normalized = existingText.replace(/\r\n/g, "\n");
  const { startIndex, endIndex, endMarkerLength } = findManagedBlock(normalized);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return normalized;
  }

  const before = normalized.slice(0, startIndex).replace(/\s*$/, "");
  const after = normalized.slice(endIndex + endMarkerLength).replace(/^\s*/, "");
  const next = [before, after].filter(Boolean).join("\n\n");
  return next ? `${next}\n` : "";
}

function findManagedBlock(content) {
  const current = findBlockById(content, BLOCK_ID);
  if (current.startIndex !== -1) {
    return current;
  }

  for (const blockId of LEGACY_BLOCK_IDS) {
    const legacy = findBlockById(content, blockId);
    if (legacy.startIndex !== -1) {
      return legacy;
    }
  }

  return {
    startIndex: -1,
    endIndex: -1,
    endMarkerLength: BLOCK_END.length
  };
}

function findBlockById(content, blockId) {
  const startMarker = `<!-- ${blockId}:start -->`;
  const endMarker = `<!-- ${blockId}:end -->`;
  return {
    startIndex: content.indexOf(startMarker),
    endIndex: content.indexOf(endMarker),
    endMarkerLength: endMarker.length
  };
}

export function resolveRuleTargets(tool) {
  if (tool === "codex") {
    return ["AGENTS.md"];
  }

  if (tool === "claude") {
    return ["CLAUDE.md"];
  }

  if (tool === "both") {
    return ["AGENTS.md", "CLAUDE.md"];
  }

  throw new Error(`Unsupported tool: ${tool}`);
}
