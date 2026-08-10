import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const note = readFileSync("src/content/notes/descriptive-statistics.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
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

  it("does not place restricted course labels or public identity in the note", () => {
    expect(note).not.toMatch(/BUSINFO|Assignment|Task|Submission|课程项目/u);
    expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
    expect(note).not.toMatch(/https?:\/\//u);
  });

  it("excludes other drafts from production index and static paths", () => {
    expect(index).toContain("includeDrafts || !entry.data.draft");
    expect(zhRoute).toContain("includeDrafts || !entry.data.draft");
  });

  it("uses an editorial hero, a table of contents and an interactive lab", () => {
    expect(layout).toContain("LearningNoteHero");
    expect(layout).toContain("LearningNoteToc");
    expect(layout).toContain("DescriptiveStatisticsLab");
  });
});
