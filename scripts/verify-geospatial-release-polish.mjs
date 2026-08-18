import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const fail = (message) => {
  throw new Error(`[geospatial-release-polish] ${message}`);
};
const requireText = (source, token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

const component = read("src/components/GeospatialSupplyChainLabV4.astro");
const controller = read("src/scripts/geospatial-v4.js");
const home = read("src/components/HomePage.astro");
const sharedUi = read("src/i18n/shared-ui.ts");
const schema = read("src/content.config.ts");
const projectSort = read("src/utils/projects.ts");
const zhProject = read(
  "src/content/projects/geospatial-supply-chain-optimisation.zh.md",
);
const enProject = read(
  "src/content/projects/geospatial-supply-chain-optimisation.en.md",
);
const labPages = [
  read("src/pages/lab/geospatial-supply-chain.astro"),
  read("src/pages/zh/lab/geospatial-supply-chain.astro"),
];
const publicSources = [
  component,
  controller,
  read("src/scripts/geospatial-transshipment.js"),
  read("src/scripts/geospatial-fleet-routing.js"),
  read("src/scripts/geospatial-inventory-variability.js"),
  read("src/scripts/geospatial-service-resilience.js"),
  zhProject,
  enProject,
];

for (const forbidden of [
  "课程 OD",
  "Course OD",
  "课程基线",
  "course baseline",
  "功能完整性优先",
  "BUSINFO",
  "Astro/TypeScript",
  "ESLint",
  "unit tests",
]) {
  if (
    publicSources.some((source) =>
      source.toLowerCase().includes(forbidden.toLowerCase()),
    )
  ) {
    fail(`Public geospatial copy still contains: ${forbidden}`);
  }
}

if (component.includes("geo4__identity"))
  fail("Map identity panel was not fully removed");
if (fs.existsSync(path.join(root, "src/scripts/geospatial-model-boundary.js"))) {
  fail("Obsolete runtime model-boundary text patch still exists");
}

for (const [token, label] of [
  ["快速 OD 网络", "Chinese Fast OD Network label"],
  ["Fast OD Network", "English Fast OD Network label"],
  ["geo4-kpi-network-label", "dynamic network KPI label"],
  ["geo4-kpi-transport", "transport-cost KPI"],
  ["geo4-kpi-delta", "baseline cost delta"],
  ["geo4-coverage-pulse", "facility coverage pulse"],
  ["is-covered", "covered demand state"],
  ["is-uncovered", "uncovered demand state"],
  ["is-redundant", "redundant coverage state"],
  ["prefers-reduced-motion", "coverage reduced-motion rule"],
])
  requireText(component, token, label);

for (const [token, label] of [
  ["Average delivery distance", "Fast OD distance semantics"],
  ["Average travel time", "OSM time semantics"],
  ["solution.transportCost", "calculated transport-cost output"],
  ["baselineSolution", "re-solved baseline snapshot"],
  ["coverCounts", "model-derived demand coverage"],
  ["scrollWheelZoom: true", "mouse-wheel map zoom"],
  ["doubleClickZoom: true", "double-click map zoom"],
  ["touchZoom: true", "touch map zoom"],
  ["keyboard: true", "keyboard map zoom"],
  ['q("geo4-threshold").value = "30"', "OSM default service-time threshold"],
])
  requireText(controller, token, label);

for (const [source, token, label] of [
  [home, "home-hero__featured-project", "homepage featured project entry"],
  [home, "sortProjects", "homepage shared project ordering"],
  [sharedUi, "基于地理空间的供应链优化", "Chinese homepage entry"],
  [sharedUi, "Geospatial Supply Chain Optimisation", "English homepage entry"],
  [schema, "priority: z.number().int().default(0)", "project priority schema"],
  [
    projectSort,
    "right.data.priority - left.data.priority",
    "priority-first project sorting",
  ],
  [zhProject, "priority: 100", "Chinese project priority"],
  [enProject, "priority: 100", "English project priority"],
])
  requireText(source, token, label);

for (const page of [
  "src/pages/projects/index.astro",
  "src/pages/projects/page/[page].astro",
  "src/pages/zh/projects/index.astro",
  "src/pages/zh/projects/page/[page].astro",
])
  requireText(read(page), "sortProjects", `shared ordering in ${page}`);

for (const page of labPages) {
  requireText(page, "calc(100% - 1rem)", "scrollbar-safe lab width");
  if (page.includes("calc(100vw - 1rem)")) {
    fail("Lab shell must not use viewport width that includes the scrollbar");
  }
}

console.log(
  "[geospatial-release-polish] PASS: public copy, KPI semantics, model-derived coverage feedback, homepage entry and priority-first project ordering verified.",
);
