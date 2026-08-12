/* global AbortController, fetch */

import process from "node:process";
import { clearTimeout, setTimeout as scheduleTimeout } from "node:timers";
import { setTimeout as sleep } from "node:timers/promises";

// Production is accepted only when the live deployment reports this exact commit.
const [baseArgument, expectedShaArgument] = process.argv.slice(2);
const baseUrl = new URL(baseArgument || "https://acidch.github.io/");
const expectedSha = expectedShaArgument || process.env.GITHUB_SHA;
const attempts = 12;
const retryDelayMs = 10_000;
const requestTimeoutMs = 15_000;

if (!expectedSha) {
  console.error("Expected deployment SHA is required.");
  process.exit(1);
}

const archivedChurnRasterMarkers = [
  "numeric-distributions.webp",
  "predictor-comparisons.webp",
  "categorical-churn-rates.webp",
  "service-interactions.webp",
  "holdout-roc.webp",
  "odds-ratio-ci.webp",
];
const churnCoursePatterns = [
  /BUSINFO\s*704/i,
  /(?<![\d.])704(?![\d.])/,
  /课程项目|课程报告/,
];

const pageChecks = [
  {
    path: "projects/customer-churn-machine-learning/",
    markers: [
      "Customer Churn Prediction and Supervised Model Comparison",
      "0.9053",
      'hreflang="zh-CN"',
    ],
    forbiddenMarkers: ["客户流失预测与监督学习模型比较", ">简介<"],
  },
  {
    path: "projects/european-property-market-dashboard/",
    markers: [
      "European Property Development Market Analysis in Power BI",
      "124.4%",
      'hreflang="zh-CN"',
    ],
    forbiddenMarkers: ["欧洲房地产开发市场 Power BI 分析", ">简介<"],
  },
  {
    path: "projects/grammy-spotify-analysis/",
    markers: ["Multi-source Grammy and Spotify Analysis", "1,687", 'hreflang="zh-CN"'],
    forbiddenMarkers: ["Grammy 与 Spotify 多源数据分析", ">简介<"],
  },
  {
    path: "projects/retirement-monte-carlo/",
    markers: [
      "Retirement Savings Monte Carlo Model in Excel",
      "552,670.63",
      'hreflang="zh-CN"',
    ],
    forbiddenMarkers: ["Excel 退休储蓄蒙特卡洛模拟", ">简介<"],
  },
  {
    path: "projects/sales-profitability-warehouse/",
    markers: [
      "Sales and Profitability Warehouse Analysis in SQL",
      "82.39%",
      'hreflang="zh-CN"',
    ],
    forbiddenMarkers: ["销售与盈利数据仓库 SQL 分析", ">简介<"],
  },
  {
    path: "notes/series/sql/",
    markers: [
      "SQL and Relational Data",
      "Primary Keys",
      "Column Selection and Expressions",
    ],
    forbiddenMarkers: ["SQL 与关系数据", ">简介<"],
  },
  {
    path: "notes/sql-relational-data/",
    markers: [
      "SQL and Relational Data",
      "Why use a database?",
      "data-relational-model-explorer",
      "data-sql-dataset-explorer",
    ],
    forbiddenMarkers: ["为什么需要数据库", ">简介<"],
  },
  {
    path: "notes/sql-primary-key/",
    markers: ["Primary Keys", "record identity", "data-primary-key-lab"],
    forbiddenMarkers: ["主键", ">简介<"],
  },
  {
    path: "notes/sql-foreign-key/",
    markers: ["Foreign Keys", "referential integrity", "data-foreign-key-lab"],
    forbiddenMarkers: ["外键", ">简介<"],
  },
  {
    path: "notes/sql-relationships/",
    markers: [
      "Table Relationships",
      "One-to-many",
      "data-relationship-cardinality-lab",
    ],
    forbiddenMarkers: ["表关系", ">简介<"],
  },
  {
    path: "notes/sql-select/",
    markers: ["SELECT Queries", "What the asterisk", "data-sql-playground"],
    forbiddenMarkers: ["SELECT 查询", ">简介<"],
  },
  {
    path: "notes/sql-where/",
    markers: ["Filtering with WHERE", "Comparison operators", "data-where-filter-lab"],
    forbiddenMarkers: ["WHERE 筛选", ">简介<"],
  },
  {
    path: "notes/sql-projection/",
    markers: [
      "Column Selection and Expressions",
      "Projection controls the columns",
      "data-projection-lab",
    ],
    forbiddenMarkers: ["列选择与表达式", ">简介<"],
  },
  {
    path: "zh/",
    markers: ["关于我", "学习笔记"],
    forbiddenMarkers: [">简介<"],
  },
  {
    path: "zh/about/",
    markers: ["关于我", "商业分析"],
    forbiddenMarkers: [">简介<"],
  },
  {
    path: "zh/projects/",
    markers: ["Power BI", "Python", "SQL", "Excel"],
    forbiddenMarkers: [">简介<"],
  },
  {
    path: "zh/notes/",
    markers: [
      "学习笔记",
      "统计学与 R",
      "SQL 与关系数据",
      "主键",
      "外键",
      "表关系",
      "SELECT 查询",
      "WHERE 筛选",
      "列选择与表达式",
    ],
    forbiddenMarkers: [
      ">简介<",
      "表关系：一对多、多对多与一对一",
      "非线性回归与交互项",
      "供应链规划与运输分配",
    ],
  },
  {
    path: "zh/notes/sql-relational-data/",
    markers: [
      "SQL 与关系数据",
      "为什么需要数据库",
      "层次模型",
      "网状模型",
      "DDL",
      "DML",
      "DQL",
      "data-relational-model-explorer",
      "data-sql-dataset-explorer",
    ],
    forbiddenMarkers: [
      "data-primary-key-lab",
      "data-foreign-key-lab",
      "data-sql-playground",
      ">简介<",
    ],
  },
  {
    path: "zh/notes/sql-primary-key/",
    markers: [
      "主键",
      "Primary Key",
      "联合主键",
      "UUID",
      "data-primary-key-lab",
      "data-sql-playground",
      'data-default-preset="duplicate"',
      'data-sql-focus="keys"',
    ],
    forbiddenMarkers: [
      "主键：如何为每一条业务记录建立稳定身份",
      "记录身份证",
      "data-foreign-key-lab",
      "data-relationship-cardinality-lab",
      "data-where-filter-lab",
      "data-projection-lab",
      ">简介<",
    ],
  },
  {
    path: "zh/notes/sql-foreign-key/",
    markers: [
      "外键",
      "Foreign Key",
      "引用完整性",
      "PRAGMA foreign_keys",
      "ADD CONSTRAINT",
      "data-foreign-key-lab",
      "data-sql-playground",
      'data-default-preset="foreign-key"',
      'data-sql-focus="keys"',
    ],
    forbiddenMarkers: [
      "外键：如何让两张业务表保持可靠的引用关系",
      "data-primary-key-lab",
      "data-relationship-cardinality-lab",
      "data-where-filter-lab",
      "data-projection-lab",
      ">简介<",
    ],
  },
  {
    path: "zh/notes/sql-relationships/",
    markers: [
      "表关系",
      "One-to-Many",
      "Many-to-Many",
      "One-to-One",
      "order_items",
      "300 + 120 = 420",
      "data-relationship-cardinality-lab",
    ],
    forbiddenMarkers: [
      "表关系：一对多、多对多与一对一",
      "表关系：一对多、多对多与一对一应该怎样建模",
      "50008",
      "data-primary-key-lab",
      "data-foreign-key-lab",
      "data-sql-playground",
      "data-where-filter-lab",
      "data-projection-lab",
      ">简介<",
    ],
  },
  {
    path: "zh/notes/sql-select/",
    markers: [
      "SELECT 查询",
      "SELECT *",
      "result set",
      "SELECT 1 AS execution_ok",
      "3 行、5 列",
      "data-sql-playground",
      'data-default-preset="customers"',
      'data-sql-focus="select"',
    ],
    forbiddenMarkers: [
      "SELECT：从关系表中读取第一份结果集",
      "data-primary-key-lab",
      "data-foreign-key-lab",
      "data-relationship-cardinality-lab",
      "data-where-filter-lab",
      "data-projection-lab",
      ">简介<",
    ],
  },
  {
    path: "zh/notes/sql-where/",
    markers: [
      "WHERE 筛选",
      "BETWEEN",
      "IS NULL",
      "三值逻辑",
      "data-where-filter-lab",
      "data-sql-playground",
      'data-default-preset="where-gte"',
      'data-sql-focus="where"',
    ],
    forbiddenMarkers: [
      "WHERE：把业务条件翻译成可验证的记录筛选",
      "50008",
      "data-primary-key-lab",
      "data-foreign-key-lab",
      "data-relationship-cardinality-lab",
      "data-projection-lab",
      ">简介<",
    ],
  },
  {
    path: "zh/notes/sql-projection/",
    markers: [
      "列选择与表达式",
      "Projection 改变的是结果集的列",
      "customer_key",
      "scenario_value",
      "data-projection-lab",
      "data-sql-playground",
      'data-default-preset="projection-columns"',
      'data-sql-focus="projection"',
    ],
    forbiddenMarkers: [
      "Projection：只返回分析真正需要的列",
      "50008",
      "data-primary-key-lab",
      "data-foreign-key-lab",
      "data-relationship-cardinality-lab",
      "data-where-filter-lab",
      ">简介<",
    ],
  },
  {
    path: "zh/projects/customer-churn-machine-learning/",
    markers: [
      "Machine Learning",
      "0.9053",
      "data-predictor-explorer",
      "data-correlation-explorer",
      "data-model-lab",
      "data-model-evaluation",
      "data-risk-explorer",
      "data-native-or",
    ],
    forbiddenMarkers: [">简介<", ...archivedChurnRasterMarkers],
    forbiddenPatterns: churnCoursePatterns,
  },
  {
    path: "zh/projects/customer-churn-machine-learning/data-validation/",
    markers: ["Technical Deep Dive", "30,000", "继续阅读技术专题"],
    forbiddenMarkers: [">简介<"],
    forbiddenPatterns: churnCoursePatterns,
  },
  {
    path: "zh/projects/customer-churn-machine-learning/model-comparison/",
    markers: ["Technical Deep Dive", "Logistic Regression", "继续阅读技术专题"],
    forbiddenMarkers: [">简介<"],
    forbiddenPatterns: churnCoursePatterns,
  },
  {
    path: "zh/projects/customer-churn-machine-learning/model-selection-error-analysis/",
    markers: ["Technical Deep Dive", "2,022", "继续阅读技术专题"],
    forbiddenMarkers: [">简介<"],
    forbiddenPatterns: churnCoursePatterns,
  },
  {
    path: "zh/projects/customer-churn-machine-learning/logistic-interpretation/",
    markers: ["Technical Deep Dive", "15.9", "继续阅读技术专题"],
    forbiddenMarkers: [">简介<"],
    forbiddenPatterns: churnCoursePatterns,
  },
  {
    path: "zh/projects/customer-churn-machine-learning/neural-network/",
    markers: ["Technical Deep Dive", "nnet", "继续阅读技术专题"],
    forbiddenMarkers: [">简介<"],
    forbiddenPatterns: churnCoursePatterns,
  },
];

function deploymentUrl(pathname) {
  const url = new URL(pathname, baseUrl);
  url.searchParams.set("deployment", expectedSha.slice(0, 12));
  return url;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = scheduleTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, {
      cache: "no-store",
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function visiblePublicCopy(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "")
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/giu, "")
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/giu, "")
    .replace(/<!--[\s\S]*?-->/gu, "");
}

async function verifyDeploymentIdentity() {
  const url = deploymentUrl("deploy-meta.json");
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`deployment marker returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.sha !== expectedSha) {
    throw new Error(
      `production is serving ${payload.sha || "an unknown commit"}, expected ${expectedSha}`,
    );
  }
}

async function verifyPage({
  path,
  markers,
  forbiddenMarkers = [],
  forbiddenPatterns = [],
}) {
  const url = deploymentUrl(path);
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  const html = await response.text();
  if (/404\s*(?:-|–|—)?\s*(?:file\s+not\s+found|not\s+found)/i.test(html)) {
    throw new Error(`${path} returned a rendered 404 page`);
  }
  if (!/<html\b/i.test(html) || !/<main\b/i.test(html)) {
    throw new Error(`${path} does not look like a complete site page`);
  }
  const publicCopy = visiblePublicCopy(html);

  for (const marker of markers) {
    if (!html.includes(marker)) {
      throw new Error(`${path} is missing expected marker: ${marker}`);
    }
  }

  for (const marker of forbiddenMarkers) {
    if (publicCopy.includes(marker)) {
      throw new Error(`${path} still contains forbidden/stale marker: ${marker}`);
    }
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(publicCopy)) {
      throw new Error(`${path} still contains a course-facing label: ${pattern}`);
    }
  }
}

async function verifyProduction() {
  await verifyDeploymentIdentity();
  for (const check of pageChecks) {
    await verifyPage(check);
  }
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyProduction();
    console.log(
      `Production verified: ${baseUrl.href} is serving ${expectedSha} and all UI, route, public-language and raster contracts passed.`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `Production verification attempt ${attempt}/${attempts} failed: ${error.message}`,
    );
    if (attempt < attempts) await sleep(retryDelayMs);
  }
}

console.error(
  `Production verification failed: ${lastError?.message || "unknown error"}`,
);
process.exit(1);
