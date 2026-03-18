import path from "node:path";
import { 基础记忆文件, 记忆路径 } from "./memory-paths.mjs";

const LEGACY_GLOBAL_BLOCK_IDS = ["dev-memory-protocol-global"];
export const GLOBAL_BLOCK_ID = "vbm-global";
export const GLOBAL_BLOCK_START = `<!-- ${GLOBAL_BLOCK_ID}:start -->`;
export const GLOBAL_BLOCK_END = `<!-- ${GLOBAL_BLOCK_ID}:end -->`;

export function buildGlobalBootstrapBlock(skillRoot) {
  const normalizedSkillRoot = skillRoot.split(path.sep).join("/");
  return `${GLOBAL_BLOCK_START}
## Vibe Memory 全局引导

- 如果已安装的 \`vbm\`（Vibe Memory）skill 位于 \`${normalizedSkillRoot}\`，应把它作为项目记忆引导的唯一来源。
- 对项目级开发任务，在进入实质性实现前先执行项目记忆引导。
- 只有当前工作目录是项目根目录，或可以可靠解析到项目根目录时，才允许自动引导。
- 项目根目录解析优先级：
  1. 优先使用 \`git rev-parse --show-toplevel\`
  2. 如果 git 不可用，仅当当前目录包含 \`.git\`、\`package.json\`、\`pnpm-workspace.yaml\`、\`pom.xml\`、\`build.gradle\`、\`settings.gradle\`、\`pyproject.toml\`、\`requirements.txt\`、\`Cargo.toml\`、\`go.mod\`、\`composer.json\`、\`Gemfile\`、\`Makefile\` 等项目标记时，才把它视为项目根目录
  3. 禁止在用户主目录、桌面、下载目录等明显非项目目录下自动创建 \`.ai\`
- 如果项目根目录存在且 \`${记忆路径.索引清单}\` 缺失，应执行：
  \`node "${normalizedSkillRoot}/scripts/install.mjs" --project "<project-root>"\`
- 自动引导可以向 \`AGENTS.md\` 或 \`CLAUDE.md\` 追加受控项目规则块，但绝不能覆盖受控区块之外的用户规则。
- 如果项目中已经存在 \`.ai\`，改动代码前先读取这些基础记忆：
${基础记忆文件.map((item) => `  - \`${item}\``).join("\n")}
- 修改项目代码前，优先执行：
  \`node "${normalizedSkillRoot}/scripts/recall.mjs" --project "<project-root>" --query "<task summary>"\`
- 每轮任务或对话结束时，优先执行：
  \`node "${normalizedSkillRoot}/scripts/session-close.mjs" --project "<project-root>" --summary "<confirmed summary>"\`
- 如果有代码变更，优先使用 \`auto-capture.mjs\` 或 \`capture-from-diff.mjs\` 生成候选记忆；只有显式确认已验证时，才正式写入问题记录或决策记录。
- 默认不需要点名 \`vbm\`；只要处于项目开发对话，就应自动读取基础记忆，并在收尾时自动整理交接记忆。
- 当用户明确说“使用vbm记下来刚刚的事情”、“使用 vbm 记下来刚刚的事情”或相近表达时，优先触发 \`session-close.mjs\` 更新交接记忆。
- 当用户明确说“使用vbm记住这个 bug”、“使用 vbm 记住这个 bug”、“使用vbm记录这次决策”或“使用 vbm 记录这次决策”时，优先触发正式记忆写入流程。
- 严禁把密码、令牌、私钥或完整连接串写入 \`.ai\`。
- 这个全局区块只负责引导项目记忆，不得覆盖已有全局规则。
${GLOBAL_BLOCK_END}
`;
}

export function upsertGlobalBootstrapBlock(existingText, blockText) {
  const normalized = existingText.replace(/\r\n/g, "\n");
  const { startIndex, endIndex, endMarkerLength } = findGlobalBlock(normalized);

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

export function removeGlobalBootstrapBlock(existingText) {
  const normalized = existingText.replace(/\r\n/g, "\n");
  const { startIndex, endIndex, endMarkerLength } = findGlobalBlock(normalized);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return normalized;
  }

  const before = normalized.slice(0, startIndex).replace(/\s*$/, "");
  const after = normalized.slice(endIndex + endMarkerLength).replace(/^\s*/, "");
  const next = [before, after].filter(Boolean).join("\n\n");
  return next ? `${next}\n` : "";
}

function findGlobalBlock(content) {
  const current = findBlockById(content, GLOBAL_BLOCK_ID);
  if (current.startIndex !== -1) {
    return current;
  }

  for (const blockId of LEGACY_GLOBAL_BLOCK_IDS) {
    const legacy = findBlockById(content, blockId);
    if (legacy.startIndex !== -1) {
      return legacy;
    }
  }

  return {
    startIndex: -1,
    endIndex: -1,
    endMarkerLength: GLOBAL_BLOCK_END.length
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
