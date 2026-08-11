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
    path: "zh/notes/series/r-statistics/",
    markers: [
      "R 与统计",
      "STAT 01",
      "STAT 02",
      "STAT 03",
      "STAT 04",
      "STAT 05",
      "STAT 06",
      "数据类型与尺度",
      "抽样与估计",
      "区间估计",
      "假设检验",
      "分类数据分析",
    ],
    forbidden: ["待发布"],
  },
  {
    path: "zh/notes/stat-data-types-scales/",
    markers: ["数据类型与尺度", "Nominal", "Ordinal", "Interval", "Ratio", "data dictionary"],
  },
  {
    path: "zh/notes/stat-sampling-estimation/",
    markers: [
      "抽样与估计",
      "Sampling distribution",
      "standard error",
      "Central Limit Theorem",
      "data-sampling-precision-lab",
      "data-sampling-n",
    ],
  },
  {
    path: "zh/notes/stat-interval-estimation/",
    markers: [
      "区间估计",
      "margin of error",
      "Student's t distribution",
      "Bootstrap",
      "data-sampling-precision-lab",
      "data-sampling-confidence",
    ],
  },
  {
    path: "zh/notes/stat-hypothesis-testing/",
    markers: ["假设检验", "null hypothesis", "p-value", "Type I error", "Power", "p.adjust"],
  },
  {
    path: "zh/notes/stat-categorical-data-analysis/",
    markers: [
      "分类数据分析",
      "contingency table",
      "Chi-square",
      "odds ratio",
      "Simpson's paradox",
      "logistic regression",
    ],
  },
];

const forbiddenMarkers = [
  "BUSINFO",
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

async function verifyPage({ path, markers, forbidden = [] }) {
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
    if (!html.includes(marker)) {
      throw new Error(`${path} is missing expected marker: ${marker}`);
    }
  }
  for (const marker of [...forbiddenMarkers, ...forbidden]) {
    if (html.includes(marker)) {
      throw new Error(`${path} contains forbidden marker: ${marker}`);
    }
  }
}

async function verifyProduction() {
  for (const check of checks) await verifyPage(check);
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyProduction();
    console.log(
      `Statistics production verified: ${baseUrl.href} exposes STAT 01–06, all five completed notes and the sampling interaction for ${expectedSha}.`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `Statistics production verification attempt ${attempt}/${attempts} failed: ${error.message}`,
    );
    if (attempt < attempts) await sleep(retryDelayMs);
  }
}

console.error(
  `Statistics production verification failed: ${lastError?.message || "unknown error"}`,
);
process.exit(1);
