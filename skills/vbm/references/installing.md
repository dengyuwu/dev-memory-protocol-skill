# 从已安装 Skill 初始化项目

当 `vbm`（Vibe Memory）已经安装到 Codex 或其他 skill 宿主，但当前项目还没有初始化 `.ai` 时，使用这份说明。

## 目标

在不覆盖用户已有规则的前提下，为当前项目补齐本地记忆层与受控规则区块。

## 步骤

1. 找到这个已安装 skill 的绝对路径。
2. 执行：

```bash
node "<skill-path>/scripts/setup.mjs" --project <目标项目>
```

3. 只有用户明确指定时，才额外传 `--tool codex`、`--tool claude` 或 `--tool both`。
4. 如果没有明确目标，让安装脚本自动判断。

## 预期结果

安装脚本会：

- 在缺失时创建 `.ai/project`、`.ai/memory`、`.ai/index`
- 向 `AGENTS.md`、`CLAUDE.md` 或两者追加受控规则区块
- 为 Codex 追加全局引导
- 为 Claude Code 配置默认项目级 hooks
- 保留受控区块外的用户规则
- 重建记忆索引

## 说明

- 这份说明不依赖仓库根目录的 `bootstrap/` 文件。
- “把 skill 装进 Codex” 不等于 “给当前项目启用开发记忆协议”。
- 如果 skill 已装好，但项目里没有 `.ai/`，说明你还没有对当前项目执行初始化。
- 如果你只想做低阶初始化而不配置全局引导或 hooks，才改用 `install.mjs`。
