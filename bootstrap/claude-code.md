把这个仓库用于 Claude Code 项目的开发记忆协议安装。

推荐一句话：

`帮我从这个仓库安装 vbm（Vibe Memory）skill，并在安装后立即执行仓库 manifest 指定的 install_script，为当前项目完成 .ai 初始化、规则追加和默认 hook 配置：https://github.com/dengyuwu/vibe-memory.git`

执行方式：

1. 先读取 `bootstrap/install.md`。
2. 执行 `node ./skills/vbm/scripts/setup.mjs --tool claude --project <目标项目>`。
3. 明确返回创建和更新了哪些文件。
4. 默认会写入项目级 Claude hooks，不需要再单独补跑 `install-claude-hooks.mjs`。

移除时阅读：

- `bootstrap/remove-claude-code.md`
- `bootstrap/uninstall.md`
