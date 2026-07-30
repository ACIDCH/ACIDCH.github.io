import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Power BI property market project", () => {
  const entry = readFileSync(
    "src/content/projects/european-property-market-dashboard.zh.md",
    "utf8",
  );
  const page = readFileSync("src/components/PowerBIDashboardProject.astro", "utf8");
  const route = readFileSync("src/pages/zh/projects/[slug].astro", "utf8");

  it("publishes an indexable Chinese-only project and preserves the English fallback", () => {
    expect(entry).toContain("status: completed");
    expect(entry).toContain("Power BI");
    expect(entry).toContain("DAX");
    expect(entry).not.toMatch(/noindex:\s*true|draft:\s*true/);
    expect(route).toContain("european-property-market-dashboard");
    expect(route).toContain('getLocalizedPath("/projects/", "en")');
  });

  it("contains a keyboard-operable four-page dashboard", () => {
    expect(page.match(/role="tab"/g)).toHaveLength(4);
    expect(page.match(/role="tabpanel"/g)).toHaveLength(4);
    expect(page).toContain('event.key === "ArrowRight"');
    expect(page).toContain('event.key === "Home"');
    expect(page).toContain('document.addEventListener("astro:page-load"');
    expect(page).toContain("<noscript");
  });

  it("documents the verified model, relationships, metrics, and findings", () => {
    expect(page).toContain("Dim_Country");
    expect(page).toContain("Fact_HousePrices");
    expect(page).toContain("Fact_Wages");
    expect(page).toContain("Fact_HICP");
    expect(page).toContain("多对一、单向筛选关系");
    expect(page).toContain("House Price Growth vs 2015 %");
    expect(page).toContain("Total Development Score");
    expect(page).toContain("124.4%");
    expect(page).toContain("11.86%");
  });

  it("does not expose source files, internal labels, identities, or unsafe embeds", () => {
    expect(page).not.toMatch(
      /BUSINFO703|703AA|Group23|Submission|Assignment|课程项目|小组项目|组员|Task/,
    );
    expect(page).not.toMatch(/\.pbix|\.csv|\.pdf|[A-Z]:\\/i);
    expect(page).not.toMatch(/<iframe|app\.powerbi\.com|ctid=/i);
    expect(page).not.toMatch(/人工智能|ChatGPT|OpenAI|大语言模型|机器生成/);
    expect(page).not.toMatch(/我|我们|本人|作者|笔者/);
  });
});
