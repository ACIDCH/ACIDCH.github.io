import process from "node:process";
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

const pageChecks = [
  {
    path: "zh/",
    markers: ["关于我", "学习笔记"],
  },
  {
    path: "zh/about/",
    markers: ["关于我", "商业分析"],
  },
  {
    path: "zh/projects/",
    markers: ["项目"],
  },
  {
    path: "zh/projects/customer-churn-machine-learning/",
    markers: ["Machine Learning", "0.9053"],
  },
  {
    path: "zh/projects/customer-churn-machine-learning/data-validation/",
    markers: [],
  },
  {
    path: "zh/projects/customer-churn-machine-learning/model-comparison/",
    markers: [],
  },
  {
    path: "zh/projects/customer-churn-machine-learning/model-selection-error-analysis/",
    markers: [],
  },
  {
    path: "zh/projects/customer-churn-machine-learning/logistic-interpretation/",
    markers: [],
  },
  {
    path: "zh/projects/customer-churn-machine-learning/neural-network/",
    markers: [],
  },
];

function deploymentUrl(pathname) {
  const url = new URL(pathname, baseUrl);
  url.searchParams.set("deployment", expectedSha.slice(0, 12));
  return url;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
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

async function verifyPage({ path, markers }) {
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
      `Production verified: ${baseUrl.href} is serving ${expectedSha} and all required routes passed.`,
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

console.error(`Production verification failed: ${lastError?.message || "unknown error"}`);
process.exit(1);
