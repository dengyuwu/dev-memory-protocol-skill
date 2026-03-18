import fs from "node:fs/promises";
import path from "node:path";
import { 记忆路径 } from "./memory-paths.mjs";
import { ensureDir, fileExists, toPosixPath, writeText } from "./path-utils.mjs";

const 前言字段映射 = {
  类型: "type",
  范围: "scope",
  标签: "tags",
  路径: "paths",
  最后验证: "last_verified",
  置信度: "confidence"
};

const 反向前言字段映射 = Object.fromEntries(
  Object.entries(前言字段映射).map(([中文字段, 英文字段]) => [英文字段, 中文字段])
);

export async function walkMarkdownFiles(rootDir) {
  if (!(await fileExists(rootDir))) {
    return [];
  }

  const results = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

export async function loadMemoryDocuments(projectRoot) {
  const aiRoot = path.join(projectRoot, 记忆路径.AI目录);
  const files = await walkMarkdownFiles(aiRoot);
  const documents = [];

  for (const absolutePath of files) {
    if (path.basename(absolutePath).startsWith("_")) {
      continue;
    }

    const relativePath = toPosixPath(path.relative(projectRoot, absolutePath));
    const content = await fs.readFile(absolutePath, "utf8");
    documents.push({
      absolutePath,
      path: relativePath,
      content,
      frontmatter: parseFrontmatter(content)
    });
  }

  return documents;
}

export function parseFrontmatter(content) {
  const normalized = String(content || "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return {};
  }

  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return {};
  }

  const block = normalized.slice(4, endIndex);
  const result = {};

  for (const line of block.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    const normalizedKey = 前言字段映射[key] || key;

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      result[normalizedKey] = rawValue
        .slice(1, -1)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      continue;
    }

    result[normalizedKey] = rawValue;
  }

  return result;
}

export function buildFrontmatter(record) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(record)) {
    const outputKey = 反向前言字段映射[key] || key;
    if (Array.isArray(value)) {
      lines.push(`${outputKey}: [${value.join(", ")}]`);
      continue;
    }

    lines.push(`${outputKey}: ${value}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

export async function rebuildIndexes(projectRoot, metadata = {}) {
  const documents = await loadMemoryDocuments(projectRoot);
  const tags = {};

  for (const document of documents) {
    const recordTags = Array.isArray(document.frontmatter.tags) ? document.frontmatter.tags : [];
    for (const tag of recordTags) {
      if (!tags[tag]) {
        tags[tag] = [];
      }
      tags[tag].push(document.path);
    }
  }

  const indexRoot = path.join(projectRoot, 记忆路径.索引目录);
  await ensureDir(indexRoot);

  const manifest = {
    管理器: "vbm",
    版本: "0.1.0",
    生成时间: new Date().toISOString(),
    文件数: documents.length,
    ...metadata
  };

  const tagIndex = {
    生成时间: new Date().toISOString(),
    记录: Object.fromEntries(
      Object.entries(tags).sort(([left], [right]) => left.localeCompare(right))
    )
  };

  await writeText(path.join(indexRoot, path.basename(记忆路径.索引清单)), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeText(path.join(indexRoot, path.basename(记忆路径.索引标签)), `${JSON.stringify(tagIndex, null, 2)}\n`);

  return { manifest, tagIndex, documents };
}
