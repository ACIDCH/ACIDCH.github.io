import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const deploy = readFileSync(".github/workflows/deploy.yml", "utf8");
const translation = readFileSync(".github/workflows/i18n-translation.yml", "utf8");

describe("strict bilingual workflow", () => {
  it("blocks published sync drift in the main CI workflow", () => {
    expect(deploy).toContain("Enforce strict bilingual sync parity");
    expect(deploy).toContain("npm run audit:i18n-sync:strict");
    expect(deploy).toContain("npm run audit:i18n-final");
  });

  it("offers a controlled, review-first future translation workflow", () => {
    expect(translation).toContain("workflow_dispatch:");
    expect(translation).toContain("scripts/i18n-translate.mjs");
    expect(translation).toContain("scripts/i18n-protected.mjs");
    expect(translation).toContain("node scripts/i18n-sync.mjs --write --strict");
    expect(translation).toContain("gh pr create --draft");
  });
});
