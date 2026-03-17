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

安装入口：

- 通用引导：[bootstrap/install.md](./bootstrap/install.md)
- Codex 引导：[bootstrap/codex.md](./bootstrap/codex.md)
- Claude Code 引导：[bootstrap/claude-code.md](./bootstrap/claude-code.md)

安装行为：

- 自动检测当前项目是 `Codex`、`Claude Code` 还是两者都用
- 只在 `AGENTS.md` / `CLAUDE.md` 末尾追加受控规则块
- 初始化 `.ai/project`、`.ai/memory`、`.ai/index`
- 不覆盖用户已有规则和已有记忆文件

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

## 核心脚本

- `install.mjs`：安装协议，追加规则并初始化 `.ai/`
- `uninstall.mjs`：移除协议，只删除受控规则块
- `recall.mjs`：按任务关键词召回相关记忆
- `capture.mjs`：手工写入 bug/decision 记录
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

## 本地命令

```bash
npm run install:auto
npm run uninstall:auto
npm run recall -- --query "refund callback"
npm run capture:diff -- --type bug --query "fix refund status sync"
npm run index
```

## 进一步阅读

- 协议说明：[skills/dev-memory-protocol/references/protocol.md](./skills/dev-memory-protocol/references/protocol.md)
- 回写策略：[skills/dev-memory-protocol/references/writeback-policy.md](./skills/dev-memory-protocol/references/writeback-policy.md)
- Hook 接入建议：[skills/dev-memory-protocol/references/hook-adapters.md](./skills/dev-memory-protocol/references/hook-adapters.md)
