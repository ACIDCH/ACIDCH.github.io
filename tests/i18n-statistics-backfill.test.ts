import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildManifest,
  inventoryContent,
  parseContentFile,
  translatableContent,
  validateProtectedPair,
} from "../scripts/lib/i18n-sync.mjs";

const statisticsSlugs = [
  "descriptive-statistics",
  "stat-data-types-scales",
  "stat-sampling-estimation",
  "stat-interval-estimation",
  "stat-hypothesis-testing",
  "stat-categorical-data-analysis",
];

describe("Statistics 01–06 English backfill", () => {
  it.each(statisticsSlugs)("publishes %s with protected technical parity", (slug) => {
    const source = parseContentFile(`src/content/notes/${slug}.zh.md`);
    const target = parseContentFile(`src/content/notes/${slug}.en.md`);
    expect(target.frontmatter).toMatchObject({
      translationKey: source.frontmatter.translationKey,
      locale: "en",
      slug: source.frontmatter.slug,
      seriesSlug: source.frontmatter.seriesSlug,
      order: source.frontmatter.order,
      status: "published",
      draft: false,
      isPlaceholder: false,
      publishedAt: source.frontmatter.publishedAt,
      updatedAt: source.frontmatter.updatedAt,
      tools: source.frontmatter.tools,
      relatedProjects: source.frontmatter.relatedProjects,
      relatedNotes: source.frontmatter.relatedNotes,
    });
    expect(validateProtectedPair(source, target)).toEqual([]);
    expect(translatableContent(target.body)).not.toMatch(/[\u3400-\u9fff]/u);
    expect(target.frontmatter.title).not.toMatch(/[\u3400-\u9fff]/u);
    expect(target.frontmatter.summary).not.toMatch(/[\u3400-\u9fff]/u);
  });

  it("marks the complete statistics series as synced", () => {
    const manifest = buildManifest(inventoryContent());
    const entries = manifest.entries.filter(
      (entry) =>
        entry.collection === "notes" && statisticsSlugs.includes(entry.translationKey),
    );
    expect(entries).toHaveLength(6);
    expect(entries.every((entry) => entry.status === "SYNCED")).toBe(true);
  });

  it("uses generated English headings while preserving the curated Chinese TOC", () => {
    const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
    expect(layout).toContain('heading.slug !== "before-you-begin"');
    expect(layout).toContain(
      'isStatisticsHandbook && entry.data.locale === "zh" ? statisticsToc : generatedToc',
    );
    expect(layout).toContain('document.getElementById("before-you-begin")');
  });

  it("treats Type I error as statistical terminology, not first-person copy", () => {
    const validator = readFileSync("scripts/validate-ci.mjs", "utf8");
    expect(validator).toContain('"Type I error"');
    expect(validator).toContain('"Type I and Type II errors"');
  });
});
