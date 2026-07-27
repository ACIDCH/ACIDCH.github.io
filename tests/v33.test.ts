import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  findSearchResults,
  splitHighlight,
  type SearchItem,
} from "../src/utils/search";

const searchItems: SearchItem[] = [
  {
    title: "Inventory Optimisation",
    description: "A supply planning demonstration.",
    path: "/projects/inventory-optimisation/",
    locale: "en",
    group: "project",
    searchText: "Inventory Optimisation supply planning Python",
  },
  {
    title: "运输模型基础",
    description: "供应链优化学习笔记。",
    path: "/zh/notes/transportation-models/",
    locale: "zh",
    group: "note",
    searchText: "运输模型基础 供应链优化 学习笔记",
  },
];

describe("V3.3 global substring search", () => {
  it("matches English and Chinese substrings", () => {
    expect(findSearchResults(searchItems, "optim").map((item) => item.path)).toEqual([
      "/projects/inventory-optimisation/",
    ]);
    expect(findSearchResults(searchItems, "供应链").map((item) => item.path)).toEqual([
      "/zh/notes/transportation-models/",
    ]);
  });

  it("creates safe highlight segments without HTML injection", () => {
    expect(splitHighlight("Supply planning", "plan")).toEqual([
      { text: "Supply ", match: false },
      { text: "plan", match: true },
      { text: "ning", match: false },
    ]);
  });
});

describe("V3.3 public controls and content structure", () => {
  const header = readFileSync("src/components/Header.astro", "utf8");
  const search = readFileSync("src/components/GlobalSearch.astro", "utf8");
  const notes = readFileSync("src/components/NotesExplorer.astro", "utf8");
  const projectsPage = readFileSync("src/pages/projects/index.astro", "utf8");
  const about = readFileSync("src/components/AboutPage.astro", "utf8");

  it("uses icon-only global search, language and theme controls", () => {
    expect(header).toContain("data-search-open");
    expect(header).toContain("<LanguageSwitch");
    expect(header).toContain("<ThemeSwitch");
    expect(header).not.toContain("siteConfig.publicName");
  });

  it("keeps search and mobile navigation reliable across client navigation", () => {
    expect(search).toContain('"ArrowDown"');
    expect(search).toContain('"Enter"');
    expect(search).toContain('"Escape"');
    expect(search).toContain('"astro:page-load"');
    expect(header).toContain("unlockPage");
    expect(header).toContain('"astro:before-swap"');
  });

  it("uses URL-addressable tag cloud state and no project filter toolbar", () => {
    expect(notes).toContain("data-note-tag");
    expect(notes).toContain('url.searchParams.set("tag", tag)');
    expect(projectsPage).not.toContain("ProjectExplorer");
    expect(projectsPage).not.toContain("filter-bar");
  });

  it("uses the processed graduation portrait", () => {
    expect(about).toContain("Full-body graduation portrait");
  });
});
