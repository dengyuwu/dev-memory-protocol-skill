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
  const scope = args.scope || "all";
  const query = args.query || "";
  const providedPaths = splitList(args.paths);
  const confidence = args.confidence || "medium";
  const write = args.write === "true";

  const candidate = await createDiffCandidate(projectRoot, {
    scope,
    query,
    type: args.type || "auto",
    title: args.title,
    tags: splitList(args.tags),
    paths: providedPaths
  });

  if (write) {
    const created = await writeDiffCandidate(projectRoot, candidate, {
      confidence,
      updatedBy: "capture-from-diff.mjs"
    });
    console.log(
      JSON.stringify(
        {
          ...toDisplayCandidate(candidate),
          已创建: created
        },
        null,
        2
      )
    );
    return;
  }

  console.log(JSON.stringify(toDisplayCandidate(candidate), null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
