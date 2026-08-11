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
    path: "zh/notes/",
    markers: [
      "按标签浏览",
      "把文章里的细粒度标签归并为少量核心主题",
      'data-note-tag="回归建模"',
      'data-note-tag="模型诊断"',
      "tag-cloud__tooltip",
      "按主题进入知识库",
    ],
    validate(html) {
      const tagButtons = [...html.matchAll(/data-note-tag="([^"]*)"/gu)].map((match) => match[1]);
      const canonical = tagButtons.filter(Boolean);
      const unique = new Set(canonical);
      if (canonical.length > 10) {
        throw new Error(`zh/notes/ exposes ${canonical.length} canonical tags; expected at most 10`);
      }
      if (canonical.length !== unique.size) {
        throw new Error("zh/notes/ contains duplicate canonical tag buttons");
      }
    },
  },
  {
    path: "zh/notes/series/regression/",
    markers: [
      "回归与统计建模",
      "7 篇已发布笔记",
      "REG 01",
      "REG 07",
      "简单线性回归",
      "Logistic Regression",
      "已发布 · 点击进入完整笔记",
    ],
  },
  {
    path: "zh/notes/regression-foundations/",
    markers: ["简单线性回归：从散点图、最小二乘到区间预测", "data-regression-lab"],
  },
  {
    path: "zh/notes/regression-diagnostics/",
    markers: ["回归诊断：残差、正态性、异方差与模型失配", "data-regression-diagnostics"],
  },
  {
    path: "zh/notes/nonlinear-regression-interactions/",
    markers: ["非线性回归与交互：多项式、类别变量和条件效应", "data-polynomial-regression"],
  },
  {
    path: "zh/notes/multiple-regression-multicollinearity/",
    markers: ["多元线性回归：条件效应、共线性与系数稳定性", "data-multicollinearity"],
  },
  {
    path: "zh/notes/influential-observations/",
    markers: ["异常点与影响点：Leverage、Cook’s Distance 与 DFBETA", "data-regression-diagnostics"],
  },
  {
    path: "zh/notes/regression-feature-selection/",
    markers: ["特征选择与正则化：Adjusted R²、BIC、CV、Ridge 与 Lasso", "data-model-selection"],
  },
  {
    path: "zh/notes/logistic-regression/",
    markers: ["Logistic Regression：从 Log-Odds 到概率、阈值与分类决策", "data-logistic-lab"],
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

async function verifyPage({ path, markers, validate }) {
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
  validate?.(html);
}

async function verifyRegressionProduction() {
  for (const check of checks) await verifyPage(check);
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyRegressionProduction();
    console.log(
      `Regression production verified: ${baseUrl.href} exposes the compact tag taxonomy and REG01–07 handbook routes for ${expectedSha}.`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `Regression production verification attempt ${attempt}/${attempts} failed: ${error.message}`,
    );
    if (attempt < attempts) await sleep(retryDelayMs);
  }
}

console.error(`Regression production verification failed: ${lastError?.message || "unknown error"}`);
process.exit(1);
