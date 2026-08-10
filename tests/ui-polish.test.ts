import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("portfolio visual polish contracts", () => {
  it("keeps the Chinese About navigation label explicit", async () => {
    const navigation = await source("src/config/navigation.ts");
    expect(navigation).toContain('zh: "关于我"');
    expect(navigation).not.toContain('zh: "简介"');
  });

  it("shows a technology identity on every project cover", async () => {
    const card = await source("src/components/ProjectCard.astro");
    expect(card).toContain('"retirement-monte-carlo": "Excel"');
    expect(card).toMatch(/<ProjectCover[^>]*\bshowCode\b/);
    expect(card).not.toContain(
      'showCode={entry.data.translationKey !== "retirement-monte-carlo"}',
    );
  });

  it("mounts the accessible back-to-top progress control globally", async () => {
    const layout = await source("src/layouts/BaseLayout.astro");
    const control = await source("src/components/BackToTop.astro");

    expect(layout).toContain("<BackToTop locale={locale} />");
    expect(control).toContain("data-back-to-top");
    expect(control).toContain("prefers-reduced-motion: reduce");
    expect(control).toContain("--scroll-progress");
  });

  it("uses portfolio-facing deep-dive copy and technical visual markers", async () => {
    const deepDiveNav = await source("src/components/TechnicalDeepDiveNav.astro");
    const deepDiveShell = await source("src/components/RDeepDiveShell.astro");

    expect(deepDiveNav).toContain("继续深入分析");
    expect(deepDiveNav).toContain(
      "五个专题分别拆解数据验证、模型比较、错误结构、解释路径与关联实验。",
    );
    expect(deepDiveNav).toContain("ChurnMicroIcon");
    expect(deepDiveShell).toContain("继续阅读技术专题");
    expect(`${deepDiveNav}\n${deepDiveShell}`).not.toMatch(/\b704\b|BUSINFO\s*704/);
  });
});
