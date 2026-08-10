import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const note = readFileSync("src/content/notes/descriptive-statistics.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const hero = readFileSync("src/components/learning/LearningNoteHero.astro", "utf8");
const toc = readFileSync("src/components/learning/LearningNoteToc.astro", "utf8");
const noteList = readFileSync("src/components/NoteList.astro", "utf8");
const editorialCss = readFileSync("src/styles/learning-note-editorial.css", "utf8");
const normalLab = readFileSync("src/components/learning/NormalDistributionLab.astro", "utf8");
const correlationLab = readFileSync("src/components/learning/CorrelationLab.astro", "utf8");
const regressionLab = readFileSync("src/components/learning/RegressionLab.astro", "utf8");
const zhRoute = readFileSync("src/pages/zh/notes/[slug].astro", "utf8");
const index = readFileSync("src/pages/zh/notes/index.astro", "utf8");

describe("R and Statistics Learning Note handbook", () => {
  it("publishes the Chinese handbook with stable series metadata", () => {
    expect(note).toContain("locale: zh");
    expect(note).toContain("slug: descriptive-statistics");
    expect(note).toContain("status: published");
    expect(note).toContain("draft: false");
    expect(note).toContain("seriesSlug: r-statistics");
  });

  it("covers the full R and statistics handbook sequence", () => {
    [
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

  it("shows only a compact handbook title in the article header", () => {
    expect(layout).toContain('const handbookTitle = isSqlHandbook ? "SQL 与关系数据" : "统计学与 R"');
    expect(layout).toContain("<LearningNoteHero title={handbookTitle} />");
    expect(hero).toContain("learning-note-titlebar");
    expect(hero).not.toContain("LEARNING NOTE");
    expect(hero).not.toContain("learning-note-hero__footer");
    expect(hero).not.toContain("summary");
    expect(hero).not.toContain("tags");
    expect(hero).not.toContain("tools");
  });

  it("uses the same title-only handbook card on home and Learning Notes lists", () => {
    expect(noteList).toContain('"descriptive-statistics": "统计学与 R"');
    expect(noteList).toContain('"sql-relational-data": "SQL 与关系数据"');
    expect(noteList).toContain("isCompactHandbook");
    expect(noteList).toContain('isCompactHandbook && "note-card--handbook"');
    expect(noteList).toContain("{isCompactHandbook ? (");
  });

  it("removes the preface from the visible handbook and its TOC", () => {
    expect(layout).toContain("removeHandbookPreface");
    expect(layout).toContain('document.getElementById("写在前面")');
    expect(layout).not.toContain('{ id: "写在前面", label: "写在前面" }');
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
  });

  it("keeps the descriptive statistics lab inside the descriptive section", () => {
    const slotIndex = note.indexOf('data-learning-slot="statistics-lab"');
    expect(slotIndex).toBeGreaterThan(note.indexOf("### 形象化展示"));
    expect(slotIndex).toBeLessThan(note.indexOf("## 概率相关内容"));
    expect(layout).toContain('data-learning-block="statistics-lab"');
    expect(layout).toContain("placeLearningBlocks");
  });

  it("adds several native interactive visuals through the handbook", () => {
    expect(layout).toContain("NormalDistributionLab");
    expect(layout).toContain("CorrelationLab");
    expect(layout).toContain("RegressionLab");
    expect(layout).toContain('data-learning-after-heading="连续概率分布"');
    expect(layout).toContain('data-learning-after-heading="相关性可视化展示"');
    expect(layout).toContain('data-learning-after-heading="回归分析"');
    expect(normalLab).toContain("data-normal-threshold");
    expect(normalLab).toContain("P(X ≤ x)");
    expect(correlationLab).toContain("data-correlation-target");
    expect(correlationLab).toContain("Pearson r");
    expect(regressionLab).toContain("data-regression-noise");
    expect(regressionLab).toContain("data-regression-r2");
  });

  it("keeps formulas, figures and the live R playground readable rather than cramped", () => {
    expect(editorialCss).toContain("article.learning-note .note-formula");
    expect(editorialCss).toContain("article.learning-note .r-playground");
    expect(editorialCss).toContain("article.learning-note .statistics-lab__visuals");
    expect(editorialCss).toContain("grid-template-columns: 1fr");
    expect(editorialCss).toContain('[data-learning-block]:not([data-learning-placed="true"])');
  });

  it("does not reintroduce the old ad-hoc spacing tokens", () => {
    expect(editorialCss).not.toContain("var(--space-9)");
    expect(editorialCss).not.toContain("var(--space-14)");
  });
});
