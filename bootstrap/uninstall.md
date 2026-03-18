把这个仓库当作“开发记忆协议”的一句话移除目标来使用。

移除约定：

1. 先读取 `bootstrap/manifest.json`。
2. 执行 `node ./skills/vbm/scripts/remove.mjs --project <目标项目>`。
3. 默认移除 `AGENTS.md`、`CLAUDE.md` 中由这个 skill 追加的受控区块。
4. 如果当前安装流程启用了 Codex 全局引导和 Claude hooks，也一并对称移除。
5. 不得修改区块外的用户规则。
6. 默认保留 `.ai/` 里的项目记忆文件。
7. 移除后重新生成 `.ai/index/manifest.json`，让保留的记忆仍可检索。
8. 明确告诉用户哪些规则文件被修改，以及哪些 `.ai` 文件被保留。

一句话移除提示词：

`帮我移除 vbm（Vibe Memory）为当前项目追加的记忆规则：https://github.com/dengyuwu/vibe-memory.git`
