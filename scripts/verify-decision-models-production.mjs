/* global AbortController, fetch */

import process from "node:process";
import { clearTimeout, setTimeout as scheduleTimeout } from "node:timers";
import { setTimeout as sleep } from "node:timers/promises";

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

const checks = [
  {
    path: "zh/notes/series/decision-models/",
    markers: ["供应链与决策模型", "DM 01", "DM 10", "PuLP", "多期生产、库存与履约"],
  },
  {
    path: "zh/notes/optimisation-model-anatomy/",
    markers: ["优化建模基础：把业务问题拆成目标、参数、决策与约束", "data-optimisation-anatomy"],
  },
  {
    path: "zh/notes/unconstrained-optimisation/",
    markers: ["无约束优化：从函数形状、边际变化到可执行决策", "data-unconstrained-lab", "optimum 600"],
  },
  {
    path: "zh/notes/constrained-optimisation/",
    markers: ["受约束优化：从可行域、角点到绑定约束", "data-feasible-lab", "42·Core + 58·Premium"],
  },
  {
    path: "zh/notes/optimisation-sensitivity-analysis/",
    markers: ["优化敏感性分析：资源松弛、影子价格与决策稳健性", "Shadow price", "data-feasible-lab"],
  },
  {
    path: "zh/notes/binary-milp-decisions/",
    markers: ["二进制决策与 MILP：把“开不开、选不选”写进优化模型", "data-milp-lab", "linking constraint"],
  },
  {
    path: "zh/notes/sets-indices-model-scale/",
    markers: ["Sets 与 Indices：让优化模型从几个变量扩展到真实业务规模", "data-scale-lab", "Decision variables"],
  },
  {
    path: "zh/notes/pulp-model-architecture/",
    markers: ["PuLP 优化编程架构：从数学模型到可审计代码", "data-pulp-lab", "LpVariable.dicts"],
  },
  {
    path: "zh/notes/multidimensional-optimisation/",
    markers: ["多维优化模型：从二维矩阵扩展到产品、工厂、技能与时期", "data-scale-lab", "4D"],
  },
  {
    path: "zh/notes/transportation-models/",
    markers: ["供应链规划与运输分配：从战略网络到战术承运量", "data-horizon-lab", "data-flow-lab", "Carrier allocation"],
  },
  {
    path: "zh/notes/multi-period-production-inventory/",
    markers: ["多期生产与库存优化：用流量平衡连接今天与未来", "data-flow-lab", 'data-default-mode="period"', "Two batches"],
  },
];

const forbiddenMarkers = [
  "BUSINFO",
  "Assignment",
  "Submission",
  "399162766",
  "Xintao Liu",
  "LIU XINTAO",
  "刘鑫涛",
  ">草稿提纲<",
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
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyPage({ path, markers }) {
  const response = await fetchWithTimeout(deploymentUrl(path));
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const html = await response.text();
  if (/404\s*(?:-|–|—)?\s*(?:file\s+not\s+found|not\s+found)/i.test(html)) {
    throw new Error(`${path} returned a rendered 404 page`);
  }
  if (!/<html\b/i.test(html) || !/<main\b/i.test(html)) {
    throw new Error(`${path} does not look like a complete site page`);
  }
  for (const marker of markers) {
    if (!html.includes(marker)) throw new Error(`${path} is missing expected marker: ${marker}`);
  }
  for (const marker of forbiddenMarkers) {
    if (html.includes(marker)) throw new Error(`${path} contains forbidden marker: ${marker}`);
  }
}

async function verifyDecisionModelsProduction() {
  for (const check of checks) await verifyPage(check);
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyDecisionModelsProduction();
    console.log(
      `Decision-model production verified: ${baseUrl.href} exposes the ten-module supply-chain optimisation series for ${expectedSha}.`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `Decision-model production verification attempt ${attempt}/${attempts} failed: ${error.message}`,
    );
    if (attempt < attempts) await sleep(retryDelayMs);
  }
}

console.error(`Decision-model production verification failed: ${lastError?.message || "unknown error"}`);
process.exit(1);
