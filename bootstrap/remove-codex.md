把这个仓库用于 Codex 项目的开发记忆协议移除。

执行方式：

1. 先读取 `bootstrap/uninstall.md`。
2. 执行 `node ./skills/vbm/scripts/remove.mjs --tool codex --project <目标项目>`。
3. 删除 `AGENTS.md` 中的受控区块，并对称移除 Codex 全局引导。
4. 保留 `.ai/` 目录和记忆文件。
