import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  ["STAT 02", "src/content/notes/stat-data-types-scales.zh.md", "数据类型与尺度", 2],
  ["STAT 03", "src/content/notes/stat-sampling-estimation.zh.md", "抽样与估计", 3],
  ["STAT 04", "src/content/notes/stat-interval-estimation.zh.md", "区间估计", 4],
  ["STAT 05", "src/content/notes/stat-hypothesis-testing.zh.md", "假设检验", 5],
  [
    "STAT 06",
    "src/content/notes/stat-categorical-data-analysis.zh.md",
    "分类数据分析",
    6,
  ],
] as const;

const notes = new Map(files.map(([code, path]) => [code, readFileSync(path, "utf8")]));
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const lab = readFileSync("src/components/learning/SamplingPrecisionLab.astro", "utf8");
const learningUi = readFileSync("src/i18n/learning-ui.ts", "utf8");
const series = readFileSync("src/data/learning-series.ts", "utf8");
const seriesPage = readFileSync(
  "src/components/learning/LearningSeriesPage.astro",
  "utf8",
);

const publicForbidden =
  /BUSINFO|Assignment|Lab\b|Lecture|Week\s*\d|Quiz|Solution|Submission|399162766|Xintao Liu|LIU XINTAO|刘鑫涛/u;
const firstPerson = /我|我们|本人|笔者/u;

describe("completed R statistics learning series", () => {
  it("publishes STAT 02–06 as real notes in the expected order", () => {
    files.forEach(([code, , title, order]) => {
      const note = notes.get(code)!;
      expect(note).toContain(`title: ${title}`);
      expect(note).toContain("seriesSlug: r-statistics");
      expect(note).toContain(`order: ${order}`);
      expect(note).toContain("status: published");
      expect(note).toContain("draft: false");
      expect(note).toContain("isPlaceholder: false");
      expect(note.length).toBeGreaterThan(5000);
      expect((note.match(/^## /gm) ?? []).length).toBeGreaterThanOrEqual(8);
    });
  });

  it("keeps the six-module statistics roadmap aligned with the published sequence", () => {
    [
      ["STAT 01", "描述性统计"],
      ["STAT 02", "数据类型与尺度"],
      ["STAT 03", "抽样与估计"],
      ["STAT 04", "区间估计"],
      ["STAT 05", "假设检验"],
      ["STAT 06", "分类数据分析"],
    ].forEach(([code, title]) => {
      expect(series).toContain(`code: "${code}"`);
      expect(series).toContain(`title: "${title}"`);
    });
    expect(seriesPage).toContain("entry.data.seriesSlug === series.slug");
    expect(seriesPage).toContain("entry.data.order === index + 1");
  });

  it("teaches data types and measurement scales with R semantics", () => {
    const note = notes.get("STAT 02")!;
    [
      "categorical",
      "numeric",
      "Nominal",
      "Ordinal",
      "Interval",
      "Ratio",
      "factor",
      "ordered",
      "continuous",
      "discrete",
      "identifier",
      "POSIXct",
      "data dictionary",
    ].forEach((marker) => expect(note).toContain(marker));
  });

  it("connects sampling, standard error and the central limit theorem", () => {
    const note = notes.get("STAT 03")!;
    [
      "Population",
      "Sample",
      "Parameter",
      "Sampling distribution",
      "standard error",
      "Central Limit Theorem",
      "Monte Carlo",
      "stratified sampling",
      "cluster sampling",
      'data-learning-slot="sampling-precision-lab"',
    ].forEach((marker) => expect(note).toContain(marker));
    expect(note).toContain("SE(\\bar X)=\\frac{s}{\\sqrt n}");
  });

  it("covers confidence intervals beyond a single normal approximation", () => {
    const note = notes.get("STAT 04")!;
    [
      "margin of error",
      "95% confidence interval",
      "Student's t distribution",
      "prop.test",
      "binom.test",
      "Bootstrap",
      "Prediction interval",
      'data-learning-slot="sampling-precision-lab"',
    ].forEach((marker) => expect(note).toContain(marker));
  });

  it("treats hypothesis testing as evidence rather than a 0.05 switch", () => {
    const note = notes.get("STAT 05")!;
    [
      "null hypothesis",
      "alternative hypothesis",
      "p-value",
      "第一类错误",
      "第二类错误",
      "Power",
      "Effect size",
      "Welch t-test",
      "paired = TRUE",
      "多重检验",
      "p.adjust",
    ].forEach((marker) => expect(note).toContain(marker));
  });

  it("connects categorical summaries, chi-square and odds ratios to logistic regression", () => {
    const note = notes.get("STAT 06")!;
    [
      "contingency table",
      "prop.table",
      "Chi-square",
      "chisq.test",
      "Fisher's exact test",
      "Risk difference",
      "Risk ratio",
      "Odds",
      "odds ratio",
      "Simpson's paradox",
      "logistic regression",
      "glm(",
    ].forEach((marker) => expect(note).toContain(marker));
    expect(note).toContain("OR=\\frac{a/c}{b/d}=\\frac{ad}{bc}");
  });

  it("uses the long-form editorial layout for every r-statistics note", () => {
    expect(layout).toContain(
      'const isStatisticsEditorial = entry.data.seriesSlug === "r-statistics"',
    );
    expect(layout).toContain(
      "const isHandbook = isStatisticsEditorial || isSqlEditorial",
    );
    expect(layout).toContain("const generatedToc = headings");
    expect(layout).toContain("isStatisticsHandbook ? statisticsToc : generatedToc");
    expect(layout).toContain("SamplingPrecisionLab");
    expect(layout).toContain('data-learning-block="sampling-precision-lab"');
  });

  it("provides a purposeful, resettable and keyboard-native sampling interaction", () => {
    [
      "data-sampling-precision-lab",
      "data-sampling-n",
      "data-sampling-confidence",
      "data-sampling-reset",
      'aria-live="polite"',
      "Standard error",
      "Margin of error",
      "1/√n",
      "AbortController",
      "astro:before-swap",
    ].forEach((marker) => expect(`${lab}\n${learningUi}`).toContain(marker));
  });

  it("keeps public statistics notes original, attributed and free of private course identity", () => {
    files.forEach(([code]) => {
      const note = notes.get(code)!;
      expect(note).toContain("rafalab.dfci.harvard.edu");
      expect(note).toContain("CC BY-NC-SA 4.0");
      expect(note).not.toMatch(publicForbidden);
      expect(note).not.toMatch(firstPerson);
    });
  });
});
