# 从项目中移除开发记忆协议

当用户希望保留 `.ai` 记忆文件，但移除当前项目里的受控规则区块时，使用这份说明。

## 目标

只删除这个 skill 追加的规则区块，不影响用户自己写的规则和保留的项目记忆。

## 步骤

1. 找到当前 skill 的绝对路径。
2. 执行：

```bash
node "<skill-path>/scripts/remove.mjs" --project <目标项目>
```

3. 只有用户明确指定时，才额外传 `--tool codex`、`--tool claude` 或 `--tool both`。
4. 默认保留 `.ai/` 目录和所有记忆文件。

## 预期结果

- `AGENTS.md`、`CLAUDE.md` 中的受控区块被移除
- 如果存在，Codex 全局引导与 Claude hooks 也被对称移除
- 区块外用户规则保持不变
- `.ai/` 中的项目记忆被保留
- `.ai/index/manifest.json` 与 `.ai/index/tags.json` 被重建

## 说明

- 除非用户明确要求，否则不要做删除 `.ai` 的破坏性清理。
- 如果你之前用的是低阶脚本单独安装 hooks 或全局引导，也可以分别执行 `uninstall-global.mjs` 或 `uninstall-claude-hooks.mjs`。
