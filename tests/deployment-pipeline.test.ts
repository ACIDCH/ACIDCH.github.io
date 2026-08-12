import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("production deployment contracts", () => {
  it("deploys from main pushes and merged PRs in the default-branch context", async () => {
    const workflow = await source(".github/workflows/deploy.yml");

    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("types: [closed]");
    expect(workflow).toContain("github.event_name == 'pull_request_target'");
    expect(workflow).toContain("github.event.pull_request.merged == true");
    expect(workflow).toContain("Resolve checked-out revision");
    expect(workflow).toContain("deploy_sha:");
    expect(workflow).toContain("needs.quality.outputs.deploy_sha");
    expect(workflow).toContain(
      "github.event.pull_request.merged == true && 'main' || github.sha",
    );
    expect(workflow).toContain("github.event_name == 'push'");
    expect(workflow).toContain("&& 'main' || github.ref");
    expect(workflow).not.toContain("github.event.pull_request.head.sha");
    expect(workflow).not.toContain("types: [opened, synchronize, reopened, closed]");
  });

  it("keeps 关于我 consistent across public About entry points", async () => {
    const home = await source("src/components/HomePage.astro");
    const search = await source("src/components/GlobalSearch.astro");
    const sharedUi = await source("src/i18n/shared-ui.ts");
    const legacy = await source("src/components/LegacyRoute.astro");

    expect(home).toContain("sharedUi[locale].home");
    expect(search).toContain("sharedUi[pageLocale].search.pages");
    expect(sharedUi).toContain('aboutAction: "关于我"');
    expect(sharedUi).not.toContain('aboutAction: "简介"');
    expect(sharedUi).toContain('title: "关于我"');
    expect(sharedUi).toContain('searchText: "关于我 个人概况');
    expect(legacy).toContain("前往关于我");
    expect(legacy).not.toContain("前往简介");
  });

  it("checks the built flagship before deployment", async () => {
    const packageJson = await source("package.json");
    const verifier = await source("scripts/verify-built-churn.mjs");

    expect(packageJson).toContain("verify-built-churn.mjs");
    expect(verifier).toContain("关于我");
    expect(verifier).toContain("data-native-or");
    expect(verifier).toContain("numeric-distributions.webp");
  });

  it("rejects stale navigation and archived raster assets in production", async () => {
    const verifier = await source("scripts/verify-production.mjs");

    expect(verifier).toContain("forbiddenMarkers");
    expect(verifier).toContain(">简介<");
    expect(verifier).toContain("service-interactions.webp");
    expect(verifier).toContain("data-model-evaluation");
  });

  it("verifies SQL08 itself after the Pages deployment", async () => {
    const workflow = await source(".github/workflows/deploy.yml");
    const verifier = await source("scripts/verify-sql08-production.mjs");

    expect(workflow).toContain("node scripts/verify-sql08-production.mjs");
    expect(verifier).toContain('path: "zh/notes/sql-order-by/"');
    expect(verifier).toContain("ORDER BY 排序");
    expect(verifier).toContain('data-order-rule="multi"');
    expect(verifier).toContain('data-order-rule="stable"');
    expect(verifier).toContain("data-order-sql-run");
    expect(verifier).toContain("50008");
  });

  it("verifies SQL09 Pagination and its four browser proofs", async () => {
    const workflow = await source(".github/workflows/deploy.yml");
    const verifier = await source("scripts/verify-sql09-production.mjs");
    const capture = await source("scripts/capture-pr-sql09-visuals.py");

    expect(workflow).toContain("Capture SQL 01–09 visual proofs");
    expect(workflow).toContain("python3 scripts/capture-pr-sql09-visuals.py");
    expect(workflow).toContain("node scripts/verify-sql09-production.mjs");
    expect(verifier).toContain('path: "zh/notes/sql-pagination/"');
    expect(verifier).toContain("分页查询");
    expect(verifier).toContain("data-pagination-page-size");
    expect(verifier).toContain("data-pagination-page-index");
    expect(verifier).toContain("data-pagination-run");
    expect(verifier).toContain("50008");
    expect(capture).toContain("sql09-pagination-page2-desktop.png");
    expect(capture).toContain("sql09-pagination-sqlite-page2-desktop.png");
    expect(capture).toContain("sql09-pagination-page2-mobile.png");
    expect(capture).toContain("sql09-pagination-sqlite-page2-mobile.png");
    expect(capture).toContain("expected = 30");
  });

  it("verifies the compact supply-chain folder, project grids and twenty-six layout proofs", async () => {
    const workflow = await source(".github/workflows/deploy.yml");
    const verifier = await source("scripts/verify-decision-models-production.mjs");
    const capture = await source("scripts/capture-pr-decision-model-visuals.py");

    expect(workflow).toContain("Capture decision-model visual proofs");
    expect(workflow).toContain("python3 scripts/capture-pr-decision-model-visuals.py");
    expect(workflow).toContain("node scripts/verify-decision-models-production.mjs");
    expect(workflow).toContain("decision-proofs");
    expect(verifier).toContain('path: "zh/notes/"');
    expect(verifier).toContain('path: "zh/notes/series/decision-models/"');
    expect(verifier).toContain('path: "zh/notes/optimisation-model-anatomy/"');
    expect(verifier).toContain('path: "zh/notes/multi-period-production-inventory/"');
    expect(verifier).toContain("按标签浏览");
    expect(verifier).toContain("按主题进入知识库");
    expect(verifier).toContain("全部笔记");
    expect(verifier).toContain("orderedMarkers");
    expect(verifier).toContain("供应链与优化");
    expect(verifier).toContain("data-optimisation-anatomy");
    expect(verifier).toContain("data-feasible-lab");
    expect(verifier).toContain("data-milp-lab");
    expect(verifier).toContain("data-flow-lab");
    expect(capture).toContain('browser.screenshot(f"dm-folder-index-{suffix}.png")');
    expect(capture).toContain('browser.screenshot(f"project-grid-home-{suffix}.png")');
    expect(capture).toContain('browser.screenshot(f"project-grid-index-{suffix}.png")');
    expect(capture).toContain(
      'browser.screenshot(f"dm10-two-batch-plan-{suffix}.png")',
    );
    expect(capture).toContain("expected = 26");
  });

  it("verifies canonical tags and REG01–07 with ten dedicated browser proofs", async () => {
    const workflow = await source(".github/workflows/deploy.yml");
    const verifier = await source("scripts/verify-regression-production.mjs");
    const capture = await source("scripts/capture-pr-regression-visuals.py");

    expect(workflow).toContain("Capture regression and floating-tag visual proofs");
    expect(workflow).toContain("python3 scripts/capture-pr-regression-visuals.py");
    expect(workflow).toContain("node scripts/verify-regression-production.mjs");
    expect(workflow).toContain("regression-proofs");
    expect(verifier).toContain('path: "zh/notes/series/regression/"');
    expect(verifier).toContain('path: "zh/notes/regression-foundations/"');
    expect(verifier).toContain('path: "zh/notes/logistic-regression/"');
    expect(verifier).toContain('data-note-tag="回归建模"');
    expect(verifier).toContain("canonical.length > 10");
    expect(verifier).toContain("data-regression-lab");
    expect(verifier).toContain("data-regression-diagnostics");
    expect(verifier).toContain("data-polynomial-regression");
    expect(verifier).toContain("data-multicollinearity");
    expect(verifier).toContain("data-model-selection");
    expect(verifier).toContain("data-logistic-lab");
    expect(capture).toContain('browser.screenshot(f"reg-tag-map-{suffix}.png")');
    expect(capture).toContain('browser.screenshot(f"reg-series-{suffix}.png")');
    expect(capture).toContain("reg01-outlier-desktop.png");
    expect(capture).toContain("reg07-logistic-threshold-mobile.png");
    expect(capture).toContain("expected = 10");
  });

  it("publishes a machine-readable commit status after live verification", async () => {
    const workflow = await source(".github/workflows/deploy.yml");

    expect(workflow).toContain("statuses: write");
    expect(workflow).toContain("Publish auditable production verification receipt");
    expect(workflow).toContain("production/live-verification");
    expect(workflow).toContain("GitHub Pages live verification passed");
    expect(workflow).toContain("GitHub Pages live verification failed");
    expect(workflow).toContain(
      "$GITHUB_API_URL/repos/$REPOSITORY/statuses/$TARGET_SHA",
    );
    expect(workflow).toContain("if: always()");
  });
});
