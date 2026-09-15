import { describe, expect, it } from "vitest";
import {
  parseContentFile,
  validateProtectedPair,
} from "../scripts/lib/i18n-sync.mjs";

describe("Geely EX5 ANZ bilingual project parity", () => {
  it("keeps protected URLs, numeric results and structure aligned", () => {
    const zh = parseContentFile(
      "src/content/projects/geely-ex5-anz-product-definition.zh.md",
    );
    const en = parseContentFile(
      "src/content/projects/geely-ex5-anz-product-definition.en.md",
    );
    const issues = validateProtectedPair(zh, en);
    if (issues.length) console.error(JSON.stringify(issues, null, 2));
    expect(issues).toEqual([]);
  });
});
