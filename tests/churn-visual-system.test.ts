import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Customer Churn native visual system", () => {
  it("loads the dedicated visual polish layer globally", async () => {
    const layout = await source("src/layouts/BaseLayout.astro");
    const css = await source("src/styles/churn-polish.css");

    expect(layout).toContain('import "../styles/churn-polish.css"');
    expect(css).toContain(".predictor-explorer");
    expect(css).toContain(".model-lab");
    expect(css).toContain(".risk-explorer");
    expect(css).toContain(".figure-reading");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps the flagship customer-churn raster assets native-only", async () => {
    const guard = await source("src/components/ChurnEvidenceFigure.astro");
    const main = await source("src/components/RMachineLearningProject.astro");

    expect(main).not.toContain("<img");
    expect(guard).toContain("nativeOnlySources");
    expect(guard).toContain("shouldRenderRaster");
    expect(guard).toContain("predictor-comparisons.webp");
    expect(guard).toContain("categorical-churn-rates.webp");
    expect(guard).toContain("service-interactions.webp");
    expect(guard).toContain("odds-ratio-ci.webp");
  });

  it("uses one directional odds-ratio visual language across interpretation views", async () => {
    const chart = await source("src/components/ChurnOddsRatioChart.astro");
    const explorer = await source("src/components/RiskSignalExplorer.astro");

    expect(chart).toContain("Math.log(item.value)");
    expect(chart).toContain("OR = 1");
    expect(chart).not.toContain("<img");
    expect(explorer).toContain("Math.log(item.value)");
    expect(explorer).toContain("data-risk-position");
    expect(explorer).not.toContain("<img");
  });

  it("drives correlation values from the verified project data and supports keyboard navigation", async () => {
    const correlation = await source("src/components/ChurnCorrelationExplorer.astro");

    expect(correlation).toContain(
      'import { correlations } from "../data/r-machine-learning"',
    );
    expect(correlation).toContain('"ArrowDown"');
    expect(correlation).toContain('"ArrowUp"');
    expect(correlation).toContain('"Home"');
    expect(correlation).toContain('"End"');
  });
});
