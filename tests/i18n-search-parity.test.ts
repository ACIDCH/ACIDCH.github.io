import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const search = readFileSync("src/components/GlobalSearch.astro", "utf8");

describe("bilingual search parity", () => {
  it("builds a locale-specific index", () => {
    expect(search).toContain("item.locale === locale");
  });

  it("excludes non-public projects and notes", () => {
    expect(search).toContain('entry.data.status === "completed"');
    expect(search).toContain("!entry.data.isPlaceholder");
    expect(search).toContain("!entry.data.noindex");
    expect(search).toContain('entry.data.status === "published"');
    expect(search).toContain("!entry.data.draft");
  });
});
