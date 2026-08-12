import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import neuralData from "../src/data/r-neural-experiment.generated.json";
import {
  behaviourComparisons,
  confusionMatrix,
  correlations,
  deepDives,
  featureDecisions,
  frictionSignals,
  holdoutClassDistribution,
  modelResults,
  pipelineSteps,
  predictors,
  projectImages,
  rawFieldGroups,
  sampleFlow,
} from "../src/data/r-machine-learning";

describe("R machine learning flagship project", () => {
  const entry = readFileSync(
    "src/content/projects/customer-churn-machine-learning.zh.md",
    "utf8",
  );
  const mainPage = readFileSync("src/components/RMachineLearningProject.astro", "utf8");
  const dataValidation = readFileSync(
    "src/components/RDataValidationDeepDive.astro",
    "utf8",
  );
  const benchmark = readFileSync(
    "src/components/RModelBenchmarkDeepDive.astro",
    "utf8",
  );
  const selection = readFileSync(
    "src/components/RModelSelectionDeepDive.astro",
    "utf8",
  );
  const interpretation = readFileSync(
    "src/components/RLogisticInterpretationDeepDive.astro",
    "utf8",
  );
  const neural = readFileSync("src/components/RNeuralNetworkDeepDive.astro", "utf8");
  const comparison = readFileSync("src/components/ModelComparisonLab.astro", "utf8");
  const evaluation = readFileSync("src/components/ModelEvaluation.astro", "utf8");
  const onThisPage = readFileSync("src/components/ChurnOnThisPage.astro", "utf8");
  const deepDiveShell = readFileSync("src/components/RDeepDiveShell.astro", "utf8");
  const deepDiveNav = readFileSync("src/components/TechnicalDeepDiveNav.astro", "utf8");
  const correlationExplorer = readFileSync(
    "src/components/ChurnCorrelationExplorer.astro",
    "utf8",
  );
  const recipeComparison = readFileSync(
    "src/components/ChurnRecipeComparison.astro",
    "utf8",
  );
  const predictorExplorer = readFileSync(
    "src/components/ChurnPredictorExplorer.astro",
    "utf8",
  );
  const rocExplorer = readFileSync("src/components/ChurnRocExplorer.astro", "utf8");
  const oddsRatioChart = readFileSync(
    "src/components/ChurnOddsRatioChart.astro",
    "utf8",
  );
  const deepening = readFileSync("src/components/ChurnDeepeningSections.astro", "utf8");
  const route = readFileSync("src/components/ProjectRenderer.astro", "utf8");
  const deepDiveRoute = readFileSync(
    "src/pages/zh/projects/customer-churn-machine-learning/[deepDive].astro",
    "utf8",
  );
  const search = readFileSync("src/components/GlobalSearch.astro", "utf8");
  const card = readFileSync("src/components/ProjectCard.astro", "utf8");
  const publicSource = [
    entry,
    mainPage,
    dataValidation,
    benchmark,
    selection,
    interpretation,
    neural,
    comparison,
    evaluation,
    deepDiveShell,
    deepDiveNav,
  ].join("\n");

  it("publishes one indexable Chinese flagship project", () => {
    expect(entry).toContain("translationKey: customer-churn-machine-learning");
    expect(entry).toContain("status: completed");
    expect(entry).not.toMatch(/draft:\s*true|noindex:\s*true/);
    expect(route).toContain("RMachineLearningProject");
    expect(card.match(/customer-churn-machine-learning/g)).toHaveLength(1);
  });

  it("defines five independent searchable deep dives", () => {
    expect(deepDives.map((item) => item.slug)).toEqual([
      "data-validation",
      "model-comparison",
      "model-selection-error-analysis",
      "logistic-interpretation",
      "neural-network",
    ]);
    expect(deepDiveRoute).toContain("getStaticPaths");
    expect(search).toContain("...deepDives.map");
    expect(search).toContain("deepDive.titleZh");
    expect(
      existsSync(
        "src/pages/zh/projects/customer-churn-machine-learning/workflow.astro",
      ),
    ).toBe(true);
    expect(
      existsSync(
        "src/pages/zh/projects/customer-churn-machine-learning/prediction-evaluation.astro",
      ),
    ).toBe(true);
  });

  it("uses the verified schema, predictors and sample flow", () => {
    expect(rawFieldGroups.flatMap((group) => group.fields)).toHaveLength(25);
    expect(predictors).toHaveLength(7);
    expect(predictors.map((item) => item.name)).toContain("payment_failure_last4w");
    expect(predictors.map((item) => item.name)).not.toContain("weeks_since_signup");
    expect(sampleFlow.map((step) => step.value)).toEqual([
      200000, 196000, 156800, 39200, 30000,
    ]);
    expect(holdoutClassDistribution.reduce((sum, item) => sum + item.value, 0)).toBe(
      39200,
    );
    expect(behaviourComparisons).toHaveLength(4);
    expect(frictionSignals).toHaveLength(3);
    expect(featureDecisions).toHaveLength(6);
    expect(correlations.find((item) => item.value === 0.88)?.decision).toContain(
      "只保留",
    );
  });

  it("keeps the five verified cross-validation means and model specifications", () => {
    expect(modelResults).toHaveLength(5);
    expect(modelResults.map((model) => model.name)).toEqual([
      "Logistic Regression",
      "Naive Bayes",
      "Random Forest",
      "LightGBM",
      "XGBoost",
    ]);
    expect(modelResults[0]?.auc).toBe(0.9024);
    expect(modelResults.find((model) => model.id === "lightgbm")?.accuracy).toBe(
      0.8199,
    );
    expect(modelResults.find((model) => model.id === "xgboost")?.sensitivity).toBe(
      0.7632,
    );
  });

  it("preserves the verified hold-out matrix and real result images", () => {
    expect(confusionMatrix.total).toBe(39200);
    expect(
      confusionMatrix.trueNegative +
        confusionMatrix.falsePositive +
        confusionMatrix.falseNegative +
        confusionMatrix.truePositive,
    ).toBe(confusionMatrix.total);
    expect(confusionMatrix.auc).toBe(0.9053);
    expect(confusionMatrix.sensitivity).toBe(0.8331);
    Object.values(projectImages).forEach((image) => {
      expect(existsSync(`public${image}`)).toBe(true);
    });
    expect(evaluation).toContain("projectImages.holdoutRoc");
    expect(interpretation).toContain("projectImages.oddsRatioCi");
  });

  it("provides keyboard-friendly pipeline, model, matrix, risk and code interactions", () => {
    expect(mainPage).toContain("<AnalysisPipeline");
    expect(mainPage).toContain("<FeatureSelectionStory");
    expect(mainPage).toContain("<ModelComparisonLab");
    expect(mainPage).toContain("<ModelEvaluation");
    expect(mainPage).toContain("<RiskSignalExplorer");
    expect(comparison).toContain("data-model-metric");
    expect(comparison).toContain("metric-matrix");
    expect(evaluation).toContain("data-matrix-cell");
    expect(pipelineSteps).toHaveLength(10);
    expect(
      pipelineSteps.every(
        (step) => step.input && step.action && step.output && step.why && step.codeKey,
      ),
    ).toBe(true);
  });

  it("adds native evidence explorers and responsive on-page navigation", () => {
    expect(mainPage).toContain("<ChurnObservationAnatomy");
    expect(mainPage).toContain("<ChurnCorrelationExplorer");
    expect(mainPage).toContain("<ChurnRecipeComparison");
    expect(mainPage).toContain("<ChurnPredictorExplorer");
    expect(mainPage).toContain("<ChurnOnThisPage");
    expect(onThisPage).toContain("IntersectionObserver");
    expect(onThisPage).toContain("astro:page-load");
    expect(correlationExplorer).toContain("data-correlation-option");
    expect(recipeComparison).toContain('role="tablist"');
    expect(predictorExplorer).toContain('role="tablist"');
    expect(predictorExplorer).toContain("payment_failure_last4w");
    expect(deepening).toContain("15.9");
    expect(deepening).toContain("0.8801996672");
    expect(mainPage).toContain("<ChurnDataStory");
    expect(mainPage).toContain("<ChurnOddsRatioChart");
    expect(rocExplorer).toContain("0.9053");
    expect(oddsRatioChart).toContain("data-native-or-item");
    expect(deepDiveNav).toContain("继续深入分析");
    expect(deepDiveShell).toContain("继续阅读技术专题");
  });

  it("reproduces the neural experiment with original seeds and fixed architecture", () => {
    expect(modelResults.some((model) => /neural/i.test(model.name))).toBe(false);
    expect(neuralData.provenance).toMatchObject({
      data_seed: 321,
      split_seed: 6262,
      fit_seed: 987,
      rows: 3000,
      train_rows: 2399,
      test_rows: 601,
      epochs: 1000,
      hidden_units: 2,
      engine: "nnet",
    });
    expect(neuralData.metrics.accuracy).toBeCloseTo(0.8801996672, 9);
    expect(neuralData.metrics.auc).toBeCloseTo(0.9562114241, 9);
    expect(
      neuralData.confusion.class1_as_class1 +
        neuralData.confusion.class2_as_class1 +
        neuralData.confusion.class1_as_class2 +
        neuralData.confusion.class2_as_class2,
    ).toBe(601);
    expect(neuralData.test_points).toHaveLength(601);
    expect(neuralData.boundary.length).toBeGreaterThan(0);
  });

  it("keeps each technical article substantive and non-overlapping", () => {
    const sectionCount = (source: string) => source.match(/<section\b/g)?.length ?? 0;
    expect(sectionCount(dataValidation)).toBeGreaterThanOrEqual(10);
    expect(sectionCount(benchmark)).toBeGreaterThanOrEqual(9);
    expect(sectionCount(selection)).toBeGreaterThanOrEqual(8);
    expect(sectionCount(interpretation)).toBeGreaterThanOrEqual(9);
    expect(sectionCount(neural)).toBeGreaterThanOrEqual(8);
    expect(dataValidation).toContain("30,000 条样本只用于候选模型比较");
    expect(benchmark).toContain("五模型比较的目的不是寻找最复杂算法");
    expect(selection).toContain("阈值分析需要哪些预测证据");
    expect(interpretation).toContain("解释模型为什么去掉上采样");
    expect(neural).toContain("不是 churn benchmark 的第六个模型");
  });

  it("excludes prohibited public terms, identity, paths and false runtime claims", () => {
    expect(publicSource).not.toMatch(
      /BUSINFO\s*704|\b704\b|Assignment|Task [1-4]|Submission|课程项目|课程报告|样板页|试点页|暂不索引|V1\.0|正式版|固定结果|保存的固定结果|不会触发训练|浏览器本地计算|源文件|内部核实|匿名访问|课程文件|正式版 V3|稍后补充/,
    );
    expect(publicSource).not.toMatch(
      /在线训练 R|实时机器学习|实时模型训练|浏览器运行 R|[A-Z]:\\/,
    );
    expect(publicSource).not.toMatch(
      /(?<![A-Za-z])AI(?![A-Za-z])|Artificial Intelligence|AI-assisted|AI-powered|AI-built|AI generated|ChatGPT|OpenAI|LLM|人工智能|生成式人工智能|大语言模型|大模型|机器生成|自动生成内容/,
    );
    expect(publicSource).not.toMatch(/我|我们|本人|作者|笔者/);
    expect(publicSource).not.toMatch(/稍后补充|功能开发中|待添加|未来加入/);
  });
});
