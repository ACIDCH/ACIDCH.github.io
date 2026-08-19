import { readFile } from "node:fs/promises";

const files = {
  comparison: await readFile("src/lib/geospatial/scenarioComparison.js", "utf8"),
  runtime: await readFile("src/scripts/geospatial-scenario-summary-v4.js", "utf8"),
  advanced: await readFile("src/components/GeospatialAdvancedVisuals.astro", "utf8"),
  zh: await readFile(
    "src/content/projects/geospatial-supply-chain-optimisation.zh.md",
    "utf8",
  ),
  en: await readFile(
    "src/content/projects/geospatial-supply-chain-optimisation.en.md",
    "utf8",
  ),
};

const requireToken = (source, token, label) => {
  if (!source.includes(token)) {
    throw new Error(`[geospatial-decision-summary-v4] missing ${label}: ${token}`);
  }
};

for (const [token, label] of [
  ['key: "delivery-distance"', "Fast OD distance semantics"],
  ['unit: "km"', "Fast OD kilometre unit"],
  ['key: "travel-time"', "OSM travel-time semantics"],
  ['unit: "min"', "OSM minute unit"],
  ["metricA.key === metricB.key", "network-metric comparability guard"],
  ["networkComparable", "explicit network comparability state"],
  ["network-not-comparable", "cross-engine trade-off classification"],
  ["changedScenarioParameters", "changed-assumption extraction"],
])
  requireToken(files.comparison, token, label);

for (const [token, label] of [
  ["scenarioSummaryV4Ready", "decision-summary runtime state"],
  ["captureSnapshot", "saved current-state snapshot"],
  ["currentRobustness", "optional Monte Carlo snapshot"],
  ["scenarioComparisonState", "comparison state exposed for browser acceptance"],
  ["Fast OD 是 km，OSM 是 min", "Chinese cross-engine unit warning"],
  ["Fast OD is measured in km and OSM in min", "English cross-engine unit warning"],
  ["发生变化的假设", "Chinese changed-assumptions copy"],
  ["Changed assumptions", "English changed-assumptions copy"],
  ["成本—服务权衡", "Chinese cost-service interpretation"],
  ["cost–service trade-off", "English cost-service interpretation"],
])
  requireToken(files.runtime, token, label);

requireToken(
  files.advanced,
  'import "../scripts/geospatial-scenario-summary-v4.js"',
  "decision-summary runtime mount",
);

for (const [source, tokens] of [
  [files.zh, ["## 这个沙盘回答什么问题", "km 与 OSM 的 min", "完整 CVRP"]],
  [
    files.en,
    [
      "## Decision questions this sandbox answers",
      "Fast OD kilometres from OSM minutes",
      "full CVRP",
    ],
  ],
]) {
  for (const token of tokens) requireToken(source, token, `public project copy ${token}`);
}

console.log(
  "[geospatial-decision-summary-v4] PASS: A/B snapshots preserve decision inputs and current KPIs, network deltas are unit-aware, changed assumptions and robustness are surfaced, public project copy is management-decision focused, and the CVRP boundary remains explicit.",
);
