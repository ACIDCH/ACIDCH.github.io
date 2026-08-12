import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getLocaleSectionFallback } from "../src/utils/paths";

const source = (path: string) => readFileSync(path, "utf8");

describe("bilingual route parity", () => {
  it("preserves the default-English and /zh/ URL policy", () => {
    expect(getLocaleSectionFallback("/zh/notes/example/", "en")).toBe("/notes/");
    expect(getLocaleSectionFallback("/projects/example/", "zh")).toBe("/zh/projects/");
  });

  it("uses the same Note renderer in both dynamic routes", () => {
    for (const route of [
      "src/pages/notes/[slug].astro",
      "src/pages/zh/notes/[slug].astro",
    ]) {
      expect(source(route)).toContain("NoteRenderer");
      expect(source(route)).toContain("isPublicTranslation");
    }
  });

  it("uses the same Project renderer in both dynamic routes", () => {
    for (const route of [
      "src/pages/projects/[slug].astro",
      "src/pages/zh/projects/[slug].astro",
    ]) {
      expect(source(route)).toContain("ProjectRenderer");
      expect(source(route)).toContain("isPublicTranslation");
    }
  });
});
