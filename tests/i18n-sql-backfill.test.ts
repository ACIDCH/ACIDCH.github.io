import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildManifest,
  inventoryContent,
  parseContentFile,
  translatableContent,
  validateProtectedPair,
} from "../scripts/lib/i18n-sync.mjs";

const sqlSlugs = [
  "sql-relational-data",
  "sql-primary-key",
  "sql-foreign-key",
  "sql-relationships",
  "sql-select",
  "sql-where",
  "sql-projection",
  "sql-order-by",
  "sql-pagination",
];

describe("SQL 01–09 English backfill", () => {
  it("renders handbook heroes from locale-specific entry metadata", () => {
    const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");

    expect(layout).toContain("const handbookTitle = entry.data.title");
    expect(layout).not.toContain('? "SQL 与关系数据"');
  });

  it.each(sqlSlugs)("publishes %s with protected technical parity", (slug) => {
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

  it("marks the complete SQL series as synced", () => {
    const manifest = buildManifest(inventoryContent());
    const sqlEntries = manifest.entries.filter(
      (entry) =>
        entry.collection === "notes" && sqlSlugs.includes(entry.translationKey),
    );
    expect(sqlEntries).toHaveLength(9);
    expect(sqlEntries.every((entry) => entry.status === "SYNCED")).toBe(true);
  });
});
