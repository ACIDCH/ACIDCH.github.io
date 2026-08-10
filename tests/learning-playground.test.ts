import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lab = readFileSync(
  "src/components/learning/DescriptiveStatisticsLab.astro",
  "utf8",
);
const styles = readFileSync("src/styles/global.css", "utf8");

describe("Learning-note interactions", () => {
  it("recomputes statistics and renders native distribution views", () => {
    expect(lab).toContain("const statistics =");
    expect(lab).toContain("drawHistogram(values)");
    expect(lab).toContain("drawBoxplot(values)");
    expect(lab).toContain("drawEcdf(values)");
  });

  it("loads the R runtime lazily and reports actual runtime output", () => {
    expect(lab).toContain('await import("webr")');
    expect(lab).toContain("await runtime.init()");
    expect(lab).toContain("await runtime.evalRString");
    expect(lab).not.toContain("模拟输出");
  });

  it("cleans up on client navigation and keeps a non-script fallback", () => {
    expect(lab).toContain("astro:before-swap");
    expect(lab).toContain("runtime?.close()");
    expect(lab).toContain("<noscript>");
  });

  it("keeps the editorial layout and lab responsive", () => {
    expect(styles).toContain(".learning-note-toc");
    expect(styles).toContain(".statistics-lab__controls");
    expect(styles).toContain("@media (max-width: 52rem)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
