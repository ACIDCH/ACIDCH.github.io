import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getGeneratedPageNumbers,
  getPaginationPath,
  paginate,
  withQuery,
} from "../src/utils/pagination";

describe("static pagination", () => {
  const fixtures = Array.from({ length: 13 }, (_, index) => `item-${index + 1}`);

  it("slices deterministic project-sized pages", () => {
    const page = paginate(fixtures, 2, 6);
    expect(page.items).toEqual([
      "item-7",
      "item-8",
      "item-9",
      "item-10",
      "item-11",
      "item-12",
    ]);
    expect(page.totalPages).toBe(3);
  });

  it("generates page 2+ only and rejects invalid pages", () => {
    expect(getGeneratedPageNumbers(fixtures.length, 6)).toEqual([2, 3]);
    expect(() => paginate(fixtures, 4, 6)).toThrow(RangeError);
    expect(() => paginate(fixtures, 0, 6)).toThrow(RangeError);
  });

  it("uses bilingual paths without a duplicate page-one route", () => {
    expect(getPaginationPath("/projects/", 1)).toBe("/projects/");
    expect(getPaginationPath("/projects/", 2)).toBe("/projects/page/2/");
    expect(getPaginationPath("/zh/notes/", 2)).toBe("/zh/notes/page/2/");
    expect(getPaginationPath("/projects/", 1)).not.toContain("/page/1/");
  });

  it("preserves tag query parameters", () => {
    expect(withQuery("/notes/page/2/", { tag: "sql" })).toBe("/notes/page/2/?tag=sql");
    expect(withQuery("/zh/notes/", { tag: undefined })).toBe("/zh/notes/");
  });
});

describe("pagination markup", () => {
  const pagination = readFileSync("src/components/Pagination.astro", "utf8");
  const notes = readFileSync("src/components/NotesExplorer.astro", "utf8");

  it("provides current-page and non-link disabled states", () => {
    expect(pagination).toContain('aria-current={page === currentPage ? "page"');
    expect(pagination).toContain('<span aria-disabled="true">{previous}</span>');
    expect(pagination).toContain('<span aria-disabled="true">{next}</span>');
  });

  it("filters notes before slicing and preserves tags on pagination links", () => {
    expect(notes).toContain("const matches = cards.filter");
    expect(notes).toContain("matches.slice(start, start + pageSize)");
    expect(notes).toContain('url.searchParams.set("tag", tag)');
    expect(notes).toContain("location.assign(target)");
  });
});
