import { createDiffCandidate, toDisplayCandidate, writeDiffCandidate } from "./lib/diff-memory.mjs";
import { rebuildAfterHandoff, writeHandoff } from "./lib/handoff-store.mjs";
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
  const summary = args.summary || "本轮会话已结束，请结合当前 diff 和相关模块继续推进。";
  const openQuestions = splitList(args["open-questions"]);
  const nextChecks = splitList(args["next-checks"]);
  const autoCapture = args["auto-capture"] !== "false";
  const verified = args.verified === "true";
  const forceWrite = args.write === "true";
  const confidence = args.confidence || "medium";

  const actions = [];
  const handoffPath = await writeHandoff(projectRoot, {
    summary,
    openQuestions,
    nextChecks
  });
  actions.push(`已更新 ${handoffPath}`);

  let candidateOutput = null;
  let created = "";

  if (autoCapture) {
    try {
      const candidate = await createDiffCandidate(projectRoot, {
        scope: args.scope || "all",
        query: args.query || summary,
        type: args.type || "auto",
        title: args.title,
        tags: splitList(args.tags),
        paths: splitList(args.paths)
      });

      candidateOutput = toDisplayCandidate(candidate);
      if (forceWrite || verified) {
        created = await writeDiffCandidate(projectRoot, candidate, {
          confidence,
          updatedBy: "session-close.mjs"
        });
        actions.push(`已写入正式记忆 ${created}`);
      } else {
        actions.push("已生成候选记忆，未正式落盘");
      }
    } catch (error) {
      actions.push(`已跳过 diff 记忆捕获：${error.message}`);
    }
  }

  if (!created) {
    const fileCount = await rebuildAfterHandoff(projectRoot, "session-close.mjs");
    actions.push(`已重建索引，当前记忆文件数 ${fileCount}`);
  }

  const result = {
    项目根目录: projectRoot.replace(/\\/g, "/"),
    动作: actions
  };

  if (candidateOutput) {
    result.候选记忆 = candidateOutput;
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
