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
    path: "notes/sql-order-by/",
    markers: [
      "Sorting with ORDER BY",
      "ASC is the default",
      "Multi-column sorting",
      "data-order-by-lab",
      "data-order-sql-run",
    ],
    forbiddenMarkers: ["ORDER BY 排序", ">简介<"],
  },
  {
    path: "zh/notes/",
    markers: ["SQL 与关系数据", "ORDER BY"],
    forbiddenMarkers: [">简介<"],
  },
  {
    path: "zh/notes/sql-order-by/",
    markers: [
      "ORDER BY 排序",
      "ASC 是默认方向",
      "多列排序",
      "tie-breaker",
      "data-order-by-lab",
      'data-order-rule="multi"',
      'data-order-rule="stable"',
      "data-order-sql-preset",
      "data-order-sql-run",
    ],
    forbiddenMarkers: [
      "50008",
      "data-primary-key-lab",
      "data-foreign-key-lab",
      "data-relationship-cardinality-lab",
      "data-where-filter-lab",
      "data-projection-lab",
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
      throw new Error(`${path} is missing expected SQL08 marker: ${marker}`);
    }
  }

  for (const marker of forbiddenMarkers) {
    if (html.includes(marker)) {
      throw new Error(`${path} still contains forbidden/stale marker: ${marker}`);
    }
  }
}

async function verifySql08Production() {
  for (const check of checks) {
    await verifyPage(check);
  }
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifySql08Production();
    console.log(
      `SQL08 production verified: ${baseUrl.href} exposes ORDER BY index and route contracts for ${expectedSha}.`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `SQL08 production verification attempt ${attempt}/${attempts} failed: ${error.message}`,
    );
    if (attempt < attempts) await sleep(retryDelayMs);
  }
}

console.error(
  `SQL08 production verification failed: ${lastError?.message || "unknown error"}`,
);
process.exit(1);
