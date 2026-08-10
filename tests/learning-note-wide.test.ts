import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/learning-note-wide.css", "utf8");

describe("Learning Note wide-screen layout", () => {
  it("only applies the expanded frame above the desktop breakpoint", () => {
    expect(css).toContain("@media (min-width: 74.001rem)");
    expect(css).toContain("@media (min-width: 100rem)");
  });

  it("gives teaching content substantially more horizontal reading space", () => {
    expect(css).toContain("width: min(112rem");
    expect(css).toContain("max-width: 72rem");
    expect(css).toContain("width: min(118rem");
    expect(css).toContain("max-width: 76rem");
  });

  it("lets figures, tables, code and the interactive lab use the article width", () => {
    expect(css).toContain("article.learning-note .learning-note__body > table");
    expect(css).toContain("article.learning-note .learning-note__body > pre");
    expect(css).toContain("article.learning-note .statistics-lab");
    expect(css).toContain("max-width: none");
  });
});
