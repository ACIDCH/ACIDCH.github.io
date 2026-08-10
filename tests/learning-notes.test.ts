import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const note = readFileSync("src/content/notes/descriptive-statistics.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const hero = readFileSync("src/components/learning/LearningNoteHero.astro", "utf8");
const rail = readFileSync("src/components/learning/LearningNoteRail.astro", "utf8");
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
    expect(note).toContain("业务问题 | 更值得先看的统计量");
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

  it("uses an editorial hero, table of contents, quick-reference rail and interactive lab", () => {
    expect(layout).toContain("LearningNoteHero");
    expect(layout).toContain("LearningNoteToc");
    expect(layout).toContain("LearningNoteRail");
    expect(layout).toContain("DescriptiveStatisticsLab");
    expect(layout).toContain("fullWidth={isLearningSample}");
    expect(hero).toContain("learning-note-hero__main");
    expect(hero).toContain("learning-note-hero__aside");
    expect(rail).toContain("核心读数");
    expect(rail).toContain("阅读路径");
  });

  it("uses a fluid three-column desktop frame instead of a narrow centered article", () => {
    expect(editorialCss).toContain("width: min(92rem");
    expect(editorialCss).toContain("minmax(0, 52rem)");
    expect(editorialCss).toContain("learning-note-rail");
    expect(editorialCss).toContain("grid-template-columns: minmax(12rem, 13.5rem)");
    expect(editorialCss).not.toContain("var(--space-7)");
    expect(editorialCss).not.toContain("var(--space-9)");
    expect(editorialCss).not.toContain("var(--space-14)");
  });
});
