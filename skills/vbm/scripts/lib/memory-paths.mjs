export const 记忆路径 = {
  AI目录: ".ai",
  项目目录: ".ai/project",
  记忆目录: ".ai/memory",
  索引目录: ".ai/index",
  问题记录目录: ".ai/memory/bugs",
  决策记录目录: ".ai/memory/decisions",
  项目概览: ".ai/project/overview.md",
  架构设计: ".ai/project/architecture.md",
  配置映射: ".ai/project/config-map.md",
  业务规则: ".ai/project/business-rules.md",
  交接记录: ".ai/memory/handoff.md",
  已知风险: ".ai/memory/known-risks.md",
  回归检查清单: ".ai/memory/regression-checklist.md",
  索引清单: ".ai/index/manifest.json",
  索引标签: ".ai/index/tags.json"
};

export const 基础记忆文件 = [
  记忆路径.项目概览,
  记忆路径.配置映射,
  记忆路径.交接记录,
  记忆路径.已知风险
];

export const 需要整理的记忆文件 = [
  记忆路径.项目概览,
  记忆路径.配置映射,
  记忆路径.业务规则,
  记忆路径.交接记录,
  记忆路径.已知风险,
  记忆路径.回归检查清单
];

export function 获取记录目录(类型) {
  return 类型 === "bug" ? 记忆路径.问题记录目录 : 记忆路径.决策记录目录;
}
