import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const notesIndex = read("src/pages/zh/notes/index.astro");
const notesExplorer = read("src/components/NotesExplorer.astro");
const seriesMap = read("src/components/learning/LearningSeriesMap.astro");
const seriesPage = read("src/components/learning/LearningSeriesPage.astro");
const noteList = read("src/components/NoteList.astro");
const productionVerifier = read("scripts/verify-decision-models-production.mjs");
const sharedUi = read("src/i18n/shared-ui.ts");

it("verifies both localised optimum markers in production", () => {
  expect(productionVerifier).toContain('"最优点 600"');
  expect(productionVerifier).toContain('"optimum 600"');
});

describe("Supply chain optimisation Learning Notes folder", () => {
  it("makes the tag-first folder navigation explicit on the Chinese Learning Notes index", () => {
    expect(notesIndex).toContain("先用标签快速定位知识点，再按主题进入完整知识库");
    expect(notesIndex).toContain('<LearningSeriesMap slot="knowledge-map" />');
    expect(notesExplorer).toContain("sharedUi[locale].notesExplorer");
    expect(sharedUi).toContain('title: "按标签浏览"');
    expect(notesExplorer).toContain('<slot name="knowledge-map" />');
    expect(sharedUi).toContain('latest: "全部笔记"');
    expect(seriesMap).toContain("按主题进入知识库");
    expect(seriesMap).toContain('left.slug === "decision-models"');
    expect(seriesMap).toContain('slug === "decision-models" ? "供应链与优化"');
    expect(seriesMap).toContain("data-learning-folder={series.slug}");
    expect(seriesMap).toContain("进入知识库 →");
    expect(seriesMap).toContain("{noteCount} 篇");
  });

  it("turns the decision-model series page into a ten-note folder", () => {
    expect(seriesPage).toContain("getLocalizedLearningSeries");
    expect(seriesPage).toContain("学习笔记文件夹");
    expect(seriesPage).toContain("文件夹内容 · 学习路线");
    expect(seriesPage).toContain("文件夹内笔记");
    expect(seriesPage).toContain("已发布 · 点击进入完整笔记");
    expect(seriesPage).toContain("entry.data.order === index + 1");
    expect(seriesPage).toContain("data-note-folder={series.slug}");
  });

  it("labels every decision-model note card with the public folder name", () => {
    expect(noteList).toContain('entry.data.seriesSlug === "decision-models"');
    expect(noteList).toContain("? copy.decisionSeries");
    expect(sharedUi).toContain('decisionSeries: "供应链与优化"');
    expect(noteList).toContain("displaySeries");
    expect(noteList).toContain(
      'data-series={(displaySeries ?? "").toLocaleLowerCase()}',
    );
  });

  it("requires the compact folder entry and structural Learning Notes order in production verification", () => {
    expect(productionVerifier).toContain('path: "zh/notes/"');
    expect(productionVerifier).toContain('path: "zh/notes/series/decision-models/"');
    expect(productionVerifier).toContain("供应链与优化");
    expect(productionVerifier).toContain("10 篇");
    expect(productionVerifier).toContain("进入知识库");
    expect(productionVerifier).toContain("按标签浏览");
    expect(productionVerifier).toContain("按主题进入知识库");
    expect(productionVerifier).toContain("全部笔记");
    expect(productionVerifier).toContain("orderedMarkers");
    expect(productionVerifier).toContain("tag-cloud-panel--floating");
    expect(productionVerifier).not.toContain(`'class="tag-cloud-panel"'`);
    expect(productionVerifier).toContain('class="learning-series-map"');
    expect(productionVerifier).toContain('class="notes-results-heading"');
    expect(productionVerifier).not.toContain(
      'orderedMarkers: ["按标签浏览", "按主题进入知识库", "全部笔记"]',
    );
  });
});
