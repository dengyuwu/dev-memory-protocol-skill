import {
  buildClaudeHookConfig,
  readJsonMaybe,
  removeClaudeHooks,
  resolveClaudeSettingsPath,
  writeJson
} from "./lib/claude-hooks.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveProjectPath, toPosixPath } from "./lib/path-utils.mjs";

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = args.scope || "user";
  const projectRoot = resolveProjectPath(args.project || ".");
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const skillRoot = path.resolve(scriptDir, "..");
  const settingsPath = resolveClaudeSettingsPath(scope, projectRoot);
  const settings = await readJsonMaybe(settingsPath);
  const next = removeClaudeHooks(settings, buildClaudeHookConfig(skillRoot));

  await writeJson(settingsPath, next);

  console.log(
    JSON.stringify(
      {
        scope,
        已更新: toPosixPath(settingsPath),
        动作: ["已移除 Claude Code 的 vbm hooks"]
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
