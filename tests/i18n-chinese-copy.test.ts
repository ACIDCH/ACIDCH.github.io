import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sharedUi } from "../src/i18n/shared-ui";
import { parseContentFile, validateProtectedPair } from "../scripts/lib/i18n-sync.mjs";

const read = (path: string) => readFileSync(path, "utf8");

describe("Chinese copy review: first batch", () => {
  it.each([
    ["projects", "customer-churn-machine-learning"],
    ["projects", "european-property-market-dashboard"],
    ["projects", "grammy-spotify-analysis"],
    ["projects", "retirement-monte-carlo"],
    ["projects", "geospatial-supply-chain-optimisation"],
    ["notes", "logistic-regression"],
    ["notes", "constrained-optimisation"],
  ])("preserves bilingual technical evidence in %s/%s", (collection, slug) => {
    const root = `src/content/${collection}/${slug}`;
    expect(
      validateProtectedPair(
        parseContentFile(`${root}.zh.md`),
        parseContentFile(`${root}.en.md`),
      ),
    ).toEqual([]);
  });

  it("translates the GIS explanatory copy without renaming providers", () => {
    const page = parseContentFile(
      "src/content/projects/geospatial-supply-chain-optimisation.zh.md",
    );
    expect(page.body).toContain("平均需求、需求标准差、补货提前期");
    expect(page.body).toContain("路网、货物流、覆盖、利用率、成本、库存和风险");
    expect(page.body).not.toMatch(/mean demand|expected unmet demand|road hierarchy/);
    expect(page.body).toContain("OpenStreetMap");
    expect(page.body).toContain("Clarke–Wright");
  });

  it("uses Chinese summaries and explains evaluation metrics", () => {
    const churn = parseContentFile(
      "src/content/projects/customer-churn-machine-learning.zh.md",
    );
    const logistic = parseContentFile("src/content/notes/logistic-regression.zh.md");
    const constrained = parseContentFile(
      "src/content/notes/constrained-optimisation.zh.md",
    );
    expect(churn.frontmatter.summary).not.toContain("Logistic Regression");
    expect(churn.body).toContain("准确率为 0.8142");
    expect(churn.body).toContain("95% 置信区间");
    expect(logistic.frontmatter.summary).toContain("优势比");
    expect(constrained.frontmatter.summary).toContain("紧约束和松弛量");
  });

  it("checks specialised project renderers, not only their Markdown", () => {
    const powerBi = read("src/components/PowerBIDashboardProject.astro");
    expect(powerBi).not.toMatch(
      /<(?:span|strong)>(?:Summary|Market Growth|Buyer Affordability|Final Priority)</,
    );
    expect(powerBi).toContain("<span>买方可负担性</span>");
    // DAX identifiers must remain executable and identical to the evidence.
    expect(powerBi).toContain("[Market Growth Score]");
    const retirement = read("src/components/RetirementMonteCarloProject.astro");
    expect(retirement).not.toContain("million");
    expect(retirement).toContain("5.13 百万新西兰元");
    expect(sharedUi.zh.social.email).toBe("电子邮件");
  });

  it("localises the Chinese churn page headings and metric explanations", () => {
    const churn = read("src/components/RMachineLearningProject.astro");
    expect(churn).toContain("R · 监督学习 · 客户流失");
    expect(churn).toContain("灵敏度（流失召回率）");
    expect(churn).toContain("优势比（OR）");
    expect(churn).toContain("<span>准确率 0.8199</span>");
    expect(churn).toContain("<span>特异度 0.8370</span>");
    expect(churn).not.toMatch(/<p>[A-Z][A-Z -]+<\/p>/);
    expect(churn).toContain("code={codeSnippets.selection}");
    expect(churn).toContain('id="evaluation"');
  });

  it("validates fresh content against the saved review baseline", () => {
    const audit = read("scripts/i18n-final-audit.mjs");
    expect(audit).toContain("buildManifest(contentInventory, savedManifest)");
    expect(audit).toContain("not a semantic translation review");
  });
});
