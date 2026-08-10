import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/learning-note-editorial.css", "utf8");

describe("Learning Note handbook layout", () => {
  it("uses a single spacious long-form frame", () => {
    expect(css).toContain("width: min(94rem");
    expect(css).toContain("grid-template-columns: minmax(14rem, 16rem) minmax(0, 1fr)");
    expect(css).toContain("max-width: 72rem");
  });

  it("keeps prose readable while allowing teaching material to breathe", () => {
    expect(css).toContain("max-width: 58rem");
    expect(css).toContain("line-height: 1.95");
    expect(css).toContain("width: min(100%, 64rem)");
  });

  it("stacks interactive figures instead of crowding them into dashboard columns", () => {
    expect(css).toContain("article.learning-note .statistics-lab__visuals");
    expect(css).toContain("grid-template-columns: 1fr");
    expect(css).toContain("article.learning-note .r-playground");
  });
});
