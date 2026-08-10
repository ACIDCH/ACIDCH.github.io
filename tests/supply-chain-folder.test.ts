import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const notesIndex = read("src/pages/zh/notes/index.astro");
const seriesMap = read("src/components/learning/LearningSeriesMap.astro");
const seriesPage = read("src/pages/zh/notes/series/[series].astro");
const noteList = read("src/components/NoteList.astro");
const productionVerifier = read("scripts/verify-decision-models-production.mjs");

describe("Supply chain optimisation Learning Notes folder", () => {
  it("makes folder navigation explicit on the Chinese Learning Notes index", () => {
    expect(notesIndex).toContain("先按主题文件夹进入完整知识体系");
    expect(seriesMap).toContain("学习笔记文件夹");
    expect(seriesMap).toContain("按主题进入知识库");
    expect(seriesMap).toContain('left.slug === "decision-models"');
    expect(seriesMap).toContain('slug === "decision-models" ? "供应链与优化"');
    expect(seriesMap).toContain('data-learning-folder={series.slug}');
    expect(seriesMap).toContain("打开文件夹 →");
    expect(seriesMap).toContain("篇已发布");
  });

  it("turns the decision-model series page into a ten-note folder", () => {
    expect(seriesPage).toContain('const isSupplyChain = series.slug === "decision-models"');
    expect(seriesPage).toContain('const displayTitle = isSupplyChain ? "供应链与优化"');
    expect(seriesPage).toContain("学习笔记文件夹");
    expect(seriesPage).toContain("文件夹内容 · 学习路线");
    expect(seriesPage).toContain("文件夹内笔记");
    expect(seriesPage).toContain("已发布 · 点击进入完整笔记");
    expect(seriesPage).toContain("entry.data.order === index + 1");
    expect(seriesPage).toContain('data-note-folder={series.slug}');
  });

  it("labels every decision-model note card with the public folder name", () => {
    expect(noteList).toContain('entry.data.seriesSlug === "decision-models"');
    expect(noteList).toContain('? "供应链与优化"');
    expect(noteList).toContain("displaySeries");
    expect(noteList).toContain('data-series={(displaySeries ?? "").toLocaleLowerCase()}');
  });

  it("requires the folder entry and folder page in production verification", () => {
    expect(productionVerifier).toContain('path: "zh/notes/"');
    expect(productionVerifier).toContain('path: "zh/notes/series/decision-models/"');
    expect(productionVerifier).toContain("供应链与优化");
    expect(productionVerifier).toContain("10 篇已发布");
    expect(productionVerifier).toContain("打开文件夹");
  });
});
