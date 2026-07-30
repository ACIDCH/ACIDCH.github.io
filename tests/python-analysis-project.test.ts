import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Python Grammy and Spotify analysis project", () => {
  const entry = readFileSync(
    "src/content/projects/grammy-spotify-analysis.zh.md",
    "utf8",
  );
  const page = readFileSync("src/components/PythonAnalysisProject.astro", "utf8");
  const code = readFileSync("src/components/CodeShowcase.astro", "utf8");
  const route = readFileSync("src/pages/zh/projects/[slug].astro", "utf8");

  it("publishes an indexable Chinese-only project and preserves the English fallback", () => {
    expect(entry).toContain("status: completed");
    expect(entry).toContain("Python");
    expect(entry).toContain("模糊匹配");
    expect(entry).not.toMatch(/noindex:\s*true|draft:\s*true/);
    expect(route).toContain("grammy-spotify-analysis");
    expect(route).toContain('getLocalizedPath("/projects/", "en")');
  });

  it("uses six verified code excerpts with copy and keyboard access", () => {
    expect(page.match(/title: "0[1-6] ·/g)).toHaveLength(6);
    expect(page).toContain("normalise_text");
    expect(page).toContain("mannwhitneyu");
    expect(code).toContain("data-copy-code");
    expect(code).toContain("navigator.clipboard.writeText");
    expect(code).toContain('<pre tabindex="0">');
    expect(code).toContain('document.addEventListener("astro:page-load"');
  });

  it("shows five real outputs and a reproducible threshold control", () => {
    expect(page.match(/\.webp"/g)).toHaveLength(5);
    expect(page).toContain("data-threshold-lab");
    expect(page).toContain('min="85"');
    expect(page).toContain('max="100"');
    expect(page).toContain('value="88"');
    expect(page).toContain("[95.24, 93.94, 93.55, 92.31, 91.23, 90.2, 89.74]");
    expect(page).toContain("<noscript");
    expect(page).toContain("64 + count");
  });

  it("documents verified scale and statistical results", () => {
    expect(page).toContain("1,687");
    expect(page).toContain("64 个精确匹配和 7 个");
    expect(page).toContain("65.25");
    expect(page).toContain("63.65");
    expect(page).toContain("p &lt; 0.001");
    expect(page).toContain("|r| = 0.272");
  });

  it("does not expose source files, internal labels, identities, or restricted wording", () => {
    expect(page).not.toMatch(
      /BUSINFO701|701new|Assignment|Submission|Task|课程项目|作业|样板页|试点页|预览版|草稿/,
    );
    expect(page).not.toMatch(/\.ipynb|\.pdf|\.csv|\.json|[A-Z]:\\/i);
    expect(page).not.toMatch(/人工智能|ChatGPT|OpenAI|大语言模型|机器生成/);
    expect(page).not.toMatch(/我|我们|本人|作者|笔者/);
  });
});
