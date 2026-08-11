import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const expectedTitles: Record<string, string> = {
  "descriptive-statistics.zh.md": "统计学与 R",
  "r-data-analysis-prediction.zh.md": "使用 R 进行数据分析和预测算法",
  "sql-relational-data.zh.md": "SQL 与关系数据",
  "sql-primary-key.zh.md": "主键",
  "sql-foreign-key.zh.md": "外键",
  "sql-relationships.zh.md": "表关系",
  "sql-select.zh.md": "SELECT 查询",
  "sql-where.zh.md": "WHERE 筛选",
  "sql-projection.zh.md": "列选择与表达式",
  "sql-order-by.zh.md": "ORDER BY 排序",
  "sql-pagination.zh.md": "分页查询",
  "optimisation-model-anatomy.zh.md": "优化建模基础",
  "unconstrained-optimisation.zh.md": "无约束优化",
  "constrained-optimisation.zh.md": "受约束优化",
  "optimisation-sensitivity-analysis.zh.md": "敏感性分析",
  "binary-milp-decisions.zh.md": "二进制决策与 MILP",
  "sets-indices-model-scale.zh.md": "集合与索引",
  "pulp-model-architecture.zh.md": "PuLP 建模",
  "multidimensional-optimisation.zh.md": "多维优化模型",
  "transportation-models.zh.md": "供应链运输规划",
  "multi-period-production-inventory.zh.md": "多期生产与库存优化",
  "regression-foundations.zh.md": "简单线性回归",
  "regression-diagnostics.zh.md": "回归诊断",
  "nonlinear-regression-interactions.zh.md": "非线性回归",
  "multiple-regression-multicollinearity.zh.md": "多元线性回归",
  "influential-observations.zh.md": "异常点与影响点",
  "regression-feature-selection.zh.md": "特征选择与正则化",
  "logistic-regression.zh.md": "逻辑回归",
};

function readNote(file: string) {
  return readFileSync(`src/content/notes/${file}`, "utf8");
}

function frontmatterValue(source: string, key: string) {
  const match = source.match(new RegExp(`^${key}:\\s*(.+)$`, "mu"));
  return match?.[1]?.trim() ?? "";
}

describe("Learning Notes editorial voice", () => {
  it("keeps all 28 published Chinese handbook titles readable", () => {
    expect(Object.keys(expectedTitles)).toHaveLength(28);

    for (const [file, expectedTitle] of Object.entries(expectedTitles)) {
      const source = readNote(file);
      const title = frontmatterValue(source, "title");
      expect(title, file).toBe(expectedTitle);
      if (file !== "r-data-analysis-prediction.zh.md") {
        expect(Array.from(title).length, `${file} title should stay compact`).toBeLessThanOrEqual(14);
      }
      expect(title, `${file} should not append an explanatory title tail`).not.toContain("：");
      expect(title, file).not.toMatch(
        /应该怎样|完整学习手册|连接今天与未来|战术承运量|条件效应|稳定身份/u,
      );
    }
  });

  it("keeps summaries conversational instead of catalogue-style boilerplate", () => {
    for (const file of Object.keys(expectedTitles)) {
      const source = readNote(file);
      const summary = frontmatterValue(source, "summary");
      expect(summary.length, `${file} should have a useful summary`).toBeGreaterThan(20);
      expect(summary, file).not.toMatch(
        /系统(?:地)?理解|学习如何|重点区分|建立.{0,12}流程|完整基础|统一数据集中的|从.{0,24}出发，理解|记录身份证|稳定身份/u,
      );
    }
  });

  it("blocks stale generated-sounding title fragments and meta phrasing", () => {
    const staleFragments = [
      "把业务问题拆成目标、参数、决策与约束",
      "从函数形状、边际变化到可执行决策",
      "从可行域、角点到绑定约束",
      "资源松弛、影子价格与决策稳健性",
      "把“开不开、选不选”写进优化模型",
      "让优化模型从几个变量扩展到真实业务规模",
      "从数学模型到可审计代码",
      "从二维矩阵扩展到产品、工厂、技能与时期",
      "从战略网络到战术承运量",
      "用流量平衡连接今天与未来",
      "条件效应、共线性与系数稳定性",
      "多项式、类别变量和条件效应",
      "残差、正态性、异方差与模型失配",
      "从描述统计到多元分析的完整学习手册",
      "表关系：一对多、多对多与一对一",
      "非线性回归与交互项",
      "供应链规划与运输分配",
      "记录身份证",
      "一套更自然的建模顺序",
      "一套实用的供应链规划顺序",
    ];

    for (const file of Object.keys(expectedTitles)) {
      const source = readNote(file);
      expect(source, file).not.toMatch(/我|我们|本人|作者|笔者/u);
      staleFragments.forEach((fragment) => expect(source, `${file}: ${fragment}`).not.toContain(fragment));
    }
  });

  it("keeps the public series map aligned with the article titles", () => {
    const series = readFileSync("src/data/learning-series.ts", "utf8");
    expect(series).toContain('title: "表关系"');
    expect(series).toContain('title: "非线性回归"');
    expect(series).toContain('title: "供应链运输规划"');
    expect(series).not.toContain("表关系：一对多、多对多与一对一");
    expect(series).not.toContain("非线性回归与交互项");
    expect(series).not.toContain("供应链规划与运输分配");
  });
});
