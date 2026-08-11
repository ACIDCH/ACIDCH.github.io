import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");
const notesIndex = read("src/pages/zh/notes/index.astro");
const notesExplorer = read("src/components/NotesExplorer.astro");
const seriesMap = read("src/components/learning/LearningSeriesMap.astro");
const projectList = read("src/components/ProjectList.astro");
const home = read("src/components/HomePage.astro");
const taxonomy = read("src/data/note-tag-taxonomy.ts");

describe("Learning Notes and project-grid information architecture", () => {
  it("keeps the tag map first, knowledge folders second, and all notes last", () => {
    expect(notesIndex).toContain('<LearningSeriesMap slot="knowledge-map" />');
    expect(notesExplorer).toContain("tag-cloud-panel--floating");
    expect(notesExplorer).toContain('<slot name="knowledge-map" />');
    expect(notesExplorer).toContain('class="notes-results-heading"');

    const tags = notesExplorer.indexOf("tag-cloud-panel--floating");
    const folders = notesExplorer.indexOf('<slot name="knowledge-map" />');
    const results = notesExplorer.indexOf('class="notes-results-heading"');
    expect(tags).toBeGreaterThan(-1);
    expect(tags).toBeLessThan(folders);
    expect(folders).toBeLessThan(results);
    expect(notesExplorer).toContain('latest: "全部笔记"');
  });

  it("uses a compact canonical tag taxonomy instead of every raw frontmatter tag", () => {
    expect(taxonomy).toContain("canonicalNoteTags");
    expect(taxonomy).toContain('id: "regression"');
    expect(taxonomy).toContain('id: "optimisation"');
    expect(taxonomy).toContain('id: "supply-chain"');
    expect(taxonomy).toContain("return tags.slice(0, 2)");
    expect(notesExplorer).toContain("getCanonicalNoteTags(entry)");
    expect(notesExplorer).not.toContain(".flatMap((entry) => entry.data.tags)");
  });

  it("preserves selected-tag emphasis while adding hover and focus scope previews", () => {
    expect(notesExplorer).toContain("--tag-weight:");
    expect(notesExplorer).toContain("--tag-tilt:");
    expect(notesExplorer).toContain("tag-cloud__tooltip");
    expect(notesExplorer).toContain(":hover .tag-cloud__tooltip");
    expect(notesExplorer).toContain(":focus-visible .tag-cloud__tooltip");
    expect(notesExplorer).toContain("[aria-pressed=\"true\"]");
    expect(notesExplorer).toContain('data-note-tag={tag.label.toLocaleLowerCase()}');
    expect(notesExplorer).toContain('button.setAttribute("aria-pressed"');
  });

  it("renders compact knowledge folders in two balanced desktop rows", () => {
    expect(seriesMap).toContain("LearningSeriesIcon");
    expect(seriesMap).toContain("grid-template-columns: repeat(6, minmax(0, 1fr))");
    expect(seriesMap).toContain("grid-column: span 2");
    expect(seriesMap).toContain("nth-last-child(2):nth-child(3n + 1)");
    expect(seriesMap).toContain("last-child:nth-child(3n + 2)");
    expect(seriesMap).toContain("进入知识库 →");
    expect(seriesMap).toContain("个模块");
    expect(seriesMap).not.toContain("series.modules.slice");
    expect(seriesMap).not.toContain("<ul>");
  });

  it("uses one shared balanced two-column project grid everywhere ProjectList is reused", () => {
    expect(projectList).toContain("project-list--balanced");
    expect(projectList).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(projectList).toContain("last-child:nth-child(odd)");
    expect(projectList).toContain("justify-self: center");
    expect(projectList).toContain("grid-template-columns: 1fr");
    expect(projectList).not.toContain("project-list__featured");
  });

  it("uses an even featured-project target on the homepage", () => {
    expect(home).toContain(".slice(0, 4)");
    expect(home).not.toContain(".slice(0, 3);\nconst notes");
  });
});
