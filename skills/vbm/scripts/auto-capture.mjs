import { createDiffCandidate, toDisplayCandidate, writeDiffCandidate } from "./lib/diff-memory.mjs";
import { resolveProjectPath } from "./lib/path-utils.mjs";

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectPath(args.project || ".");
  const query = args.query || args.summary || "";
  const confidence = args.confidence || "medium";
  const verified = args.verified === "true";
  const forceWrite = args.write === "true";

  try {
    const candidate = await createDiffCandidate(projectRoot, {
      scope: args.scope || "all",
      query,
      type: args.type || "auto",
      title: args.title,
      tags: splitList(args.tags),
      paths: splitList(args.paths)
    });

    const display = toDisplayCandidate(candidate);
    if (forceWrite || verified) {
      const created = await writeDiffCandidate(projectRoot, candidate, {
        confidence,
        updatedBy: "auto-capture.mjs"
      });

      console.log(
        JSON.stringify(
          {
            模式: "已写入",
            ...display,
            已创建: created
          },
          null,
          2
        )
      );
      return;
    }

    console.log(
      JSON.stringify(
        {
          模式: "候选",
          提示: "当前只生成候选记忆，未正式落盘。传 --verified true 或 --write true 可正式写入。",
          ...display
        },
        null,
        2
      )
    );
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          模式: "跳过",
          原因: error.message
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
