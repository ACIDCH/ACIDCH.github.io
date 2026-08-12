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
    path: "notes/r-data-analysis-prediction/",
    markers: [
      "Data Analysis and Predictive Modelling with R",
      "central limit theorem",
      "Bootstrap",
      "Ridge",
      "Lasso",
      "Cross-validation",
      "Random forests",
      "k-means",
      "data-prediction-threshold-lab",
      "data-threshold-slider",
      "data-data-science-advanced",
      "partial pooling",
      "Nested cross-validation",
      "Brier score",
      "CC BY-NC-SA 4.0",
    ],
    forbidden: ["使用 R 进行数据分析和预测算法"],
  },
  {
    path: "zh/notes/",
    markers: [
      "使用 R 进行数据分析和预测算法",
      'data-note-tag="统计推断"',
      'data-note-tag="机器学习"',
    ],
  },
  {
    path: "zh/notes/r-data-analysis-prediction/",
    markers: [
      "使用 R 进行数据分析和预测算法",
      "中心极限定理",
      "Bootstrap",
      "Ridge",
      "Lasso",
      "交叉验证",
      "随机森林",
      "k-means",
      "data-prediction-threshold-lab",
      "data-threshold-slider",
      "data-data-science-advanced",
      "partial pooling",
      "nested cross-validation",
      "Brier score",
      "关联、预测和处理效应要分开",
      "CC BY-NC-SA 4.0",
    ],
  },
  {
    path: "zh/productivity/",
    markers: [
      "生产力工具",
      "Unix",
      'id="git"',
      "GitHub",
      "RStudio",
      "R Markdown",
      "Quarto",
      "git status",
      "可重复报告",
      "CC BY-NC-SA 4.0",
    ],
  },
  {
    path: "productivity/",
    markers: [
      "Productivity",
      "Unix",
      'id="git"',
      "GitHub",
      "RStudio",
      "Reproducible reports",
      "CC BY-NC-SA 4.0",
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

function visiblePublicCopy(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "")
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/giu, "")
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/giu, "")
    .replace(/<!--[\s\S]*?-->/gu, "");
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
  const publicCopy = visiblePublicCopy(html);
  for (const marker of [...forbiddenMarkers, ...forbidden]) {
    if (publicCopy.includes(marker)) {
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
      `R data-science and productivity production verified: ${baseUrl.href} exposes the handbook, interaction and bilingual productivity routes for ${expectedSha}.`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `R data-science/productivity production verification attempt ${attempt}/${attempts} failed: ${error.message}`,
    );
    if (attempt < attempts) await sleep(retryDelayMs);
  }
}

console.error(
  `R data-science/productivity production verification failed: ${lastError?.message || "unknown error"}`,
);
process.exit(1);
