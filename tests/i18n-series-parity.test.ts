import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { learningSeries } from "../src/data/learning-series";
import { localizeLearningSeries } from "../src/i18n/learning-series";

describe("bilingual Learning Series parity", () => {
  it("provides complete English copy for every shared series module", () => {
    for (const series of learningSeries) {
      const english = localizeLearningSeries(series, "en");
      expect(english.slug).toBe(series.slug);
      expect(english.modules.map((module) => module.code)).toEqual(
        series.modules.map((module) => module.code),
      );
      expect(english.title).toMatch(/[A-Za-z]/);
      english.modules.forEach((module) => {
        expect(module.title).toMatch(/[A-Za-z]/);
        expect(module.summary).toMatch(/[A-Za-z]/);
      });
    }
  });

  it("uses one shared page component for English and Chinese routes", () => {
    for (const route of [
      "src/pages/notes/series/[series].astro",
      "src/pages/zh/notes/series/[series].astro",
    ]) {
      expect(readFileSync(route, "utf8")).toContain("LearningSeriesPage");
    }
  });
});
