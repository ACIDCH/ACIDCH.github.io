import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  retirementModelBaseline,
  retirementModelConstants,
  runRetirementModel,
} from "../src/data/retirement-model";

describe("retirement Monte Carlo project", () => {
  it("returns identical results for identical inputs and seed", () => {
    const first = runRetirementModel(retirementModelBaseline);
    const second = runRetirementModel(retirementModelBaseline);

    expect(second).toEqual(first);
    expect(first.distribution.reduce((total, bin) => total + bin.count, 0)).toBe(
      retirementModelConstants.trials,
    );
    expect(first.yearlyMean).toHaveLength(retirementModelConstants.horizon);
  });

  it("keeps a zero starting balance at zero when contributions are zero", () => {
    const inputs = {
      ...retirementModelBaseline,
      contributionRate: 0,
      seed: 1,
    };
    const result = runRetirementModel(inputs);

    expect(result.meanNominal).toBe(0);
    expect(result.lowerNominal).toBe(0);
    expect(result.upperNominal).toBe(0);
    expect(result.successRate).toBe(0);
  });

  it("publishes the Chinese project with production copy and search terms", () => {
    const entry = readFileSync(
      "src/content/projects/retirement-monte-carlo.zh.md",
      "utf8",
    );
    const page = readFileSync(
      "src/components/RetirementMonteCarloProject.astro",
      "utf8",
    );
    const route = readFileSync("src/pages/zh/projects/[slug].astro", "utf8");
    const card = readFileSync("src/components/ProjectCard.astro", "utf8");

    expect(entry).not.toContain("noindex: true");
    expect(entry).toContain("Monte Carlo");
    expect(entry).toContain("蒙特卡洛");
    expect(entry).toContain("敏感性分析");
    expect(route).toContain('getLocalizedPath("/projects/", "en")');
    expect(page).toContain("data-retirement-lab");
    expect(page).toContain("随机种子");
    expect(page).toContain("模型结果");
    expect(page).toContain("随机模拟逻辑");
    expect(card).toContain('entry.data.translationKey !== "retirement-monte-carlo"');
    expect(page).not.toMatch(
      /Task [1-4]|Client data|课程项目|中文样板页|暂不索引|局限与下一步|来源与口径|6\.1625%|10\.5%/,
    );
    expect(page).not.toMatch(/人工智能|ChatGPT|OpenAI|大语言模型|机器生成/);
    expect(page).not.toMatch(/我|我们|本人|作者|笔者/);
  });
});
