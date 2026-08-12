import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dataScienceUi } from "../src/i18n/data-science-ui";
import { decisionUi } from "../src/i18n/decision-ui";
import { learningShellUi } from "../src/i18n/learning-shell-ui";
import { sqlUi } from "../src/i18n/sql-ui";

const convertedComponents = [
  "DataScienceAdvancedSections",
  "FeasibleRegionSensitivityLab",
  "FixedChargeMilpLab",
  "ForeignKeyLab",
  "LearningNoteToc",
  "ModelScaleLab",
  "OptimisationAnatomyLab",
  "OrderByLab",
  "PaginationLab",
  "PlanningHorizonLab",
  "PredictionThresholdLab",
  "PrimaryKeyLab",
  "ProjectionColumnsLab",
  "PulpModelAnatomyLab",
  "RelationalModelExplorer",
  "RelationshipCardinalityLab",
  "SqlDatasetExplorer",
  "SqlPlayground",
  "SupplyChainFlowLab",
  "UnconstrainedTradeoffLab",
  "WhereFilterLab",
] as const;

const sortedKeys = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    sortedKeys(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe("locale-aware decision, SQL and data-science learning UI", () => {
  it("keeps every dictionary shape aligned across locales", () => {
    for (const dictionary of [decisionUi, sqlUi, dataScienceUi, learningShellUi]) {
      expect(sortedKeys(dictionary.en).sort()).toEqual(
        sortedKeys(dictionary.zh).sort(),
      );
    }
  });

  it("provides English copy without Chinese leakage and genuine Chinese copy", () => {
    for (const dictionary of [decisionUi, sqlUi, dataScienceUi, learningShellUi]) {
      expect(JSON.stringify(dictionary.en)).not.toMatch(/[\p{Script=Han}]/u);
      expect(JSON.stringify(dictionary.zh)).toMatch(/[\p{Script=Han}]/u);
    }
  });

  it("keeps locale copy outside every converted interaction component", () => {
    for (const component of convertedComponents) {
      const source = readFileSync(`src/components/learning/${component}.astro`, "utf8");
      expect(source).not.toMatch(/[\p{Script=Han}]/u);
    }
  });

  it("passes the content locale through all three learning render paths", () => {
    const note = readFileSync("src/layouts/NoteLayout.astro", "utf8");
    const decision = readFileSync("src/layouts/DecisionModelNoteLayout.astro", "utf8");
    const dataScience = readFileSync("src/layouts/DataScienceNoteLayout.astro", "utf8");

    expect(note).toContain("<SqlPlayground locale={entry.data.locale} />");
    expect(note).toContain("<OrderByLab locale={entry.data.locale} />");
    expect(decision).toContain("<DecisionModelLearningBlocks");
    expect(decision).toContain("locale={entry.data.locale}");
    expect(dataScience).toContain(
      "<PredictionThresholdLab locale={entry.data.locale} />",
    );
  });

  it("preserves established interaction, reset and keyboard hooks", () => {
    const sql = readFileSync("src/components/learning/SqlPlayground.astro", "utf8");
    const pagination = readFileSync(
      "src/components/learning/PaginationLab.astro",
      "utf8",
    );
    const threshold = readFileSync(
      "src/components/learning/PredictionThresholdLab.astro",
      "utf8",
    );
    const milp = readFileSync(
      "src/components/learning/FixedChargeMilpLab.astro",
      "utf8",
    );

    expect(sql).toContain('resetControl.addEventListener(\n      "click"');
    expect(sql).toContain('event.key === "Enter"');
    expect(pagination).toContain('nextButton.addEventListener(\n      "click"');
    expect(threshold).toContain('slider.addEventListener("input", draw');
    expect(milp).toContain("button.addEventListener(");
    expect(milp).toContain('"click"');
  });

  it("keeps decision-model visual proof waits aligned with the Chinese route", () => {
    const proof = readFileSync("scripts/capture-pr-decision-model-visuals.py", "utf8");
    expect(proof).toContain('horizon_text = "短期" if mobile else "容量"');
    expect(proof).not.toContain(
      'horizon_text = "short-term" if mobile else "capacity"',
    );
  });
});
