import path from "node:path";
import { rebuildIndexes } from "./lib/memory-store.mjs";
import { 需要整理的记忆文件 } from "./lib/memory-paths.mjs";
import { fileExists, readTextMaybe, resolveProjectPath, writeText } from "./lib/path-utils.mjs";

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

function compactWhitespace(content) {
  return content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectPath(args.project || ".");

  const compacted = [];
  for (const relativePath of 需要整理的记忆文件) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (!(await fileExists(absolutePath))) {
      continue;
    }

    const normalized = compactWhitespace(await readTextMaybe(absolutePath));
    await writeText(absolutePath, normalized);
    compacted.push(relativePath);
  }

  const result = await rebuildIndexes(projectRoot, {
    最近更新脚本: "compact.mjs"
  });

  console.log(
    JSON.stringify(
      {
        已整理: compacted,
        文件数: result.documents.length
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
