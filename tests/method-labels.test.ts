import { describe, expect, it } from "vitest";
import { localizeMethodLabel } from "../src/i18n/method-labels";

describe("method display labels", () => {
  it.each([
    ["Machine Learning", "机器学习"],
    ["Supervised Learning", "监督学习"],
    ["Classification", "分类模型"],
    ["Monte Carlo", "蒙特卡洛模拟"],
  ])("localizes %s without changing English", (source, translated) => {
    expect(localizeMethodLabel(source, "zh")).toBe(translated);
    expect(localizeMethodLabel(source, "en")).toBe(source);
  });
  it.each([
    "R",
    "tidymodels",
    "Excel",
    "Power BI",
    "OpenStreetMap",
    "OSRM",
    "敏感性分析",
    "toString",
  ])("preserves tool names and unknown values: %s", (source) => {
    expect(localizeMethodLabel(source, "zh")).toBe(source);
  });
});
