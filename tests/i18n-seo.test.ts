import { describe, expect, it } from "vitest";
import { resolveLocalePaths } from "../src/utils/paths";

describe("bilingual SEO counterpart resolution", () => {
  it("uses an exact counterpart for reciprocal hreflang", () => {
    expect(
      resolveLocalePaths({
        locale: "zh",
        currentPath: "/zh/notes/topic/",
        canonicalPath: "/zh/notes/topic/",
        alternatePath: "/notes/topic/",
      }),
    ).toMatchObject({
      englishPath: "/notes/topic/",
      chinesePath: "/zh/notes/topic/",
      languageSwitchPath: "/notes/topic/",
    });
  });

  it("suppresses hreflang while retaining a section fallback", () => {
    expect(
      resolveLocalePaths({
        locale: "zh",
        currentPath: "/zh/notes/topic/",
        canonicalPath: "/zh/notes/topic/",
        alternatePath: null,
      }),
    ).toMatchObject({
      englishPath: null,
      chinesePath: "/zh/notes/topic/",
      languageSwitchPath: "/notes/",
    });
  });

  it("keeps canonical paths stable", () => {
    const resolved = resolveLocalePaths({
      locale: "en",
      currentPath: "/about/",
      canonicalPath: "/about/",
    });
    expect(resolved.englishPath).toBe("/about/");
    expect(resolved.chinesePath).toBe("/zh/about/");
  });
});
