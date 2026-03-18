---
name: vbm
description: Vibe Memory，简称 vbm。用于为 Codex 与 Claude Code 初始化 .ai 项目记忆层、追加受控规则、启用全局引导，并在开发任务中读写已验证记忆。
---

# 开发记忆协议

这个 skill 用来给开发项目安装、启用并维护一套可持续沉淀的本地记忆层。它的正式名称是 `Vibe Memory`，简称 `vbm`。

## 安装到当前项目

1. 阅读 `references/installing.md`。
2. 默认执行 `node "<skill-path>/scripts/setup.mjs" --project <目标项目>`。
3. 只有用户明确指定时，才传 `--tool codex`、`--tool claude` 或 `--tool both`。
4. 推荐安装流程默认包含：
   - 项目规则追加
   - `.ai/` 初始化
   - Codex 全局引导
   - Claude Code hooks 配置
5. 只能追加受控规则区块，不能覆盖用户已有规则。

## 启用全局引导

1. 阅读 `references/global-bootstrap.md`。
2. 执行 `node "<skill-path>/scripts/install-global.mjs"`。
3. 让 skill 自己向 `~/.codex/AGENTS.md` 追加全局受控区块。
4. 以后如果用户要移除，只运行 `uninstall-global.mjs` 删除该受控区块。

## 一步启用

1. 推荐一步启用脚本是 `node "<skill-path>/scripts/setup.mjs" --project <目标项目>`。
2. 它会直接完成项目初始化、Codex 全局引导和 Claude hooks 配置。
3. `post-install.mjs` 继续保留，主要用于已安装 skill 后手工补启用 Codex 全局引导。

## 从当前项目移除

1. 阅读 `references/uninstalling.md`。
2. 默认执行 `node "<skill-path>/scripts/remove.mjs" --project <目标项目>`。
3. 只移除由 skill 管理的规则区块、可选全局引导与可选 Claude hooks。
4. 默认保留 `.ai/` 记忆文件，除非用户明确要求做破坏性清理。

## 日常工作流

- 在改代码前使用 `scripts/recall.mjs`，读取基础记忆并按任务召回相关记录。
- 在修完 bug 或确认决策后使用 `scripts/capture.mjs`，写入结构化问题或决策记录。
- 在有 git 改动时优先使用 `scripts/capture-from-diff.mjs` 生成候选记忆；只有复核后才加 `--write true` 落盘。
- 在每轮任务结束时优先使用 `scripts/session-close.mjs` 更新 `handoff.md`，并根据 diff 自动生成候选记忆。
- 当你希望不点名 skill 也自动收尾时，优先把 `session-close.mjs` 挂到宿主的会话结束 hook 上。
- 批量改动或手工整理后，使用 `scripts/index.mjs` 或 `scripts/compact.mjs` 重建 `.ai/index/`。
- 默认不需要点名 `vbm`；只要已启用全局引导或会话 hook，就应自动读、自动写、自动整理。
- 当用户明确说“使用vbm记下来刚刚的事情”或“使用 vbm 记下来刚刚的事情”时，优先更新 `handoff.md`。
- 当用户明确说“使用vbm记住这个 bug / 使用vbm记录这次决策”或对应带空格表达时，优先写入正式问题记录或决策记录。

## 参考文档

- `references/installing.md`：从已安装 skill 初始化当前项目。
- `references/global-bootstrap.md`：启用或移除全局自动引导。
- `references/uninstalling.md`：从项目中移除协议。
- `references/protocol.md`：目录结构、规则边界和安装契约。
- `references/writeback-policy.md`：什么知识应该写回记忆，什么不该写。
- `references/hook-adapters.md`：如何把读取、召回、候选生成和整理接到 Codex / Claude Code 的工作流里。
