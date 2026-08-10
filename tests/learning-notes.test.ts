import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const note = readFileSync("src/content/notes/descriptive-statistics.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const hero = readFileSync("src/components/learning/LearningNoteHero.astro", "utf8");
const toc = readFileSync("src/components/learning/LearningNoteToc.astro", "utf8");
const editorialCss = readFileSync("src/styles/learning-note-editorial.css", "utf8");
const zhRoute = readFileSync("src/pages/zh/notes/[slug].astro", "utf8");
const index = readFileSync("src/pages/zh/notes/index.astro", "utf8");

describe("R and Statistics Learning Note handbook", () => {
  it("publishes the Chinese handbook with stable series metadata", () => {
    expect(note).toContain("locale: zh");
    expect(note).toContain("slug: descriptive-statistics");
    expect(note).toContain("统计学与 R：从描述统计到多元分析的完整学习手册");
    expect(note).toContain("status: published");
    expect(note).toContain("draft: false");
    expect(note).toContain("seriesSlug: r-statistics");
  });

  it("covers the full R and statistics handbook sequence", () => {
    [
      "## 写在前面",
      "## 描述性统计量",
      "## 概率相关内容",
      "## 估计",
      "## 相关性分析",
      "## 单双样本均值分析",
      "## 多样本均值分析",
      "## 比例分析",
      "## 常用高阶分析方法",
      "### 回归分析",
      "### 聚类分析",
      "#### k-means",
      "#### Hierarchical Clustering",
      "### 主成分分析",
    ].forEach((term) => expect(note).toContain(term));
  });

  it("keeps executable R examples and Business Analytics interpretation", () => {
    [
      "mean(x)",
      "sd(x)",
      "dbinom",
      "dpois",
      "shapiro.test",
      "cor.test",
      "t.test",
      "wilcox.test",
      "aov(",
      "prop.test",
      "chisq.test",
      "lm(",
      "glm(",
      "kmeans(",
      "hclust(",
      "prcomp(",
    ].forEach((term) => expect(note).toContain(term));
    expect(note).toContain("服务响应");
    expect(note).toContain("客户");
    expect(note).toContain("订单");
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

  it("uses a simple handbook header instead of a dashboard hero card", () => {
    expect(layout).toContain("LearningNoteHero");
    expect(layout).toContain("LearningNoteToc");
    expect(layout).toContain("DescriptiveStatisticsLab");
    expect(layout).toContain("fullWidth={isHandbook}");
    expect(layout).not.toContain("LearningNoteRail");
    expect(hero).toContain("learning-note-hero__footer");
    expect(hero).not.toContain("learning-note-hero__facts");
    expect(editorialCss).toContain("max-width: 28ch");
    expect(editorialCss).toContain("border-bottom: 1px solid var(--colour-border-strong)");
  });

  it("supports a nested handbook table of contents", () => {
    expect(toc).toContain("children?: Item[]");
    expect(toc).toContain("learning-note-toc__nested");
    expect(toc).toContain("IntersectionObserver");
    expect(layout).toContain('label: "描述性统计量"');
    expect(layout).toContain('label: "概率相关内容"');
    expect(layout).toContain('label: "单双样本均值分析"');
    expect(layout).toContain('label: "常用高阶分析方法"');
  });

  it("uses one authoritative spacious teaching stylesheet", () => {
    expect(layout).toContain('import "../styles/learning-note-editorial.css"');
    expect(layout).not.toContain("learning-note-wide.css");
    expect(existsSync("src/styles/learning-note-wide.css")).toBe(false);
    expect(editorialCss).toContain("width: min(94rem");
    expect(editorialCss).toContain("grid-template-columns: minmax(14rem, 16rem) minmax(0, 1fr)");
    expect(editorialCss).toContain("max-width: 72rem");
    expect(editorialCss).toContain("max-width: 58rem");
    expect(editorialCss).toContain("grid-template-columns: 1fr");
  });

  it("places the interactive statistics lab inside descriptive statistics", () => {
    const slotIndex = note.indexOf('data-learning-slot="statistics-lab"');
    expect(slotIndex).toBeGreaterThan(note.indexOf("### 形象化展示"));
    expect(slotIndex).toBeLessThan(note.indexOf("## 概率相关内容"));
    expect(layout).toContain('data-learning-block="statistics-lab"');
    expect(layout).toContain("placeLearningBlocks");
  });

  it("keeps formulas, figures and the live R playground readable rather than cramped", () => {
    expect(editorialCss).toContain("article.learning-note .note-formula");
    expect(editorialCss).toContain("article.learning-note .r-playground");
    expect(editorialCss).toContain("article.learning-note .statistics-lab__visuals");
    expect(editorialCss).toContain("grid-template-columns: 1fr");
    expect(editorialCss).toContain('[data-learning-block]:not([data-learning-placed="true"])');
  });

  it("uses only defined spacing tokens in the Learning Note stylesheet", () => {
    expect(editorialCss).not.toContain("var(--space-7)");
    expect(editorialCss).not.toContain("var(--space-9)");
    expect(editorialCss).not.toContain("var(--space-14)");
  });
});
