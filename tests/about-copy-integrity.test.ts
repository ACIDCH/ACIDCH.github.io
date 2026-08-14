import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const about = readFileSync("src/components/AboutPage.astro", "utf8");

describe("About public copy integrity", () => {
  it("keeps the Chinese education labels complete", () => {
    expect(about).toContain('body: "商业分析硕士 · 供应链分析方向"');
    expect(about).toContain('body: "经济学 · 荣誉学士"');
    expect(about).not.toContain("经济学荣誉士");
    expect(about).not.toContain("经济学 · 荣誉士");
  });

  it("does not reintroduce removed background helper copy", () => {
    expect(about).not.toContain("backgroundIntro");
    expect(about).not.toContain("这里只保留和网站内容直接相关的学习背景");
  });
});
