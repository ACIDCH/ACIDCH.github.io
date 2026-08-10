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
    const legacy = await source("src/components/LegacyRoute.astro");

    expect(home).toContain('aboutAction: "关于我"');
    expect(home).not.toContain('aboutAction: "简介"');
    expect(search).toContain('title: "关于我"');
    expect(search).toContain('searchText: "关于我 个人概况');
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
    expect(verifier).toContain("ORDER BY：把结果顺序变成明确的数据契约");
    expect(verifier).toContain('data-order-rule="multi"');
    expect(verifier).toContain('data-order-rule="stable"');
    expect(verifier).toContain("data-order-sql-run");
    expect(verifier).toContain("50008");
  });
});
