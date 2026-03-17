# Dev Memory Protocol Skill

一个面向开发场景的项目记忆协议仓库，用来给 `Codex` 和 `Claude Code` 安装同一套可追加、可移除、可持续沉淀的项目记忆层。

目标：

- 减少每次新会话重复解释项目背景
- 减少同一个 bug 被反复修错
- 在修改代码前自动召回相关业务规则、历史 bug 和决策记录
- 不覆盖用户原有 `AGENTS.md` / `CLAUDE.md` 规则

## 适用范围

- 平台：Windows、macOS
- 运行时：Node.js 18+
- 工具：Codex、Claude Code

## 一句话安装

把这个仓库链接发给 AI，然后使用下面这句话：

```text
帮我从这个仓库安装 dev-memory-protocol：https://github.com/dengyuwu/dev-memory-protocol-skill
```

如果你希望安装后立刻启用全局自动引导，并在当前目录是项目时顺手初始化 `.ai`，推荐紧接着执行：

```bash
node "<installed-skill-path>/scripts/post-install.mjs" --project .
```

安装入口：

- 通用引导：[bootstrap/install.md](./bootstrap/install.md)
- Codex 引导：[bootstrap/codex.md](./bootstrap/codex.md)
- Claude Code 引导：[bootstrap/claude-code.md](./bootstrap/claude-code.md)

安装行为：

- 自动检测当前项目是 `Codex`、`Claude Code` 还是两者都用
- 只在 `AGENTS.md` / `CLAUDE.md` 末尾追加受控规则块
- 初始化 `.ai/project`、`.ai/memory`、`.ai/index`
- 不覆盖用户已有规则和已有记忆文件
- 安装完成后，推荐通过 hook 自动执行读取、召回、候选生成和整理流程

## 重要说明

“把 skill 安装进 Codex” 和 “把协议初始化到当前项目” 不是一回事。

- 安装到 Codex：只是让 Codex 认识这个 skill
- 初始化到项目：才会真正生成 `.ai/` 并写入 `AGENTS.md` / `CLAUDE.md`

如果你已经把 skill 安装进 Codex，但项目里还没有 `.ai/`，说明当前项目还没有执行初始化。

这时应该让 AI 使用这个 skill 对当前项目执行初始化，或者直接运行：

```bash
node "<installed-skill-path>/scripts/install.mjs" --project .
```

如果你希望以后每次进入项目对话都能自动检查 `.ai`、不存在就初始化，那么还需要额外启用一次**全局 bootstrap**：

```bash
node "<installed-skill-path>/scripts/install-global.mjs"
```

这个全局 bootstrap 也是由 skill 自己追加受控区块到 `~/.codex/AGENTS.md`，不是手工硬改。

如果你想一步完成“启用全局 bootstrap + 初始化当前项目”，用 `post-install.mjs` 就行，不必分开执行两条命令。

## 一句话移除

如果你想移除这个协议，把仓库链接发给 AI，然后使用下面这句话：

```text
从这个 GitHub 仓库为当前项目移除 dev-memory-protocol，只删除它在 AGENTS.md/CLAUDE.md 中追加的受控规则块，保留 .ai 里的项目记忆文件，并保持其他项目规则不变：<repo-url>
```

移除入口：

- 通用引导：[bootstrap/uninstall.md](./bootstrap/uninstall.md)
- Codex 移除引导：[bootstrap/remove-codex.md](./bootstrap/remove-codex.md)
- Claude Code 移除引导：[bootstrap/remove-claude-code.md](./bootstrap/remove-claude-code.md)

移除行为：

- 只删除受控规则块
- 不修改区块外的用户规则
- 默认保留 `.ai/` 里的项目记忆
- 重新生成索引，保持保留记忆仍可检索

## 仓库结构

```text
bootstrap/
  install.md
  uninstall.md
  codex.md
  claude-code.md
skills/
  dev-memory-protocol/
    SKILL.md
    scripts/
    references/
    assets/templates/
package.json
README.md
```

## 默认工作流

安装之后，推荐把这个 skill 接到 `Codex` 或 `Claude Code` 的 hook 上，让它自动完成下面这些事：

1. 任务开始时自动读取基础记忆
   - `.ai/project/overview.md`
   - `.ai/project/config-map.md`
   - `.ai/memory/handoff.md`
   - `.ai/memory/known-risks.md`
2. 编辑前自动按当前任务召回相关 bug、decision、risk
3. 修改后自动基于 `git diff` 生成候选记忆
4. 任务结束后自动重建索引并整理记忆

这才是这个 skill 的主使用方式。

`recall.mjs`、`capture.mjs`、`index.mjs` 这些命令仍然保留，但它们主要是：

- 调试自动流程
- 在没有 hook 的环境下兜底使用
- 手工补录特别重要的 bug 或 decision

## 核心脚本

- `install.mjs`：安装协议，追加规则并初始化 `.ai/`
- `post-install.mjs`：启用全局 bootstrap，并在当前目录是项目时立即初始化 `.ai/`
- `install-global.mjs`：由 skill 为 Codex 安装全局自动引导区块
- `uninstall.mjs`：移除协议，只删除受控规则块
- `uninstall-global.mjs`：移除 skill 追加的全局自动引导区块
- `recall.mjs`：供 hook 或调试流程使用的记忆召回底层能力
- `capture.mjs`：手工写入 bug/decision 记录的兜底入口
- `capture-from-diff.mjs`：根据当前 `git diff` 生成候选记忆，显式 `--write true` 才落盘
- `index.mjs`：重建 `.ai/index`
- `compact.mjs`：整理基础记忆文件格式

## 设计约束

- 规则文件只放协议，不放业务事实
- 项目事实、业务规则、历史 bug、技术决策都放在 `.ai/`
- 默认只写入“已验证、可复用、项目相关”的知识
- 不允许把密码、token、私钥、完整连接串写入记忆
- 项目级记忆优先于全局偏好

## 记忆目录

```text
.ai/
├── project/
│   ├── overview.md
│   ├── architecture.md
│   ├── config-map.md
│   └── business-rules.md
├── memory/
│   ├── handoff.md
│   ├── known-risks.md
│   ├── regression-checklist.md
│   ├── bugs/
│   └── decisions/
└── index/
    ├── manifest.json
    └── tags.json
```

## 手动命令

这些命令不是日常主流程，而是给没有接 hook 的项目、调试场景、或手动补录使用：

```bash
npm run install:auto
npm run install:enable
npm run install:global
npm run uninstall:auto
npm run uninstall:global
npm run recall -- --query "refund callback"
npm run capture:diff -- --type bug --query "fix refund status sync"
npm run index
```

## 进一步阅读

- 协议说明：[skills/dev-memory-protocol/references/protocol.md](./skills/dev-memory-protocol/references/protocol.md)
- 全局引导：[skills/dev-memory-protocol/references/global-bootstrap.md](./skills/dev-memory-protocol/references/global-bootstrap.md)
- 回写策略：[skills/dev-memory-protocol/references/writeback-policy.md](./skills/dev-memory-protocol/references/writeback-policy.md)
- Hook 接入建议：[skills/dev-memory-protocol/references/hook-adapters.md](./skills/dev-memory-protocol/references/hook-adapters.md)
