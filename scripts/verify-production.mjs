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
    markers: ["学习笔记", "统计学与 R", "SQL 与关系数据", "主键", "外键", "表关系"],
    forbiddenMarkers: [">简介<"],
  },
  {
    path: "zh/notes/sql-relational-data/",
    markers: [
      "SQL 与关系数据",
      "记录粒度",
      "NULL",
      "Schema",
      "SQL 02 — Primary Key",
    ],
    forbiddenMarkers: ["data-primary-key-lab", "data-sql-playground", ">简介<"],
  },
  {
    path: "zh/notes/sql-primary-key/",
    markers: [
      "主键：如何为每一条业务记录建立稳定身份",
      "Primary Key",
      "联合主键",
      "UUID",
      "data-primary-key-lab",
      "data-sql-playground",
    ],
    forbiddenMarkers: ["data-foreign-key-lab", "data-relationship-cardinality-lab", ">简介<"],
  },
  {
    path: "zh/notes/sql-foreign-key/",
    markers: [
      "外键：如何让两张业务表保持可靠的引用关系",
      "Foreign Key",
      "引用完整性",
      "data-foreign-key-lab",
      "data-sql-playground",
    ],
    forbiddenMarkers: ["data-primary-key-lab", "data-relationship-cardinality-lab", ">简介<"],
  },
  {
    path: "zh/notes/sql-relationships/",
    markers: [
      "表关系：一对多、多对多与一对一应该怎样建模",
      "One-to-Many",
      "Many-to-Many",
      "One-to-One",
      "order_items",
      "data-relationship-cardinality-lab",
    ],
    forbiddenMarkers: ["data-primary-key-lab", "data-foreign-key-lab", "data-sql-playground", ">简介<"],
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

  for (const marker of markers) {
    if (!html.includes(marker)) {
      throw new Error(`${path} is missing expected marker: ${marker}`);
    }
  }

  for (const marker of forbiddenMarkers) {
    if (html.includes(marker)) {
      throw new Error(`${path} still contains forbidden/stale marker: ${marker}`);
    }
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(html)) {
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
