import type { Locale } from "../config/site";
import { getLearningSeries, type LearningSeries } from "../data/learning-series";

interface EnglishModuleCopy {
  title: string;
  summary: string;
}

interface EnglishSeriesCopy {
  title: string;
  description: string;
  tools: string[];
  modules: Record<string, EnglishModuleCopy>;
}

const englishSeriesCopy: Record<string, EnglishSeriesCopy> = {
  "r-statistics": {
    title: "R and Statistics",
    description:
      "Understand the data first, then move into probability, inference and statistical modelling. R performs the calculations; sound judgement still depends on the data and the question.",
    tools: ["R", "Base R"],
    modules: {
      "STAT 01": {
        title: "Descriptive Statistics",
        summary:
          "Examine centre, variation, distribution and unusual values before drawing conclusions from a sample.",
      },
      "STAT 02": {
        title: "Data Types and Scales",
        summary:
          "Distinguish numeric, categorical, ordinal and temporal data before choosing valid operations.",
      },
      "STAT 03": {
        title: "Sampling and Estimation",
        summary:
          "Estimate population quantities from samples while accounting for sampling error and representativeness.",
      },
      "STAT 04": {
        title: "Interval Estimation",
        summary: "Use intervals to communicate the precision around a point estimate.",
      },
      "STAT 05": {
        title: "Hypothesis Testing",
        summary:
          "Read the null hypothesis, statistical evidence, effect size and practical question together.",
      },
      "STAT 06": {
        title: "Categorical Data Analysis",
        summary:
          "Use frequencies, proportions and contingency tables to study categorical differences and associations.",
      },
    },
  },
  regression: {
    title: "Regression and Statistical Modelling",
    description:
      "Start with a fitted line, then work through residuals, non-linearity, multiple predictors, influential observations and classification. First establish what the model answers; then interpret coefficients and metrics.",
    tools: ["R", "Base R", "glmnet", "Statistical Modelling"],
    modules: {
      "REG 01": {
        title: "Simple Linear Regression",
        summary:
          "Begin with a scatterplot and least squares, then interpret the slope, R² and prediction intervals.",
      },
      "REG 02": {
        title: "Regression Diagnostics",
        summary:
          "Use residuals to detect curvature, heteroscedasticity, tail problems and unusual structure.",
      },
      "REG 03": {
        title: "Non-linear Regression",
        summary:
          "When a line is insufficient, use residual evidence to add justified polynomial, categorical or interaction terms.",
      },
      "REG 04": {
        title: "Multiple Linear Regression",
        summary:
          "Interpret conditional relationships, overall tests and collinearity when predictors enter together.",
      },
      "REG 05": {
        title: "Outliers and Influential Observations",
        summary:
          "Distinguish large residuals, high leverage and observations that materially change the fitted model.",
      },
      "REG 06": {
        title: "Feature Selection and Regularisation",
        summary:
          "Compare complexity and out-of-sample performance, including the trade-offs between Ridge and Lasso.",
      },
      "REG 07": {
        title: "Logistic Regression",
        summary:
          "Move from probability, odds and odds ratios to predicted probabilities and classification thresholds.",
      },
    },
  },
  sql: {
    title: "SQL and Relational Data",
    description:
      "Establish tables and relationships before moving into queries, aggregation, joins, indexes and transactions. A consistent business dataset keeps examples comparable across the series.",
    tools: ["SQL", "SQLite", "Relational Databases"],
    modules: {
      "SQL 01": {
        title: "Relational Databases",
        summary:
          "Understand tables, rows, columns, grain, data types, NULL and schemas.",
      },
      "SQL 02": {
        title: "Primary Keys",
        summary:
          "Identify each record with a stable unique value that does not depend on a mutable business attribute.",
      },
      "SQL 03": {
        title: "Foreign Keys",
        summary:
          "Reference another table safely while maintaining referential integrity.",
      },
      "SQL 04": {
        title: "Table Relationships",
        summary:
          "Use customers, orders and products to examine one-to-many, many-to-many and one-to-one relationships and changes in grain after a JOIN.",
      },
      "SQL 05": {
        title: "SELECT Queries",
        summary: "Retrieve data from a table using SELECT, FROM and result sets.",
      },
      "SQL 06": {
        title: "WHERE Filtering",
        summary:
          "Retain required records with comparison, logical, range, text and NULL conditions.",
      },
      "SQL 07": {
        title: "Column Selection and Expressions",
        summary:
          "Select relevant columns and organise results with aliases and calculated expressions.",
      },
      "SQL 08": {
        title: "ORDER BY Sorting",
        summary: "Give query results an explicit, repeatable row order.",
      },
      "SQL 09": {
        title: "Pagination Queries",
        summary:
          "Read data in stable batches with LIMIT and OFFSET or cursor-based pagination.",
      },
      "SQL 10": {
        title: "Aggregation",
        summary: "Summarise multiple rows with COUNT, SUM, AVG, MIN and MAX.",
      },
      "SQL 11": {
        title: "GROUP BY",
        summary:
          "Aggregate separately by business dimensions while keeping the result grain explicit.",
      },
      "SQL 12": {
        title: "JOIN Operations",
        summary:
          "Join along genuine table relationships and understand which records each JOIN retains.",
      },
      "SQL 13": {
        title: "Subqueries",
        summary:
          "Pass one query's result into another query for further filtering or comparison.",
      },
      "SQL 14": {
        title: "INSERT",
        summary: "Add records safely by aligning fields with their values.",
      },
      "SQL 15": {
        title: "UPDATE",
        summary:
          "Modify existing data with explicit conditions that prevent unintended bulk updates.",
      },
      "SQL 16": {
        title: "DELETE",
        summary: "Confirm selection scope and references before deleting records.",
      },
      "SQL 17": {
        title: "Indexes",
        summary:
          "See how indexes change lookup paths and understand their write and maintenance costs.",
      },
      "SQL 18": {
        title: "Transactions",
        summary: "Place related changes in one atomic unit of work.",
      },
      "SQL 19": {
        title: "Isolation Levels",
        summary:
          "Manage dirty reads, non-repeatable reads and phantom reads during concurrent access.",
      },
      "SQL 20": {
        title: "SQL Analysis Case",
        summary:
          "Combine table design, queries, joins, aggregation and data-quality checks in one analysis.",
      },
    },
  },
  python: {
    title: "Python Data Analysis",
    description:
      "Build readable workflows for loading, cleaning, transforming, analysing, visualising and reviewing data.",
    tools: ["Python", "pandas"],
    modules: {
      "PY 01": {
        title: "Data Structures and Workflow",
        summary:
          "Express an analysis with variables, functions and a clear sequence of steps.",
      },
      "PY 02": {
        title: "Tabular Data Processing",
        summary: "Load, inspect, transform and combine data tables.",
      },
      "PY 03": {
        title: "Missing and Unusual Values",
        summary: "Turn data-quality judgements into repeatable rules.",
      },
      "PY 04": {
        title: "Grouped Analysis",
        summary: "Aggregate by business dimensions while preserving traceable grain.",
      },
      "PY 05": {
        title: "Visual Communication",
        summary:
          "Choose charts and annotations that directly answer the analytical question.",
      },
    },
  },
  "decision-models": {
    title: "Supply Chain and Decision Models",
    description:
      "Begin with a small optimisation problem, then add constraints, integer choices, scale, transportation and inventory. The emphasis is on expressing business rules clearly and keeping results reproducible.",
    tools: ["Excel Solver", "Python", "PuLP", "Optimisation"],
    modules: {
      "DM 01": {
        title: "Optimisation Model Foundations",
        summary:
          "Separate objectives, parameters, decision variables and constraints before solving.",
      },
      "DM 02": {
        title: "Unconstrained Optimisation",
        summary:
          "Use function shape and marginal change to understand an optimum and the cost of nearby alternatives.",
      },
      "DM 03": {
        title: "Constrained Optimisation",
        summary:
          "Use feasible regions, corner points, binding constraints and slack to interpret resource limits.",
      },
      "DM 04": {
        title: "Sensitivity Analysis",
        summary:
          "Observe how the objective and optimal decisions respond when resources and parameters change.",
      },
      "DM 05": {
        title: "Binary Decisions and MILP",
        summary:
          "Represent discrete open-or-close and select-or-reject choices in a model.",
      },
      "DM 06": {
        title: "Sets and Indices",
        summary:
          "Use sets, indices and sparse combinations to control model scale as dimensions grow.",
      },
      "DM 07": {
        title: "Modelling with PuLP",
        summary:
          "Turn a mathematical model into inspectable and extensible Python optimisation code.",
      },
      "DM 08": {
        title: "Multidimensional Optimisation",
        summary:
          "Add products, plants, resources and periods to one indexed model while preserving dimensional consistency.",
      },
      "DM 09": {
        title: "Supply Chain Transportation Planning",
        summary:
          "Distinguish long-, medium- and short-term decisions, then model capacity, commitments and flow balance.",
      },
      "DM 10": {
        title: "Multi-period Production and Inventory",
        summary:
          "Connect periods through inventory balance and compare setup with holding-cost trade-offs.",
      },
    },
  },
};

export interface LocalizedLearningSeries {
  slug: string;
  title: string;
  description: string;
  tools: string[];
  modules: Array<{ code: string; title: string; summary: string }>;
}

export function localizeLearningSeries(
  series: LearningSeries,
  locale: Locale,
): LocalizedLearningSeries {
  if (locale === "zh") return series;
  const copy = englishSeriesCopy[series.slug];
  if (!copy) throw new Error(`Missing English Learning Series copy: ${series.slug}`);
  return {
    slug: series.slug,
    title: copy.title,
    description: copy.description,
    tools: copy.tools,
    modules: series.modules.map((module) => {
      const moduleCopy = copy.modules[module.code];
      if (!moduleCopy) {
        throw new Error(`Missing English Learning Series module copy: ${module.code}`);
      }
      return { code: module.code, ...moduleCopy };
    }),
  };
}

export function getLocalizedLearningSeries(slug: string, locale: Locale) {
  const series = getLearningSeries(slug);
  return series ? localizeLearningSeries(series, locale) : undefined;
}
