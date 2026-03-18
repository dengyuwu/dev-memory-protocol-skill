# Vibe Memory Skill

这是一个面向开发场景的 `Vibe Memory` 仓库，简称 `vbm`，用来给 `Codex` 和 `Claude Code` 安装同一套可追加、可移除、可持续沉淀的本地记忆层。

它要解决的问题很直接：

- 每次新开 CLI 会话，都要重新解释项目背景
- 同一个 bug 因为忘了历史结论被反复修错
- 改 A 容易带坏 B，但之前踩过的坑没有被稳定沉淀
- 配置位置、业务规则、回归高危点散落在对话里，下一次根本找不回来

这个 skill 的目标，就是让 AI 在开发项目里做到：

- 自动初始化 `.ai` 记忆层
- 只追加规则，不覆盖用户原有 `AGENTS.md` / `CLAUDE.md`
- 尽量在任务开始时自动读基础记忆、编辑前自动召回相关记录
- 在改动后自动生成候选问题记录 / 决策记录
- 让后续对话优先复用已验证知识，而不是重新猜

## 适用范围

- 平台：Windows、macOS
- 运行时：Node.js 18+
- 工具：Codex、Claude Code

## 一句话安装

把这个仓库链接发给 AI，直接说：

```text
帮我从这个仓库安装 vbm（Vibe Memory）skill，并在安装后立即执行仓库 manifest 指定的 install_script，为当前项目完成 .ai 初始化、规则追加和默认 hook 配置：https://github.com/dengyuwu/vibe-memory.git
```

现在这句默认就应该完成推荐安装流程，也就是：

- 初始化当前项目 `.ai`
- 追加项目规则区块
- 为 Codex 追加全局引导
- 为 Claude Code 配置 hooks

如果你是手工执行，安装完成后再运行这一步启用：

```bash
node "<已安装的-skill-路径>/scripts/setup.mjs" --project .
```

这一步会做三件事：

- 初始化当前项目记忆层与规则区块
- 把 skill 管理的全局引导区块追加到 `~/.codex/AGENTS.md`
- 为 Claude Code 写入项目级 hooks，默认写到 `.claude/settings.json`

## 一句话移除

把这个仓库链接发给 AI，直接说：

```text
帮我移除 vbm（Vibe Memory）为当前项目追加的记忆规则：https://github.com/dengyuwu/vibe-memory.git
```

如果只想移除全局引导，而不动当前项目规则，执行：

```bash
node "<已安装的-skill-路径>/scripts/uninstall-global.mjs"
```

如果你希望对称移除推荐安装追加的内容，执行：

```bash
node "<已安装的-skill-路径>/scripts/remove.mjs" --project .
```

## 安装后会修改哪些文件

- 在项目根目录创建 `.ai/`
- 在 `.ai/project/` 下生成基础项目记忆模板
- 在 `.ai/memory/` 下生成交接、风险、回归检查和记录目录
- 在 `.ai/index/` 下生成索引文件
- 向项目根目录的 `AGENTS.md`、`CLAUDE.md` 追加一个受控规则区块
- 向 `~/.codex/AGENTS.md` 追加一个全局引导区块
- 在 Claude 项目里向 `.claude/settings.json` 追加 `SessionStart` / `SessionEnd` hooks

## 会生成哪些文件

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

后续新增的问题记录、决策记录文件名仍然会沿用用户标题；如果标题是中文，文件名也会保留中文，例如：

```text
.ai/memory/bugs/2026-03-18-修复退款状态回写异常.md
.ai/memory/decisions/2026-03-18-统一订单超时关闭策略.md
```

## 默认工作流

这个 skill 的推荐使用方式不是“手工召回”，而是“自动读、自动写、自动整理”。

推荐接法：

1. 任务开始时自动检查当前项目是否存在 `.ai`
2. 如果不存在，就自动初始化
3. 如果存在，就先读取基础记忆：
   - `.ai/project/overview.md`
   - `.ai/project/config-map.md`
   - `.ai/memory/handoff.md`
   - `.ai/memory/known-risks.md`
4. 在改代码前，按当前任务自动召回相关问题记录、决策记录、业务规则
5. 在实现完成后，根据 `git diff` 生成候选记忆
6. 只有确认内容真实、稳定、可复用后，才写回 `.ai`
7. 最后重建索引，方便下一次继续读

如果你希望“不点名 skill，也能在每轮对话结束后自动写记忆”，推荐这样理解：

- `handoff.md` 可以默认每轮自动更新
- `bugs/`、`decisions/` 这类正式记忆，应该先自动生成候选，再在已验证时正式落盘

仓库里已经提供了两个专门脚本：

- `session-close.mjs`：每轮结束时自动更新 `.ai/memory/handoff.md`，并尝试根据当前 diff 生成候选记忆
- `auto-capture.mjs`：专门处理“有 diff 时自动生成候选，满足条件再正式写入”

`recall.mjs`、`capture.mjs`、`index.mjs` 这些命令仍然保留，但它们主要用于：

- 调试自动流程
- 在没有 hook 的环境下兜底
- 手工补录特别重要的问题或决策

默认情况下，安装好并启用后，不应该每次都点名 `vbm`。

更合理的方式是：

- 进入项目对话时自动检查并读取基础记忆
- 改动结束后自动更新 `handoff.md`
- 有 diff 时自动生成候选记忆
- 只有内容已验证时才正式写入 `bugs/` 或 `decisions/`

如果你想显式点名简称，也可以直接这样说：

```text
使用vbm记下来刚刚的事情
```

```text
使用 vbm 记下来刚刚的事情
```

```text
使用vbm记住这个 bug 的根因
```

```text
使用 vbm 记住这个 bug 的根因
```

```text
使用vbm记录这次决策
```

```text
使用 vbm 记录这次决策
```

推荐约定是：

- “使用 vbm 记下来刚刚的事情” 优先更新 `handoff.md`
- “使用 vbm 记住这个 bug” 优先写入 `bugs/`
- “使用 vbm 记录这次决策” 优先写入 `decisions/`

## 核心脚本

- `setup.mjs`：推荐安装入口，一次完成项目初始化、Codex 全局引导和 Claude hooks 配置
- `install.mjs`：低阶安装入口，只给当前项目追加规则并初始化 `.ai`
- `post-install.mjs`：低阶补启用入口，用于手工补跑 Codex 全局引导
- `install-global.mjs`：只启用全局引导区块
- `remove.mjs`：推荐移除入口，对称移除项目规则、Codex 全局引导和 Claude hooks
- `uninstall.mjs`：低阶移除入口，只从当前项目移除受控规则区块
- `uninstall-global.mjs`：移除全局引导区块
- `recall.mjs`：读取基础记忆并检索相关记录
- `capture.mjs`：手工写入问题记录或决策记录
- `capture-from-diff.mjs`：根据当前 `git diff` 生成候选记忆，只有显式 `--write true` 才会落盘
- `auto-capture.mjs`：在会话收尾或 hook 中自动处理 diff 候选记忆
- `session-close.mjs`：会话结束时更新 `handoff.md`，并串联自动候选捕获与索引重建
- `index.mjs`：重建 `.ai/index`
- `compact.mjs`：整理基础记忆文件格式

## 手工命令

```bash
npm run install:auto
npm run install:enable
npm run install:global
npm run install:base
npm run uninstall:auto
npm run uninstall:global
npm run uninstall:base
npm run recall -- --query "退款回调"
npm run capture:diff -- --type bug --query "修复退款状态回写"
npm run capture:auto -- --summary "本轮修复退款状态回写"
npm run session:close -- --summary "本轮已完成退款状态回写修复" --open-questions "退款回调重试是否需要补测" --next-checks "检查退款回调集成测试"
npm run index
```

## 设计约束

- 规则文件只放协议，不放业务事实
- 业务事实、配置位置、历史 bug、技术决策都沉淀到 `.ai/`
- 只允许写回“已验证、可复用、项目相关”的知识
- 严禁把密码、token、私钥、完整连接串写进记忆文件
- 项目记忆优先于全局偏好
- 新的已验证记录优先于旧记录

## 中文化约束说明

本仓库会尽量让规则内容、Markdown 文档、生成的记忆文件名和正文都使用中文。

但下面这些文件名属于宿主工具约定，不能随意改名，否则工具不会识别：

- `README.md`
- `SKILL.md`
- `AGENTS.md`
- `CLAUDE.md`

所以这里采取的策略是：

- 宿主工具约定文件名保持平台要求不变
- 仓库里的说明文档和脚本路径保持英文，降低兼容风险
- 文件正文、规则内容、模板内容、生成的记忆正文统一使用中文
- 记录文件名默认跟随标题；标题是中文时，文件名也会保留中文

## 仓库结构

```text
bootstrap/
  install.md
  uninstall.md
  codex.md
  claude-code.md
  remove-codex.md
  remove-claude-code.md
skills/
  vbm/
    SKILL.md
    scripts/
    references/
    assets/templates/
package.json
README.md
```

## 进一步阅读

- 安装项目说明：[skills/vbm/references/installing.md](./skills/vbm/references/installing.md)
- 全局引导说明：[skills/vbm/references/global-bootstrap.md](./skills/vbm/references/global-bootstrap.md)
- 协议说明：[skills/vbm/references/protocol.md](./skills/vbm/references/protocol.md)
- 回写策略：[skills/vbm/references/writeback-policy.md](./skills/vbm/references/writeback-policy.md)
- 接入钩子说明：[skills/vbm/references/hook-adapters.md](./skills/vbm/references/hook-adapters.md)
