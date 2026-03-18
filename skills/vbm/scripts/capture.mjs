import fs from "node:fs/promises";
import path from "node:path";
import { buildFrontmatter, rebuildIndexes } from "./lib/memory-store.mjs";
import { 获取记录目录 } from "./lib/memory-paths.mjs";
import { resolveProjectPath, slugify, toPosixPath, writeText } from "./lib/path-utils.mjs";

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

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDefaultBody(type) {
  if (type === "bug") {
    return `## 现象

描述实际观察到的故障、异常或回归表现。

## 根因

写清已经验证过的根因，不要保留猜测。

## 修复

说明最终采取的修复方式，以及关键修改点。

## 回归检查

列出下次修改相关模块时必须重新检查的流程与风险点。
`;
  }

  return `## 背景

描述触发这次决策的业务背景、实现上下文或约束条件。

## 决策

说明最终采用的方案，以及为什么这样选。

## 影响

记录这次决策带来的收益、代价、限制和后续注意事项。
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectPath(args.project || ".");
  const type = args.type || "bug";
  const title = args.title;

  if (!["bug", "decision"].includes(type)) {
    throw new Error("只支持 --type bug 或 --type decision。");
  }

  if (!title) {
    throw new Error("缺少必填参数 --title。");
  }

  let body = args.body || "";
  if (!body && args["body-file"]) {
    body = await fs.readFile(path.resolve(process.cwd(), args["body-file"]), "utf8");
  }
  if (!body) {
    body = buildDefaultBody(type);
  }

  const recordDate = new Date().toISOString().slice(0, 10);
  const fileName = `${recordDate}-${slugify(title)}.md`;
  const targetPath = path.join(projectRoot, ...获取记录目录(type).split("/"), fileName);

  const frontmatter = buildFrontmatter({
    type,
    scope: "project",
    tags: splitList(args.tags),
    paths: splitList(args.paths),
    last_verified: recordDate,
    confidence: args.confidence || "medium"
  });

  await writeText(targetPath, `${frontmatter}${body.trim()}\n`);
  await rebuildIndexes(projectRoot, {
    最近更新脚本: "capture.mjs"
  });

  console.log(
    JSON.stringify(
      {
        已创建: toPosixPath(path.relative(projectRoot, targetPath))
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
