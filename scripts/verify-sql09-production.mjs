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
    markers: ["SQL 与关系数据", "Pagination"],
    forbiddenMarkers: [">简介<"],
  },
  {
    path: "zh/notes/sql-pagination/",
    markers: [
      "Pagination：把有序结果切成可重复的页面窗口",
      "LIMIT 定义页面最多返回多少行",
      "OFFSET 定义先跳过多少行",
      "Keyset pagination",
      "data-pagination-lab",
      "data-pagination-page-size",
      "data-pagination-page-index",
      "data-pagination-demo-beyond",
      "data-pagination-run",
      "ORDER BY order_value DESC, order_id ASC",
    ],
    forbiddenMarkers: [
      "50008",
      "data-primary-key-lab",
      "data-foreign-key-lab",
      "data-relationship-cardinality-lab",
      "data-where-filter-lab",
      "data-projection-lab",
      "data-order-by-lab",
      ">简介<",
    ],
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

async function verifyPage({ path, markers, forbiddenMarkers = [] }) {
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
      throw new Error(`${path} is missing expected SQL09 marker: ${marker}`);
    }
  }

  for (const marker of forbiddenMarkers) {
    if (html.includes(marker)) {
      throw new Error(`${path} still contains forbidden/stale marker: ${marker}`);
    }
  }
}

async function verifySql09Production() {
  for (const check of checks) {
    await verifyPage(check);
  }
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifySql09Production();
    console.log(
      `SQL09 production verified: ${baseUrl.href} exposes Pagination index and route contracts for ${expectedSha}.`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `SQL09 production verification attempt ${attempt}/${attempts} failed: ${error.message}`,
    );
    if (attempt < attempts) await sleep(retryDelayMs);
  }
}

console.error(`SQL09 production verification failed: ${lastError?.message || "unknown error"}`);
process.exit(1);
