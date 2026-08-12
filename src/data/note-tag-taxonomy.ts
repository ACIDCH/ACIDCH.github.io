import type { CollectionEntry } from "astro:content";
import type { Locale } from "../config/site";

export interface CanonicalNoteTag {
  id: string;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const canonicalNoteTags: CanonicalNoteTag[] = [
  {
    id: "data-understanding",
    label: { zh: "数据理解", en: "Data understanding" },
    description: {
      zh: "描述分布、相关关系、异常结构与探索性分析。",
      en: "Distribution, association, anomalies and exploratory analysis.",
    },
  },
  {
    id: "statistical-inference",
    label: { zh: "统计推断", en: "Statistical inference" },
    description: {
      zh: "概率、抽样、估计、区间与假设检验。",
      en: "Probability, sampling, estimation, intervals and testing.",
    },
  },
  {
    id: "regression",
    label: { zh: "回归建模", en: "Regression" },
    description: {
      zh: "线性、非线性与分类结果的解释和预测。",
      en: "Linear, nonlinear and classification-oriented regression models.",
    },
  },
  {
    id: "model-diagnostics",
    label: { zh: "模型诊断", en: "Model diagnostics" },
    description: {
      zh: "残差、共线性、杠杆点、影响点与模型条件。",
      en: "Residuals, collinearity, leverage, influence and assumptions.",
    },
  },
  {
    id: "machine-learning",
    label: { zh: "机器学习", en: "Machine learning" },
    description: {
      zh: "变量选择、正则化、降维、聚类与预测建模。",
      en: "Selection, regularisation, dimension reduction and prediction.",
    },
  },
  {
    id: "sql",
    label: { zh: "SQL", en: "SQL" },
    description: {
      zh: "关系数据查询、排序、聚合、连接与数据修改。",
      en: "Relational querying, ordering, aggregation, joins and changes.",
    },
  },
  {
    id: "data-modelling",
    label: { zh: "数据建模", en: "Data modelling" },
    description: {
      zh: "关系结构、键、约束、索引、事务与数据粒度。",
      en: "Relations, keys, constraints, indexes, transactions and grain.",
    },
  },
  {
    id: "data-processing",
    label: { zh: "数据处理", en: "Data processing" },
    description: {
      zh: "读取、清洗、筛选、转换、分组与可复查流程。",
      en: "Reading, cleaning, filtering, transforming and grouped workflows.",
    },
  },
  {
    id: "optimisation",
    label: { zh: "优化建模", en: "Optimisation" },
    description: {
      zh: "目标、决策变量、约束、敏感性与 LP/MILP。",
      en: "Objectives, decisions, constraints, sensitivity and LP/MILP.",
    },
  },
  {
    id: "supply-chain",
    label: { zh: "供应链", en: "Supply chain" },
    description: {
      zh: "运输、网络、容量、生产、库存与跨期履约。",
      en: "Transport, networks, capacity, production, inventory and fulfilment.",
    },
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

function pushUnique(target: string[], id: string) {
  if (!target.includes(id)) target.push(id);
}

function labelsFor(ids: string[], locale: Locale) {
  return ids
    .map((id) => canonicalNoteTags.find((tag) => tag.id === id)?.label[locale])
    .filter((label): label is string => Boolean(label));
}

export function getCanonicalNoteTagIds(entry: CollectionEntry<"notes">): string[] {
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
    pushUnique(tags, "data-understanding");
    pushUnique(tags, "statistical-inference");
  }
  if (seriesSlug === "data-science-r") {
    pushUnique(tags, "statistical-inference");
    pushUnique(tags, "machine-learning");
  }
  if (seriesSlug === "regression") {
    pushUnique(tags, "regression");
    if (diagnosticRegressionSlugs.has(slug)) pushUnique(tags, "model-diagnostics");
    if (machineLearningRegressionSlugs.has(slug)) pushUnique(tags, "machine-learning");
  }
  if (seriesSlug === "sql") {
    pushUnique(tags, "sql");
    if (structuralSqlSlugs.has(slug)) pushUnique(tags, "data-modelling");
    if (querySqlSlugs.has(slug)) pushUnique(tags, "data-processing");
  }
  if (seriesSlug === "python") pushUnique(tags, "data-processing");
  if (seriesSlug === "decision-models") {
    pushUnique(tags, "optimisation");
    if (supplyChainDecisionSlugs.has(slug)) pushUnique(tags, "supply-chain");
  }

  if (tags.length === 0) {
    if (/回归|regression|logit|logistic/u.test(sourceText))
      pushUnique(tags, "regression");
    if (/诊断|残差|vif|cook|leverage|outlier/u.test(sourceText))
      pushUnique(tags, "model-diagnostics");
    if (/概率|假设|检验|估计|anova|置信/u.test(sourceText))
      pushUnique(tags, "statistical-inference");
    if (/聚类|pca|lasso|ridge|机器学习|machine learning/u.test(sourceText))
      pushUnique(tags, "machine-learning");
    if (/sql|select|join|database/u.test(sourceText)) pushUnique(tags, "sql");
    if (/供应链|运输|库存|production|inventory|transport/u.test(sourceText))
      pushUnique(tags, "supply-chain");
    if (/优化|milp|linear programming|pulp/u.test(sourceText))
      pushUnique(tags, "optimisation");
  }

  return tags.slice(0, 2);
}

export function getCanonicalNoteTags(entry: CollectionEntry<"notes">): string[] {
  return labelsFor(getCanonicalNoteTagIds(entry), entry.data.locale);
}

export function getCanonicalTagByLabel(label: string, locale: Locale) {
  return canonicalNoteTags.find((tag) => tag.label[locale] === label);
}
