const [baseArgument, expectedSha] = globalThis.process.argv.slice(2);
if (!baseArgument || !expectedSha) {
  console.error(
    "Usage: node scripts/verify-geospatial-production.mjs <base-url> <sha>",
  );
  globalThis.process.exit(1);
}

const baseUrl = new URL(baseArgument.endsWith("/") ? baseArgument : `${baseArgument}/`);
const wait = (milliseconds) =>
  new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));

async function fetchText(pathname) {
  const url = new URL(pathname, baseUrl);
  url.searchParams.set("deployment", expectedSha.slice(0, 12));
  const response = await globalThis.fetch(url, {
    signal: globalThis.AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${pathname} returned HTTP ${response.status}`);
  return response.text();
}

async function fetchModuleGraph(entries) {
  const pending = entries.map((entry) => new URL(entry, baseUrl));
  const visited = new Set();
  const sources = [];
  while (pending.length && visited.size < 128) {
    const url = pending.shift();
    if (visited.has(url.href)) continue;
    visited.add(url.href);
    const response = await globalThis.fetch(url, {
      signal: globalThis.AbortSignal.timeout(15000),
    });
    if (!response.ok) continue;
    const source = await response.text();
    sources.push(source);
    for (const match of source.matchAll(
      /(?:from\s*|import\s*\()?['"]([^'"]+\.js)['"]/g,
    )) {
      const dependency = new URL(match[1], url);
      if (dependency.origin === baseUrl.origin && !visited.has(dependency.href)) {
        pending.push(dependency);
      }
    }
  }
  return sources.join("\n");
}

function requireText(source, token, label) {
  if (!source.includes(token)) throw new Error(`Production GIS missing ${label}`);
}

async function verify() {
  const marker = JSON.parse(await fetchText("deploy-meta.json"));
  if (marker.sha !== expectedSha) {
    throw new Error(
      `production is serving ${marker.sha || "unknown"}, expected ${expectedSha}`,
    );
  }
  const routes = ["lab/geospatial-supply-chain/", "zh/lab/geospatial-supply-chain/"];
  const pages = await Promise.all(routes.map(fetchText));
  for (const page of pages) {
    for (const [token, label] of [
      ["geo4-criticality", "criticality control"],
      ["geo4-sankey-canvas", "Sankey canvas"],
      ["geo4-explain-drawer", "explainability drawer"],
      ["geo4-mc-cvar", "CVaR output"],
      ["geo4-engine", "network engine"],
    ])
      requireText(page, token, label);
  }
  const scripts = [
    ...new Set(
      pages.flatMap((page) =>
        [...page.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((match) => match[1]),
      ),
    ),
  ];
  const source = await fetchModuleGraph(scripts);
  requireText(source, "geospatial-analysis", "module Worker bundle reference");
  requireText(source, "criticality", "criticality runtime");
  requireText(source, "Factory to Warehouse to Demand Sankey", "Sankey runtime");
}

let lastError;
for (let attempt = 1; attempt <= 10; attempt += 1) {
  try {
    await verify();
    console.log(
      `[geospatial-production] PASS: bilingual GIS, Worker, criticality, Sankey and explainability assets verified for ${expectedSha}.`,
    );
    globalThis.process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(
      `[geospatial-production] attempt ${attempt}/10 failed: ${error.message}`,
    );
    if (attempt < 10) await wait(12000);
  }
}
console.error(`[geospatial-production] FAIL: ${lastError?.message || "unknown error"}`);
globalThis.process.exit(1);
