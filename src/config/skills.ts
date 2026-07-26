import type { Locale } from "./site";

export type SkillGroup = {
  key: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  tools: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    key: "analytics",
    title: { en: "Data Analytics", zh: "数据分析" },
    description: {
      en: "Structured analysis, statistical modelling and simulation for evidence-led questions.",
      zh: "运用结构化分析、统计建模与模拟方法回答以证据为基础的问题。",
    },
    tools: ["Python", "R", "SPSS", "Monte Carlo simulation"],
  },
  {
    key: "database",
    title: { en: "Database & SQL", zh: "数据库与 SQL" },
    description: {
      en: "Relational data design, querying and preparation for repeatable analysis.",
      zh: "面向可复用分析的关系型数据设计、查询与数据准备。",
    },
    tools: ["SQL", "Azure SQL", "Database design"],
  },
  {
    key: "visualisation",
    title: { en: "Visualisation", zh: "数据可视化" },
    description: {
      en: "Clear analytical reporting that connects measures to decisions.",
      zh: "将分析指标与业务决策清晰连接的可视化报告。",
    },
    tools: ["Power BI", "DAX", "Excel"],
  },
  {
    key: "optimisation",
    title: { en: "Optimisation", zh: "优化建模" },
    description: {
      en: "Model formulation, scenario analysis and sensitivity testing.",
      zh: "优化模型构建、情景分析与敏感性测试。",
    },
    tools: ["Excel Solver", "Linear programming", "Sensitivity analysis"],
  },
  {
    key: "supply-chain",
    title: { en: "Supply Chain", zh: "供应链" },
    description: {
      en: "Inventory, transportation and facility-location problem framing.",
      zh: "库存、运输与设施选址问题的分析框架。",
    },
    tools: ["Inventory analytics", "Transportation optimisation", "Facility location"],
  },
  {
    key: "decision-support",
    title: { en: "Business Decision Support", zh: "商业决策支持" },
    description: {
      en: "Translating analytical findings into practical, measurable actions.",
      zh: "将分析发现转化为可执行、可衡量的行动建议。",
    },
    tools: ["Scenario analysis", "Data analysis", "Communication"],
  },
];

export const toolset = [
  "Python",
  "R",
  "SQL",
  "Azure SQL",
  "Power BI",
  "DAX",
  "Excel",
  "Excel Solver",
  "GitHub",
  "VS Code",
];
