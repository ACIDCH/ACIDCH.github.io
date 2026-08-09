import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("production deployment contracts", () => {
  it("deploys from main pushes and merged PR close events", async () => {
    const workflow = await source(".github/workflows/deploy.yml");

    expect(workflow).toContain("types: [opened, synchronize, reopened, closed]");
    expect(workflow).toContain("github.event.pull_request.merged == true");
    expect(workflow).toContain("Resolve checked-out revision");
    expect(workflow).toContain("deploy_sha:");
    expect(workflow).toContain("needs.quality.outputs.deploy_sha");
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
});
