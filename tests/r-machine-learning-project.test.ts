import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  confusionMatrix,
  deepDives,
  modelResults,
  predictors,
} from "../src/data/r-machine-learning";

describe("R machine learning flagship project", () => {
  const entry = readFileSync(
    "src/content/projects/customer-churn-machine-learning.zh.md",
    "utf8",
  );
  const mainPage = readFileSync("src/components/RMachineLearningProject.astro", "utf8");
  const deepDivePage = readFileSync(
    "src/components/RMachineLearningDeepDive.astro",
    "utf8",
  );
  const route = readFileSync("src/pages/zh/projects/[slug].astro", "utf8");
  const deepDiveRoute = readFileSync(
    "src/pages/zh/projects/customer-churn-machine-learning/[deepDive].astro",
    "utf8",
  );
  const search = readFileSync("src/components/GlobalSearch.astro", "utf8");
  const card = readFileSync("src/components/ProjectCard.astro", "utf8");

  it("publishes one indexable Chinese flagship project", () => {
    expect(entry).toContain("translationKey: customer-churn-machine-learning");
    expect(entry).toContain("status: completed");
    expect(entry).not.toMatch(/draft:\s*true|noindex:\s*true/);
    expect(route).toContain("RMachineLearningProject");
    expect(card.match(/customer-churn-machine-learning/g)).toHaveLength(1);
  });

  it("defines four searchable deep dives without extra project entries", () => {
    expect(deepDives.map((item) => item.slug)).toEqual([
      "workflow",
      "model-comparison",
      "neural-network",
      "prediction-evaluation",
    ]);
    expect(deepDiveRoute).toContain("getStaticPaths");
    expect(search).toContain("...deepDives.map");
    expect(search).toContain("projectBasePath");
  });

  it("uses the seven verified predictors", () => {
    expect(predictors).toHaveLength(7);
    expect(predictors.map((item) => item.name)).toContain("payment_failure_last4w");
    expect(predictors.map((item) => item.name)).not.toContain("weeks_since_signup");
  });

  it("keeps the five fixed cross-validation model results", () => {
    expect(modelResults).toHaveLength(5);
    expect(modelResults.map((model) => model.name)).toEqual([
      "Logistic Regression",
      "Naive Bayes",
      "Random Forest",
      "LightGBM",
      "XGBoost",
    ]);
    expect(modelResults[0].auc).toBe(0.9024);
    expect(modelResults.find((model) => model.id === "lightgbm")?.accuracy).toBe(
      0.8199,
    );
  });

  it("preserves the verified hold-out matrix and metrics", () => {
    expect(confusionMatrix.total).toBe(39200);
    expect(
      confusionMatrix.trueNegative +
        confusionMatrix.falsePositive +
        confusionMatrix.falseNegative +
        confusionMatrix.truePositive,
    ).toBe(confusionMatrix.total);
    expect(confusionMatrix.auc).toBe(0.9053);
    expect(confusionMatrix.sensitivity).toBe(0.8332);
  });

  it("provides keyboard-friendly pipeline, fixed comparison and R code", () => {
    expect(mainPage).toContain("<AnalysisPipeline");
    expect(mainPage).toContain("<ModelComparisonLab");
    expect(mainPage).toContain("<ModelEvaluation");
    expect(mainPage).toContain("<RCodeShowcase");
    expect(deepDivePage).toContain("<NeuralNetworkDiagram");
  });

  it("separates the neural network experiment from churn model metrics", () => {
    expect(modelResults.some((model) => /neural/i.test(model.name))).toBe(false);
    const neural = deepDives.find((item) => item.slug === "neural-network");
    expect(neural?.summary).toContain("独立二维分类实验");
    expect(deepDivePage).toContain("结构证据与客户流失模型分开");
    expect(deepDivePage).toContain("隐藏节点");
    expect(deepDivePage).toContain("1000");
  });

  it("excludes internal labels, identity, paths and false runtime claims", () => {
    const publicSource = `${entry}\n${mainPage}\n${deepDivePage}`;
    expect(publicSource).not.toMatch(
      /BUSINFO704|Assignment|Task [1-4]|Submission|课程项目|课程报告|样板页|试点|暂不索引|V1\.0|正式版/,
    );
    expect(publicSource).not.toMatch(
      /在线训练 R|实时机器学习|实时模型训练|浏览器运行 R|[A-Z]:\\/,
    );
    expect(publicSource).not.toMatch(
      /ChatGPT|OpenAI|LLM|人工智能|生成式人工智能|大语言模型|大模型/,
    );
    expect(publicSource).not.toMatch(/我|我们|本人|作者|笔者/);
    expect(publicSource).not.toMatch(/稍后补充|功能开发中|待添加|未来加入/);
  });
});
