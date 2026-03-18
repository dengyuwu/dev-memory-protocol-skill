把这个仓库当作“开发记忆协议”的一句话安装目标来使用。

安装约定：

1. 先读取 `bootstrap/manifest.json`。
2. 识别用户当前要给哪个工具接入：
   - 用户明确说只给 Codex 用，才传 `--tool codex`
   - 用户明确说只给 Claude Code 用，才传 `--tool claude`
   - 用户明确说两个都要，才传 `--tool both`
   - 其他情况让安装脚本自动检测，不主动传 `--tool`
3. 执行 `node ./skills/vbm/scripts/setup.mjs --project <目标项目>`。
4. 默认推荐安装流程应一次完成：
   - 项目规则追加
   - `.ai/` 初始化
   - Codex 全局引导
   - Claude Code hooks 配置
5. 只追加受控规则区块，不能覆盖用户原有规则。
6. 如果 `.ai/` 已存在，就保留已有内容。
7. 明确告诉用户哪些文件被创建，哪些文件被更新。
8. 如果用户明确不想安装 Claude hooks，才额外传 `--skip-claude-hooks true`。
9. 如果用户明确不想启用 Codex 全局引导，才额外传 `--skip-global true`。
10. 安装完成后的回执必须明确说明：
   - 本次依据的是 `bootstrap/manifest.json`
   - 已执行 manifest 指定的 `install_script`
   - 哪些内容已经初始化成功
   - “重启 Codex”只用于让后续新会话重新发现 skill，不是当前项目初始化成功的前置条件

推荐一句话安装提示词：

`帮我从这个仓库安装 vbm（Vibe Memory）skill，并在安装后立即执行仓库 manifest 指定的 install_script，为当前项目完成 .ai 初始化、规则追加和默认 hook 配置：https://github.com/dengyuwu/vibe-memory.git`
