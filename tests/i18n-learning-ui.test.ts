import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { learningLabUi } from "../src/i18n/learning-ui";

const convertedComponents = [
  "CorrelationLab",
  "DescriptiveStatisticsLab",
  "NormalDistributionLab",
  "SamplingPrecisionLab",
  "RegressionLab",
  "RegressionDiagnosticsLab",
  "PolynomialRegressionLab",
  "MulticollinearityLab",
  "ModelSelectionLab",
  "LogisticRegressionLab",
] as const;

const sortedKeys = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    sortedKeys(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe("locale-aware statistics and regression labs", () => {
  it("keeps the English and Chinese dictionary shapes identical", () => {
    expect(sortedKeys(learningLabUi.en).sort()).toEqual(
      sortedKeys(learningLabUi.zh).sort(),
    );
  });

  it("provides genuine English and Chinese copy for every converted lab", () => {
    for (const key of Object.keys(learningLabUi.en) as Array<
      keyof typeof learningLabUi.en
    >) {
      const english = JSON.stringify(learningLabUi.en[key]);
      const chinese = JSON.stringify(learningLabUi.zh[key]);
      expect(english).not.toMatch(/[\p{Script=Han}]/u);
      expect(chinese).toMatch(/[\p{Script=Han}]/u);
    }
  });

  it("keeps visible locale copy outside shared interaction logic", () => {
    for (const component of convertedComponents) {
      const source = readFileSync(`src/components/learning/${component}.astro`, "utf8");
      expect(source).toContain('from "../../i18n/learning-ui"');
      expect(source).toContain("data-copy={JSON.stringify(copy)}");
      expect(source).not.toMatch(/[\p{Script=Han}]/u);
    }
  });

  it("passes the content locale through both general and regression render paths", () => {
    const noteLayout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
    const regressionLayout = readFileSync(
      "src/layouts/RegressionNoteLayout.astro",
      "utf8",
    );
    const regressionBlocks = readFileSync(
      "src/components/learning/RegressionLearningBlocks.astro",
      "utf8",
    );

    expect(noteLayout).toContain(
      "<DescriptiveStatisticsLab locale={entry.data.locale} />",
    );
    expect(noteLayout).toContain("<SamplingPrecisionLab locale={entry.data.locale} />");
    expect(regressionLayout).toContain(
      "<RegressionLearningBlocks slug={entry.data.slug} locale={entry.data.locale} />",
    );
    expect(regressionBlocks).toContain("<LogisticRegressionLab locale={locale} />");
  });

  it("preserves established event and keyboard interaction hooks", () => {
    const statistics = readFileSync(
      "src/components/learning/DescriptiveStatisticsLab.astro",
      "utf8",
    );
    const sampling = readFileSync(
      "src/components/learning/SamplingPrecisionLab.astro",
      "utf8",
    );
    const regression = readFileSync(
      "src/components/learning/RegressionLab.astro",
      "utf8",
    );

    expect(statistics).toContain('range?.addEventListener(\n      "input"');
    expect(statistics).toContain('"[data-stat-reset]"');
    expect(sampling).toContain('nInput.addEventListener("input", draw');
    expect(sampling).toContain('reset.addEventListener("click", resetLab');
    expect(regression).toContain('input.addEventListener("input", draw');
  });
});
