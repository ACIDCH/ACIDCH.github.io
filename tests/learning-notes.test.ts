import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const note = readFileSync("src/content/notes/descriptive-statistics.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const hero = readFileSync("src/components/learning/LearningNoteHero.astro", "utf8");
const toc = readFileSync("src/components/learning/LearningNoteToc.astro", "utf8");
const editorialCss = readFileSync("src/styles/learning-note-editorial.css", "utf8");
const zhRoute = readFileSync("src/pages/zh/notes/[slug].astro", "utf8");
const index = readFileSync("src/pages/zh/notes/index.astro", "utf8");

describe("Learning Notes sample", () => {
  it("publishes the Chinese sample note with stable series metadata", () => {
    expect(note).toContain("locale: zh");
    expect(note).toContain("slug: descriptive-statistics");
    expect(note).toContain("status: published");
    expect(note).toContain("draft: false");
    expect(note).toContain("seriesSlug: r-statistics");
  });

  it("covers centre, spread, distribution and R entry points", () => {
    [
      "均值",
      "中位数",
      "众数",
      "IQR",
      "变异系数",
      "标准分数",
      "直方图",
      "箱线图",
      "ECDF",
      "mean()",
      "ecdf(x)",
    ].forEach((term) => expect(note).toContain(term));
  });

  it("adds comparison tables and decision-oriented reading prompts", () => {
    expect(note).toContain("同样均值，但波动和尾部明显更大");
    expect(note).toContain("更值得先看的统计量");
    expect(note).toContain("总体平均需要多少响应能力");
    expect(note).toContain("图形不是装饰");
  });

  it("does not place restricted course labels or public identity in the note", () => {
    expect(note).not.toMatch(/BUSINFO|Assignment|Task|Submission|课程项目/u);
    expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
    expect(note).not.toMatch(/https?:\/\//u);
  });

  it("excludes other drafts from production index and static paths", () => {
    expect(index).toContain("includeDrafts || !entry.data.draft");
    expect(zhRoute).toContain("includeDrafts || !entry.data.draft");
  });

  it("uses a two-column editorial layout with facts in the hero", () => {
    expect(layout).toContain("LearningNoteHero");
    expect(layout).toContain("LearningNoteToc");
    expect(layout).toContain("DescriptiveStatisticsLab");
    expect(layout).toContain("facts={learningFacts}");
    expect(layout).toContain("fullWidth={isLearningSample}");
    expect(layout).not.toContain("LearningNoteRail");
    expect(hero).toContain("learning-note-hero__facts");
    expect(hero).toContain('aria-label="本页核心读数"');
  });

  it("keeps the desktop TOC in its own grid column and removes the competing sticky rail", () => {
    expect(editorialCss).toContain("grid-template-columns: minmax(13rem, 15rem) minmax(0, 64rem)");
    expect(editorialCss).toContain("grid-column: 1");
    expect(editorialCss).toContain("grid-column: 2");
    expect(editorialCss).toContain("position: sticky");
    expect(editorialCss).toContain("max-height: calc(100dvh");
    expect(editorialCss).toContain("position: static");
    expect(editorialCss).not.toContain("learning-note-rail");
    expect(toc).toContain("IntersectionObserver");
  });

  it("uses only defined spacing tokens in the dedicated Learning Note stylesheet", () => {
    expect(editorialCss).not.toContain("var(--space-7)");
    expect(editorialCss).not.toContain("var(--space-9)");
    expect(editorialCss).not.toContain("var(--space-14)");
  });
});
