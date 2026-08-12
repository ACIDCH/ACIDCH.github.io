import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const handbooks = [
  { source: "descriptive-statistics.zh.md", route: "descriptive-statistics" },
  { source: "regression-foundations.zh.md", route: "regression-foundations" },
  { source: "regression-diagnostics.zh.md", route: "regression-diagnostics" },
  {
    source: "nonlinear-regression-interactions.zh.md",
    route: "nonlinear-regression-interactions",
  },
  {
    source: "multiple-regression-multicollinearity.zh.md",
    route: "multiple-regression-multicollinearity",
  },
  { source: "influential-observations.zh.md", route: "influential-observations" },
  {
    source: "regression-feature-selection.zh.md",
    route: "regression-feature-selection",
  },
  { source: "logistic-regression.zh.md", route: "logistic-regression" },
  { source: "sql-relational-data.zh.md", route: "sql-relational-data" },
  { source: "sql-primary-key.zh.md", route: "sql-primary-key" },
  { source: "sql-foreign-key.zh.md", route: "sql-foreign-key" },
  { source: "sql-relationships.zh.md", route: "sql-relationships" },
  { source: "sql-select.zh.md", route: "sql-select" },
  { source: "sql-where.zh.md", route: "sql-where" },
  { source: "sql-projection.zh.md", route: "sql-projection" },
  { source: "sql-order-by.zh.md", route: "sql-order-by" },
  { source: "sql-pagination.zh.md", route: "sql-pagination" },
  { source: "optimisation-model-anatomy.zh.md", route: "optimisation-model-anatomy" },
  { source: "unconstrained-optimisation.zh.md", route: "unconstrained-optimisation" },
  { source: "constrained-optimisation.zh.md", route: "constrained-optimisation" },
  {
    source: "optimisation-sensitivity-analysis.zh.md",
    route: "optimisation-sensitivity-analysis",
  },
  { source: "binary-milp-decisions.zh.md", route: "binary-milp-decisions" },
  { source: "sets-indices-model-scale.zh.md", route: "sets-indices-model-scale" },
  { source: "pulp-model-architecture.zh.md", route: "pulp-model-architecture" },
  {
    source: "multidimensional-optimisation.zh.md",
    route: "multidimensional-optimisation",
  },
  { source: "transportation-models.zh.md", route: "transportation-models" },
  {
    source: "multi-period-production-inventory.zh.md",
    route: "multi-period-production-inventory",
  },
];

const forbidden = [
  /\bAI\b/iu,
  /人工智能/u,
  /ChatGPT/iu,
  /OpenAI/iu,
  /LLM/iu,
  /BUSINFO/iu,
  /Assignment/iu,
  /Task/iu,
  /Submission/iu,
  /样板页/u,
  /试点页/u,
];

for (const handbook of handbooks) {
  const notePath = join("src", "content", "notes", handbook.source);
  if (!existsSync(notePath)) {
    console.error(`Learning-note source is missing: ${handbook.source}`);
    process.exit(1);
  }

  const note = readFileSync(notePath, "utf8");
  const publicText = note.replace(/^---[\s\S]*?---\s*/u, "");
  const sourceHits = forbidden.filter((pattern) => pattern.test(publicText));
  if (sourceHits.length) {
    console.error(
      `Learning-note public source contains a restricted label: ${handbook.source}`,
    );
    process.exit(1);
  }

  const buildRoute = join("dist", "zh", "notes", handbook.route, "index.html");
  if (!existsSync(buildRoute)) {
    console.error(`Published learning note was not emitted: ${handbook.route}`);
    process.exit(1);
  }

  const builtText = readFileSync(buildRoute, "utf8");
  // Astro embeds the global search catalogue and client code in script tags. Those
  // payloads are not part of this handbook's rendered public copy, so scanning the
  // complete document creates cross-page false positives (for example, ordinary
  // English prose containing "task"). Keep the built-output check focused on
  // visible markup while the source check above continues to inspect the full note.
  const visibleBuiltText = builtText
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "")
    .replace(/<!--[\s\S]*?-->/gu, "");
  if (forbidden.some((pattern) => pattern.test(visibleBuiltText))) {
    console.error(
      `Published learning-note build contains a restricted label: ${handbook.route}`,
    );
    process.exit(1);
  }
}

console.log(
  `Learning-note audit passed (${handbooks.length} published handbooks and public builds are clean).`,
);
