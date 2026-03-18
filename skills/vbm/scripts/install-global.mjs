import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGlobalBootstrapBlock, upsertGlobalBootstrapBlock } from "./lib/global-bootstrap.mjs";
import { readTextMaybe, toPosixPath, writeText } from "./lib/path-utils.mjs";

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const skillRoot = path.resolve(scriptDir, "..");
  const codexHome = path.join(os.homedir(), ".codex");
  const agentsPath = path.join(codexHome, "AGENTS.md");
  const existingText = await readTextMaybe(agentsPath);
  const nextText = upsertGlobalBootstrapBlock(existingText, buildGlobalBootstrapBlock(skillRoot));

  await writeText(agentsPath, nextText);

  console.log(
    JSON.stringify(
      {
        已更新: toPosixPath(agentsPath),
        技能目录: toPosixPath(skillRoot),
        动作: ["已写入全局引导区块"]
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
