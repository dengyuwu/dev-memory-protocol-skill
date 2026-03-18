# 接入钩子说明

这个 skill 最理想的使用方式，不是手工频繁敲命令，而是把关键脚本接进开发工作流。

如果你希望“不点名 skill 也能自动更新记忆”，关键就在于把开始阶段和结束阶段都接到宿主的 hook 或自动流程里。

默认目标应该是：

- 自动读
- 自动写
- 自动整理

而不是每次都让用户手工说“先召回记忆”。

## 推荐接入点

### 任务开始

- 检查当前目录是否为项目
- 如果缺少 `.ai`，执行 `setup.mjs` 或最低限度执行 `install.mjs`
- 如果 `.ai` 已存在，先读取基础记忆

### 改动前

- 根据任务摘要执行 `recall.mjs`
- 把召回结果作为当前任务上下文的一部分

### 改动后

- 根据 `git diff` 执行 `capture-from-diff.mjs`
- 先生成候选内容，人工或模型复核通过后再 `--write true`

### 任务结束

- 优先执行 `session-close.mjs`
- 让它自动更新 `handoff.md`
- 如果有 diff，就自动调用候选记忆逻辑
- 只有内容已验证时，再正式写入 `bugs/` 或 `decisions/`
- 最后执行索引重建

## 推荐脚本

### 会话开始

```bash
node "<skill-path>/scripts/session-start.mjs" --project "<project-root>"
```

### 会话结束

```bash
node "<skill-path>/scripts/session-close.mjs" --project "<project-root>" --summary "<confirmed summary>"
```

### 会话结束且允许正式落盘

```bash
node "<skill-path>/scripts/session-close.mjs" --project "<project-root>" --summary "<confirmed summary>" --verified true
```

## 最低要求

- 不要跳过“先读基础记忆”这一步
- 不要把未验证候选内容直接落盘
- 不要覆盖用户原有规则

## Codex 建议接法

当前仓库对 Codex 的默认方案是：

- 用 `setup.mjs` 把全局引导区块追加到 `~/.codex/AGENTS.md`
- 让全局引导在项目对话开始时自动检查 `.ai`
- 如果 `.ai` 缺失，就调用 `install.mjs` 自动补建
- 如果 `.ai` 已存在，就要求先读基础记忆
- 在任务收尾时优先执行 `session-close.mjs`

这意味着对 Codex 来说，默认是“靠全局引导自动工作”，而不是要求用户每次点名 `vbm`。

## Claude Code 建议接法

Claude Code 可以进一步接原生 hooks。

安装用户级 hooks：

```bash
node "<skill-path>/scripts/install-claude-hooks.mjs" --scope user
```

安装项目级 hooks：

```bash
node "<skill-path>/scripts/install-claude-hooks.mjs" --scope project --project "<project-root>"
```

安装本地私有 hooks：

```bash
node "<skill-path>/scripts/install-claude-hooks.mjs" --scope local --project "<project-root>"
```

对应关系是：

- `SessionStart` 调 `session-start.mjs`
- `SessionEnd` 调 `session-close.mjs`

移除方式：

```bash
node "<skill-path>/scripts/uninstall-claude-hooks.mjs" --scope user
```

## 显式简称触发

虽然推荐默认自动工作，但也保留简称触发，方便用户临时点名：

- `使用vbm记下来刚刚的事情`
- `使用 vbm 记下来刚刚的事情`
- `使用vbm记住这个 bug`
- `使用vbm记录这次决策`
