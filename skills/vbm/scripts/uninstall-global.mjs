import os from "node:os";
import path from "node:path";
import { removeGlobalBootstrapBlock } from "./lib/global-bootstrap.mjs";
import { fileExists, readTextMaybe, toPosixPath, writeText } from "./lib/path-utils.mjs";

async function main() {
  const agentsPath = path.join(os.homedir(), ".codex", "AGENTS.md");

  if (!(await fileExists(agentsPath))) {
    console.log(
      JSON.stringify(
        {
          已更新: toPosixPath(agentsPath),
          动作: ["已跳过不存在的全局 AGENTS.md"]
        },
        null,
        2
      )
    );
    return;
  }

  const existingText = await readTextMaybe(agentsPath);
  const nextText = removeGlobalBootstrapBlock(existingText);

  if (nextText === existingText.replace(/\r\n/g, "\n")) {
    console.log(
      JSON.stringify(
        {
          已更新: toPosixPath(agentsPath),
          动作: ["没有找到全局引导区块"]
        },
        null,
        2
      )
    );
    return;
  }

  await writeText(agentsPath, nextText);

  console.log(
    JSON.stringify(
      {
        已更新: toPosixPath(agentsPath),
        动作: ["已移除全局引导区块"]
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
