import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const note = readFileSync("src/content/notes/r-data-analysis-prediction.zh.md", "utf8");
const layout = readFileSync("src/layouts/DataScienceNoteLayout.astro", "utf8");
const lab = readFileSync("src/components/learning/PredictionThresholdLab.astro", "utf8");
const noteRoute = readFileSync("src/pages/zh/notes/[slug].astro", "utf8");
const productivity = readFileSync("src/components/ProductivityPage.astro", "utf8");
const productivityZh = readFileSync("src/pages/zh/productivity/index.astro", "utf8");
const productivityEn = readFileSync("src/pages/productivity/index.astro", "utf8");
const navigation = readFileSync("src/config/navigation.ts", "utf8");
const header = readFileSync("src/components/Header.astro", "utf8");
const taxonomy = readFileSync("src/data/note-tag-taxonomy.ts", "utf8");

describe("R data science handbook and productivity section", () => {
  it("publishes the requested R data analysis and prediction handbook", () => {
    expect(note).toContain("title: 使用 R 进行数据分析和预测算法");
    expect(note).toContain("seriesSlug: data-science-r");
    expect(note).toContain("status: published");
    expect(note).toContain("draft: false");
    expect(note).toContain("第一部分：R 是分析语言，不只是计算器");
    expect(note).toContain("第二部分：可视化先回答“数据长什么样”");
    expect(note).toContain("第三部分：数据整理决定后面的模型是否可信");
    expect(note).toContain("第四部分：统计分析把样本规律和不确定性放在一起");
    expect(note).toContain("第五部分：预测算法的目标是对新数据有效");
  });

  it("keeps statistical inference coverage technically substantial", () => {
    [
      "标准误",
      "中心极限定理",
      "置信区间",
      "假设检验",
      "Bootstrap",
      "条件期望",
      "多元线性模型",
      "逻辑回归",
      "关联不能自动升级成因果",
      "PCA",
      "Ridge",
      "Lasso",
    ].forEach((marker) => expect(note).toContain(marker));
    expect(note).toContain("SE(\\bar X)=\\frac{s}{\\sqrt n}");
    expect(note).toContain("R^2=1-\\frac{SSE}{SST}");
    expect(note).toContain("\\log\\left(\\frac{p(x)}{1-p(x)}\\right)");
  });

  it("makes binary event coding explicit in base R and caret examples", () => {
    expect(note).toContain('churn_flag = if_else(churned == "Churn", 1, 0)');
    expect(note).toContain("predict(logit_fit, type = \"response\")");
    expect(note).toContain('factor(churned, levels = c("Churn", "Stay"))');
    expect(note).toContain("第一个 level 会被当作 failure");
    expect(note).toContain("twoClassSummary");
  });

  it("covers model assessment and supervised and unsupervised learning", () => {
    [
      "Sensitivity",
      "Specificity",
      "Precision",
      "F_1",
      "交叉验证",
      "data leakage",
      "k-nearest neighbors",
      "Naive Bayes",
      "LDA",
      "QDA",
      "CART",
      "随机森林",
      "caret::train()",
      "ROC",
      "Precision-recall",
      "Ensemble",
      "k-means",
    ].forEach((marker) => expect(note).toContain(marker));
  });

  it("provides a real threshold interaction instead of a decorative placeholder", () => {
    expect(note).toContain('data-learning-slot="prediction-threshold-lab"');
    expect(layout).toContain("PredictionThresholdLab");
    expect(layout).toContain('data-learning-block="prediction-threshold-lab"');
    expect(layout).toContain('block.dataset.learningPlaced = "true"');
    expect(lab).toContain("data-threshold-slider");
    expect(lab).toContain("data-threshold-tp");
    expect(lab).toContain("data-threshold-fp");
    expect(lab).toContain("data-threshold-fn");
    expect(lab).toContain("data-threshold-tn");
    expect(lab).toContain("data-threshold-sensitivity");
    expect(lab).toContain("data-threshold-specificity");
    expect(lab).toContain("data-threshold-precision");
    expect(lab).toContain("data-threshold-f1");
    expect(noteRoute).toContain('entry.data.seriesSlug === "data-science-r"');
    expect(noteRoute).toContain("DataScienceNoteLayout");
  });

  it("adds Productivity as a bilingual primary navigation destination", () => {
    expect(navigation).toContain('{ path: "/productivity/", label: { en: "Productivity", zh: "生产力工具" } }');
    expect(header).toContain('"/productivity/": "tool"');
    expect(productivityZh).toContain('<ProductivityPage locale="zh" />');
    expect(productivityEn).toContain('<ProductivityPage locale="en" />');
  });

  it("adapts the productivity-tool learning arc into practical site content", () => {
    [
      "Unix",
      "Git & GitHub",
      "RStudio",
      "R Markdown",
      "knitr",
      "Quarto",
      "git status",
      "git diff",
      "git commit",
      ".gitignore",
      "可重复报告",
      "CC BY-NC-SA 4.0",
    ].forEach((marker) => expect(productivity).toContain(marker));
  });

  it("classifies the new handbook under statistical inference and machine learning", () => {
    expect(taxonomy).toContain('seriesSlug === "data-science-r"');
    expect(taxonomy).toContain('pushUnique(tags, "statistical-inference")');
    expect(taxonomy).toContain('pushUnique(tags, "machine-learning")');
  });

  it("keeps source attribution without copying the reference into the public identity", () => {
    expect(note).toContain("rafalab.dfci.harvard.edu/dsbook/");
    expect(note).toContain("CC BY-NC-SA 4.0");
    expect(productivity).toContain("rafalab.dfci.harvard.edu/dsbook/");
    expect(productivity).toContain("CC BY-NC-SA 4.0");
    expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
  });
});
