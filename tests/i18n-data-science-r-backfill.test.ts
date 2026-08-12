import { describe, expect, it } from "vitest";
import {
  buildManifest,
  inventoryContent,
  parseContentFile,
  translatableContent,
  validateProtectedPair,
} from "../scripts/lib/i18n-sync.mjs";

const slug = "r-data-analysis-prediction";

describe("Data Science with R English backfill", () => {
  it("publishes the handbook with protected technical parity", () => {
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

  it("marks the handbook as synced", () => {
    const manifest = buildManifest(inventoryContent());
    const entry = manifest.entries.find(
      (candidate) =>
        candidate.collection === "notes" && candidate.translationKey === slug,
    );
    expect(entry?.status).toBe("SYNCED");
  });
});
