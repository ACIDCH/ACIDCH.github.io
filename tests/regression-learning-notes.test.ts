import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getLearningSeries } from "../src/data/learning-series";

const read = (path: string) => readFileSync(path, "utf8");
const noteFiles = [
  "regression-foundations.zh.md",
  "regression-diagnostics.zh.md",
  "nonlinear-regression-interactions.zh.md",
  "multiple-regression-multicollinearity.zh.md",
  "influential-observations.zh.md",
  "regression-feature-selection.zh.md",
  "logistic-regression.zh.md",
];
const notes = noteFiles.map((file) => read(`src/content/notes/${file}`));
const route = read("src/pages/zh/notes/[slug].astro");
const layout = read("src/layouts/RegressionNoteLayout.astro");
const blocks = read("src/components/learning/RegressionLearningBlocks.astro");
const taxonomy = read("src/data/note-tag-taxonomy.ts");
const noteList = read("src/components/NoteList.astro");

describe("Regression and statistics Learning Notes", () => {
  it("publishes a seven-module regression roadmap", () => {
    const series = getLearningSeries("regression");
    expect(series).toBeDefined();
    expect(series?.modules).toHaveLength(7);
    expect(series?.modules.map((module) => module.code)).toEqual([
      "REG 01",
      "REG 02",
      "REG 03",
      "REG 04",
      "REG 05",
      "REG 06",
      "REG 07",
    ]);
    expect(series?.modules.at(-1)?.title).toBe("Logistic Regression");
  });

  it("keeps all seven regression notes published and in sequence", () => {
    notes.forEach((note, index) => {
      expect(note).toContain("seriesSlug: regression");
      expect(note).toContain(`order: ${index + 1}`);
      expect(note).toContain("status: published");
      expect(note).toContain("draft: false");
      expect(note.length).toBeGreaterThan(4200);
      expect((note.match(/^## /gmu) || []).length).toBeGreaterThanOrEqual(8);
    });
  });

  it("covers the reference learning arc without copying its classroom datasets", () => {
    const joined = notes.join("\n");
    [
      "最小二乘",
      "Scale–Location",
      "多项式",
      "VIF",
      "Cook’s distance",
      "Lasso",
      "Logistic Regression",
    ].forEach((marker) => expect(joined).toContain(marker));
    expect(joined).not.toContain("student_data");
    expect(joined).not.toContain("housing_data");
    expect(joined).not.toContain("Credit)");
    expect(joined).not.toContain("oring.csv");
  });

  it("routes regression notes through a generated-TOC editorial layout", () => {
    expect(route).toContain('entry.data.seriesSlug === "regression"');
    expect(route).toContain("RegressionNoteLayout");
    expect(layout).toContain("LearningNoteHero");
    expect(layout).toContain("LearningNoteToc");
    expect(layout).toContain("heading.depth === 2");
    expect(layout).toContain("RegressionLearningBlocks");
  });

  it("provides an interactive learning block for every regression module", () => {
    [
      "RegressionLab",
      "RegressionDiagnosticsLab",
      "PolynomialRegressionLab",
      "MulticollinearityLab",
      "ModelSelectionLab",
      "LogisticRegressionLab",
    ].forEach((component) => expect(blocks).toContain(component));
    [
      "regression-line-lab",
      "regression-diagnostics-lab",
      "polynomial-regression-lab",
      "multicollinearity-lab",
      "influence-diagnostics-lab",
      "model-selection-lab",
      "logistic-regression-lab",
    ].forEach((slot) => expect(blocks).toContain(slot));
  });

  it("caps the Learning Notes index at a small canonical taxonomy", () => {
    expect((taxonomy.match(/\nid: "/gu) || []).length).toBeLessThanOrEqual(10);
    expect(taxonomy).toContain("return tags.slice(0, 2)");
    expect(noteList).toContain("getCanonicalNoteTags(entry)");
    expect(noteList).toContain('data-tags={canonicalTags.join("|")');
  });

  it("keeps public regression notes free of private, course-facing and first-person labels", () => {
    notes.forEach((note) => {
      expect(note).not.toMatch(/BUSINFO|Assignment|Submission|399162766/iu);
      expect(note).not.toMatch(/Xintao Liu|LIU XINTAO|刘鑫涛/u);
      expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
    });
  });
});
