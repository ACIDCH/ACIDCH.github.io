import { readFile } from "node:fs/promises";
import process from "node:process";

const courseMarkers = ["704", "BUSINFO704", "BUSINFO 704", "课程项目", "课程报告"];
const checks = [
  {
    file: "dist/zh/index.html",
    markers: ["关于我", "学习笔记"],
    forbidden: [">简介<"],
  },
  {
    file: "dist/zh/about/index.html",
    markers: ["关于我", "商业分析"],
    forbidden: [">简介<"],
  },
  {
    file: "dist/zh/projects/index.html",
    markers: ["Power BI", "Python", "SQL", "Excel"],
    forbidden: [">简介<"],
  },
  {
    file: "dist/zh/projects/customer-churn-machine-learning/index.html",
    markers: [
      "data-predictor-explorer",
      "data-correlation-explorer",
      "data-model-lab",
      "data-model-evaluation",
      "data-risk-explorer",
      "data-native-or",
      "0.9053",
    ],
    forbidden: [
      ">简介<",
      ...courseMarkers,
      "numeric-distributions.webp",
      "predictor-comparisons.webp",
      "categorical-churn-rates.webp",
      "service-interactions.webp",
      "holdout-roc.webp",
      "odds-ratio-ci.webp",
    ],
  },
  ...[
    "data-validation",
    "model-comparison",
    "model-selection-error-analysis",
    "logistic-interpretation",
    "neural-network",
  ].map((slug) => ({
    file: `dist/zh/projects/customer-churn-machine-learning/${slug}/index.html`,
    markers: ["继续阅读技术专题"],
    forbidden: [">简介<", ...courseMarkers],
  })),
];

const failures = [];

for (const check of checks) {
  const html = await readFile(check.file, "utf8");

  for (const marker of check.markers) {
    if (!html.includes(marker)) {
      failures.push(`${check.file} is missing required marker: ${marker}`);
    }
  }

  for (const marker of check.forbidden) {
    if (html.includes(marker)) {
      failures.push(`${check.file} still contains stale marker: ${marker}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Built Customer Churn acceptance failed (${failures.length} issue(s)).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  "Built Customer Churn acceptance passed: public navigation, technology identity, deep-dive wording, native visuals and raster removal are present in dist/.",
);
