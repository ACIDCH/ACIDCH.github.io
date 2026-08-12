import { describe, expect, it } from "vitest";
import {
  buildManifest,
  inventoryContent,
  parseContentFile,
  translatableContent,
  validateProtectedPair,
} from "../scripts/lib/i18n-sync.mjs";

const decisionModelSlugs = [
  "optimisation-model-anatomy",
  "unconstrained-optimisation",
  "constrained-optimisation",
  "optimisation-sensitivity-analysis",
  "binary-milp-decisions",
  "sets-indices-model-scale",
  "pulp-model-architecture",
  "multidimensional-optimisation",
  "transportation-models",
  "multi-period-production-inventory",
];

describe("Decision Models 01–10 English backfill", () => {
  it.each(decisionModelSlugs)(
    "publishes %s with protected technical parity",
    (slug) => {
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
    },
  );

  it("marks the complete decision-model series as synced", () => {
    const manifest = buildManifest(inventoryContent());
    const entries = manifest.entries.filter(
      (entry) =>
        entry.collection === "notes" &&
        decisionModelSlugs.includes(entry.translationKey),
    );
    expect(entries).toHaveLength(10);
    expect(entries.every((entry) => entry.status === "SYNCED")).toBe(true);
  });
});
