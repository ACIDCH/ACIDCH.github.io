import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const noteRenderer = readFileSync("src/components/NoteRenderer.astro", "utf8");
const projectRenderer = readFileSync("src/components/ProjectRenderer.astro", "utf8");
const noteLayout = readFileSync("src/layouts/NoteLayout.astro", "utf8");

describe("bilingual layout parity", () => {
  it("selects specialised Note layouts from shared series metadata", () => {
    expect(noteRenderer).toContain('"data-science-r": DataScienceNoteLayout');
    expect(noteRenderer).toContain('"decision-models": DecisionModelNoteLayout');
    expect(noteRenderer).toContain("regression: RegressionNoteLayout");
  });

  it("selects specialised Project renderers from translationKey", () => {
    [
      "RetirementMonteCarloProject",
      "PowerBIDashboardProject",
      "PythonAnalysisProject",
      "SqlDatabaseProject",
      "RMachineLearningProject",
    ].forEach((renderer) => expect(projectRenderer).toContain(renderer));
    expect(projectRenderer).toContain("entry.data.translationKey");
  });

  it("does not use locale-sensitive slugs for Note specialisation", () => {
    expect(noteLayout).not.toMatch(/entry\.data\.slug\s*===/);
    expect(noteLayout).toContain("entry.data.translationKey");
  });
});
