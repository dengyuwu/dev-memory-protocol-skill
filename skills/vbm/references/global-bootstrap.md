# 全局引导说明

这份说明用于启用或移除由 skill 自己管理的全局引导区块。

## 为什么需要全局引导

仅仅把 skill 安装进 Codex，并不会自动修改 `~/.codex/AGENTS.md`，也不会自动初始化你每一个项目。

不过当前仓库的推荐安装器 `setup.mjs` 已经会顺手完成这一步；本页更适合手工精细控制时阅读。

全局引导的作用是：

- 在后续项目对话里优先检查当前目录是否为项目根目录
- 如果项目还没有 `.ai`，就提示或执行初始化
- 如果项目已经有 `.ai`，就要求先读基础记忆，再开始改代码
- 尽量让项目开发对话默认自动读、自动写、自动整理，而不是每次都点名 `vbm`

## 启用方式

执行：

```bash
node "<skill-path>/scripts/install-global.mjs"
```

这只会向 `~/.codex/AGENTS.md` 追加一个受控区块，不会覆盖你已有的全局规则。

## 一步启用方式

如果用户希望安装完 skill 后立刻启用，而且当前目录正好是项目，可以直接执行：

```bash
node "<skill-path>/scripts/setup.mjs" --project .
```

它会：

- 先初始化当前项目规则与 `.ai`
- 先写入全局引导区块
- 再为 Claude Code 补上项目级 hooks
- 这样当前 CLI 窗口即使还没重载 skill 列表，也能立刻开始用脚本工作

## 移除方式

执行：

```bash
node "<skill-path>/scripts/uninstall-global.mjs"
```

这只会删除由 skill 写入的全局受控区块。
