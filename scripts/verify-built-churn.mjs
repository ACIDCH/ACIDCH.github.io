import { readFile } from "node:fs/promises";

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
      "numeric-distributions.webp",
      "predictor-comparisons.webp",
      "categorical-churn-rates.webp",
      "service-interactions.webp",
      "holdout-roc.webp",
      "odds-ratio-ci.webp",
    ],
  },
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

console.log("Built Customer Churn acceptance passed: navigation, technology identity, native visuals and raster removal are present in dist/.");
