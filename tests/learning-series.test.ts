import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const series = readFileSync("src/data/learning-series.ts", "utf8");
const route = readFileSync("src/pages/zh/notes/series/[series].astro", "utf8");
const search = readFileSync("src/components/GlobalSearch.astro", "utf8");

describe("Learning Notes publication structure", () => {
  it("defines the five public Chinese learning-series routes", () => {
    ["r-statistics", "regression", "sql", "python", "decision-models"].forEach(
      (slug) => {
        expect(series).toContain(`slug: "${slug}"`);
      },
    );
    expect(route).toContain("getStaticPaths");
  });

  it("does not publish draft notes through global search", () => {
    expect(search).toContain(".filter((entry) => !entry.data.draft)");
  });
});
