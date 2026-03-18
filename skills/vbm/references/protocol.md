# 协议说明

## 核心目标

开发记忆协议用于把“项目稳定知识”从临时对话中抽离出来，沉淀到项目本地目录里，让 AI 在后续会话中优先读取、检索和复用。

## 目录结构

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

## 规则边界

- `AGENTS.md`、`CLAUDE.md` 里只放协议规则和工作流约束
- 业务事实、配置位置、历史问题、技术决策都放在 `.ai/`
- 协议只能追加受控区块，不能覆盖用户原有规则

## 安装契约

安装时必须满足：

1. 只追加受控规则区块
2. 缺少 `.ai` 时才初始化模板
3. 已存在的记忆文件不得被覆盖
4. 完成后重建 `.ai/index/manifest.json`

## 卸载契约

卸载时必须满足：

1. 只移除受控规则区块
2. 默认保留 `.ai/` 目录与记忆文件
3. 重新生成 `.ai/index/manifest.json`，确保保留记忆仍可检索

## 记忆写入边界

允许写入：

- 稳定事实
- 业务规则
- 已验证的问题根因
- 回归风险
- 已落地的实现决策

禁止写入：

- 密码
- token
- 私钥
- 完整连接串
- 纯猜测、未验证结论、一次性对话废话
