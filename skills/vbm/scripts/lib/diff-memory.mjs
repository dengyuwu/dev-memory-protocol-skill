import path from "node:path";
import { buildFrontmatter, rebuildIndexes } from "./memory-store.mjs";
import { isGitRepository, listChangedFiles, readDiff } from "./git-utils.mjs";
import { 获取记录目录 } from "./memory-paths.mjs";
import { slugify, toPosixPath, writeText } from "./path-utils.mjs";

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isManagedPath(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return (
    normalized === "AGENTS.md" ||
    normalized === "CLAUDE.md" ||
    normalized.startsWith(".ai/")
  );
}

function takeSegments(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return normalized.split("/").filter(Boolean);
}

const GENERIC_TAGS = new Set([
  "src",
  "lib",
  "app",
  "apps",
  "packages",
  "test",
  "tests",
  "spec",
  "main",
  "index",
  "json",
  "js",
  "jsx",
  "ts",
  "tsx",
  "md",
  "yml",
  "yaml"
]);

export function inferTagsFromPaths(paths) {
  const tags = [];
  for (const item of paths) {
    const segments = takeSegments(item);
    for (const segment of segments.slice(0, 3)) {
      if (segment.startsWith(".")) {
        continue;
      }
      if (segment.includes(".")) {
        const base = segment.split(".")[0];
        if (base && !GENERIC_TAGS.has(base.toLowerCase())) {
          tags.push(base.toLowerCase());
        }
        const ext = segment.split(".").pop();
        if (ext && !GENERIC_TAGS.has(ext.toLowerCase())) {
          tags.push(ext.toLowerCase());
        }
        continue;
      }
      if (!GENERIC_TAGS.has(segment.toLowerCase())) {
        tags.push(segment.toLowerCase());
      }
    }
  }

  return unique(tags).slice(0, 8);
}

export function inferType(typeArg, hintText) {
  if (typeArg && typeArg !== "auto") {
    return typeArg;
  }

  const lower = String(hintText || "").toLowerCase();
  if (/(bug|fix|error|issue|regression|hotfix|incident|异常|故障|修复|回归|报错)/.test(lower)) {
    return "bug";
  }

  return "decision";
}

export function inferTitle(type, titleArg, query, changedPaths) {
  if (titleArg) {
    return titleArg;
  }

  if (query) {
    return query.trim();
  }

  const segments = unique(changedPaths.flatMap((item) => takeSegments(item).slice(0, 2))).slice(0, 3);
  if (segments.length === 0) {
    return type === "bug" ? "根据变更补充问题记录" : "根据变更补充决策记录";
  }

  const prefix = type === "bug" ? "检查以下模块的问题修复" : "记录以下模块的实现决策";
  return `${prefix} ${segments.join(", ")}`;
}

export function summarizeDiff(diffText) {
  const lines = String(diffText || "").split(/\r?\n/);
  let additions = 0;
  let deletions = 0;
  const files = new Set();
  const hunks = [];

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (match) {
        files.add(match[2]);
      }
      continue;
    }

    if (line.startsWith("@@")) {
      hunks.push(line.trim());
      continue;
    }

    if (line.startsWith("+++ ") || line.startsWith("--- ")) {
      continue;
    }

    if (line.startsWith("+")) {
      additions += 1;
      continue;
    }

    if (line.startsWith("-")) {
      deletions += 1;
    }
  }

  return {
    changedFiles: Array.from(files),
    additions,
    deletions,
    hunkHeaders: unique(hunks).slice(0, 6)
  };
}

export function buildBody(type, query, changedPaths, diffSummary) {
  const fileList =
    changedPaths.length > 0
      ? changedPaths.map((item) => `- \`${item}\``).join("\n")
      : "- 当前没有检测到可用的变更文件";
  const hunkList =
    diffSummary.hunkHeaders.length > 0
      ? diffSummary.hunkHeaders.map((item) => `- \`${item}\``).join("\n")
      : "- 在最终落盘前，请先人工复核 diff 细节。";

  if (type === "bug") {
    return `## 现象

${query || "概括这次改动所修复的故障、异常或回归问题。"}

## 根因

先结合改动文件进行复核，再把已经验证过的真实根因保留下来。

变更文件：
${fileList}

## 修复

本次 diff 当前新增 ${diffSummary.additions} 行，删除 ${diffSummary.deletions} 行。

关键片段：
${hunkList}

## 回归检查

- 重新验证上面涉及文件对应的核心流程。
- 确认相邻模块、回调链路和边界条件没有被误伤。
- 复核完成后，把这段候选文本改成可复用的最终结论。
`;
  }

  return `## 背景

${query || "概括这次改动对应的实现背景、业务上下文或约束条件。"}

变更文件：
${fileList}

## 决策

本次 diff 当前新增 ${diffSummary.additions} 行，删除 ${diffSummary.deletions} 行。请在复核后写下这次真实生效的决策。

关键片段：
${hunkList}

## 影响

- 复核受影响的下游模块、接口或脚本。
- 把候选文本替换成最终结论、权衡取舍和后续约束。
`;
}

export async function createDiffCandidate(projectRoot, options = {}) {
  const {
    scope = "all",
    query = "",
    type: requestedType = "auto",
    title: requestedTitle = "",
    tags = [],
    paths = []
  } = options;

  if (!["staged", "unstaged", "all"].includes(scope)) {
    throw new Error("只支持 --scope staged、--scope unstaged 或 --scope all。");
  }

  if (!(await isGitRepository(projectRoot))) {
    throw new Error("目标目录不是 git 仓库。");
  }

  const changedPaths = unique([
    ...(await listChangedFiles(projectRoot, scope)),
    ...paths
  ]).filter((item) => !isManagedPath(item));

  if (changedPaths.length === 0) {
    throw new Error("在当前 diff 范围内没有检测到可用于记忆生成的业务变更文件。");
  }

  const diffText = await readDiff(projectRoot, scope, changedPaths);
  const diffSummary = summarizeDiff(diffText);
  const type = inferType(requestedType, `${query} ${requestedTitle}`);
  const title = inferTitle(type, requestedTitle, query, changedPaths);
  const mergedTags = unique([...inferTagsFromPaths(changedPaths), ...tags]).slice(0, 10);
  const body = buildBody(type, query, changedPaths, diffSummary);

  return {
    source: "git-diff",
    scope,
    type,
    title,
    tags: mergedTags,
    paths: changedPaths.map((item) => toPosixPath(item)),
    additions: diffSummary.additions,
    deletions: diffSummary.deletions,
    body
  };
}

export function toDisplayCandidate(candidate) {
  return {
    来源: candidate.source,
    范围: candidate.scope,
    类型: candidate.type,
    标题: candidate.title,
    标签: candidate.tags,
    路径: candidate.paths,
    新增行数: candidate.additions,
    删除行数: candidate.deletions,
    正文: candidate.body
  };
}

export async function writeDiffCandidate(projectRoot, candidate, options = {}) {
  const {
    confidence = "medium",
    updatedBy = "capture-from-diff.mjs"
  } = options;

  const recordDate = new Date().toISOString().slice(0, 10);
  const fileName = `${recordDate}-${slugify(candidate.title)}.md`;
  const targetPath = path.join(projectRoot, ...获取记录目录(candidate.type).split("/"), fileName);

  const frontmatter = buildFrontmatter({
    type: candidate.type,
    scope: "project",
    tags: candidate.tags,
    paths: candidate.paths,
    last_verified: recordDate,
    confidence
  });

  await writeText(targetPath, `${frontmatter}${candidate.body.trim()}\n`);
  await rebuildIndexes(projectRoot, {
    最近更新脚本: updatedBy
  });

  return toPosixPath(path.relative(projectRoot, targetPath));
}
