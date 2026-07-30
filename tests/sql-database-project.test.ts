import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SQL sales profitability warehouse project", () => {
  const entry = readFileSync(
    "src/content/projects/sales-profitability-warehouse.zh.md",
    "utf8",
  );
  const page = readFileSync("src/components/SqlDatabaseProject.astro", "utf8");
  const showcase = readFileSync("src/components/SqlShowcase.astro", "utf8");
  const route = readFileSync("src/pages/zh/projects/[slug].astro", "utf8");
  const paginatedRoute = readFileSync(
    "src/pages/zh/projects/page/[page].astro",
    "utf8",
  );

  it("publishes an indexable Chinese-only project with an English fallback", () => {
    expect(entry).toContain("status: completed");
    expect(entry).toContain("T-SQL");
    expect(entry).toContain("星型模型");
    expect(entry).not.toMatch(/noindex:\s*true|draft:\s*true/);
    expect(route).toContain("sales-profitability-warehouse");
    expect(route).toContain('getLocalizedPath("/projects/", "en")');
    expect(paginatedRoute).toContain('alternatePath="/projects/"');
  });

  it("documents one fact table, five dimensions, and five relationships", () => {
    expect(page).toContain("FactSales");
    for (const table of [
      "DimCustomer",
      "DimProduct",
      "DimTerritory",
      "DimPromotion",
      "DimDate",
    ]) {
      expect(page).toContain(table);
    }
    expect(page).toContain("SalesOrderDetailID");
    expect(page.match(/class="foreign-key"/g)).toHaveLength(5);
    expect(page).toContain('class="schema-diagram"');
  });

  it("provides four keyboard-operable query cases and static result tables", () => {
    expect(page.match(/shortLabel:/g)).toHaveLength(4);
    expect(page).toContain('role="tab"');
    expect(page).toContain('role="tabpanel"');
    expect(page).toContain('event.key === "ArrowRight"');
    expect(page).toContain('event.key === "Home"');
    expect(page).toContain("82.39%");
    expect(page).toContain("62.60%");
    expect(page).toContain("-143.06%");
    expect(page).toContain("2012 Q2");
    expect(page).toContain("<noscript");
  });

  it("supports SQL highlighting, copying, and horizontal scrolling", () => {
    expect(showcase).toContain("data-copy-sql");
    expect(showcase).toContain("navigator.clipboard.writeText");
    expect(showcase).toContain('<pre tabindex="0">');
    expect(showcase).toContain("sql-keyword");
    expect(showcase).toContain('document.addEventListener("astro:page-load"');
  });

  it("does not expose internal labels, identities, paths, or connection details", () => {
    const publicSource = `${entry}\n${page}\n${showcase}`;
    expect(publicSource).not.toMatch(
      /BUSINFO702|\b(?:Assignment|Task|Submission|Lab|Solution)\b|课程项目|样板页|试点页/,
    );
    expect(publicSource).not.toMatch(
      /(?:Server|Data Source|User ID|Password|Pwd)\s*=|database\.windows\.net|[A-Z]:\\/i,
    );
    expect(publicSource).not.toMatch(/人工智能|ChatGPT|OpenAI|大语言模型|机器生成/);
    expect(publicSource).not.toMatch(/我|我们|本人|作者|笔者/);
  });
});
