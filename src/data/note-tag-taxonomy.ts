import type { CollectionEntry } from "astro:content";

export interface CanonicalNoteTag {
  label: string;
  description: string;
}

export const canonicalNoteTags: CanonicalNoteTag[] = [
  {
    label: "数据理解",
    description: "描述分布、相关关系、异常结构与探索性分析。",
  },
  {
    label: "统计推断",
    description: "概率、抽样、估计、区间与假设检验。",
  },
  {
    label: "回归建模",
    description: "线性、非线性与分类结果的解释和预测。",
  },
  {
    label: "模型诊断",
    description: "残差、共线性、杠杆点、影响点与模型条件。",
  },
  {
    label: "机器学习",
    description: "变量选择、正则化、降维、聚类与预测建模。",
  },
  {
    label: "SQL",
    description: "关系数据查询、排序、聚合、连接与数据修改。",
  },
  {
    label: "数据建模",
    description: "关系结构、键、约束、索引、事务与数据粒度。",
  },
  {
    label: "数据处理",
    description: "读取、清洗、筛选、转换、分组与可复查流程。",
  },
  {
    label: "优化建模",
    description: "目标、决策变量、约束、敏感性与 LP/MILP。",
  },
  {
    label: "供应链",
    description: "运输、网络、容量、生产、库存与跨期履约。",
  },
];

const diagnosticRegressionSlugs = new Set([
  "regression-diagnostics",
  "multiple-regression-multicollinearity",
  "influential-observations",
]);

const machineLearningRegressionSlugs = new Set(["regression-feature-selection"]);

const structuralSqlSlugs = new Set([
  "sql-relational-data",
  "sql-primary-key",
  "sql-foreign-key",
  "sql-relationships",
]);

const querySqlSlugs = new Set([
  "sql-select",
  "sql-where",
  "sql-projection",
  "sql-order-by",
  "sql-pagination",
]);

const supplyChainDecisionSlugs = new Set([
  "transportation-models",
  "multi-period-production-inventory",
]);

function pushUnique(target: string[], label: string) {
  if (!target.includes(label)) target.push(label);
}

export function getCanonicalNoteTags(entry: CollectionEntry<"notes">): string[] {
  const tags: string[] = [];
  const { seriesSlug, slug } = entry.data;
  const sourceText = [
    ...entry.data.tags,
    ...entry.data.topics,
    ...entry.data.tools,
    entry.data.series ?? "",
    entry.data.title,
  ]
    .join(" ")
    .toLocaleLowerCase();

  if (seriesSlug === "r-statistics") {
    pushUnique(tags, "数据理解");
    pushUnique(tags, "统计推断");
  }

  if (seriesSlug === "regression") {
    pushUnique(tags, "回归建模");
    if (diagnosticRegressionSlugs.has(slug)) pushUnique(tags, "模型诊断");
    if (machineLearningRegressionSlugs.has(slug)) pushUnique(tags, "机器学习");
  }

  if (seriesSlug === "sql") {
    pushUnique(tags, "SQL");
    if (structuralSqlSlugs.has(slug)) pushUnique(tags, "数据建模");
    if (querySqlSlugs.has(slug)) pushUnique(tags, "数据处理");
  }

  if (seriesSlug === "python") pushUnique(tags, "数据处理");

  if (seriesSlug === "decision-models") {
    pushUnique(tags, "优化建模");
    if (supplyChainDecisionSlugs.has(slug)) pushUnique(tags, "供应链");
  }

  if (tags.length === 0) {
    if (/回归|regression|logit|logistic/u.test(sourceText)) pushUnique(tags, "回归建模");
    if (/诊断|残差|vif|cook|leverage|outlier/u.test(sourceText)) pushUnique(tags, "模型诊断");
    if (/概率|假设|检验|估计|anova|置信/u.test(sourceText)) pushUnique(tags, "统计推断");
    if (/聚类|pca|lasso|ridge|机器学习|machine learning/u.test(sourceText)) pushUnique(tags, "机器学习");
    if (/sql|select|join|database/u.test(sourceText)) pushUnique(tags, "SQL");
    if (/供应链|运输|库存|production|inventory|transport/u.test(sourceText)) pushUnique(tags, "供应链");
    if (/优化|milp|linear programming|pulp/u.test(sourceText)) pushUnique(tags, "优化建模");
  }

  return tags.slice(0, 2);
}

export function getCanonicalTagDescription(label: string) {
  return canonicalNoteTags.find((tag) => tag.label === label)?.description ?? "";
}
