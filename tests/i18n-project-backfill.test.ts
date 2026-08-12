import { describe, expect, it } from "vitest";
import {
  buildManifest,
  inventoryContent,
  parseContentFile,
  translatableContent,
  validateProtectedPair,
} from "../scripts/lib/i18n-sync.mjs";

const slugs = [
  "customer-churn-machine-learning",
  "european-property-market-dashboard",
  "grammy-spotify-analysis",
  "retirement-monte-carlo",
  "sales-profitability-warehouse",
];

describe("completed-project English backfill", () => {
  it.each(slugs)("publishes %s with protected technical parity", (slug) => {
    const source = parseContentFile(`src/content/projects/${slug}.zh.md`);
    const target = parseContentFile(`src/content/projects/${slug}.en.md`);

    expect(target.frontmatter).toMatchObject({
      translationKey: source.frontmatter.translationKey,
      locale: "en",
      slug: source.frontmatter.slug,
      status: "completed",
      featured: source.frontmatter.featured,
      topic: source.frontmatter.topic,
    });
    expect(validateProtectedPair(source, target)).toEqual([]);
    expect(translatableContent(target.body)).not.toMatch(/[\u3400-\u9fff]/u);
    expect(target.frontmatter.title).not.toMatch(/[\u3400-\u9fff]/u);
    expect(target.frontmatter.summary).not.toMatch(/[\u3400-\u9fff]/u);
  });

  it("marks all completed projects as synced", () => {
    const manifest = buildManifest(inventoryContent());
    const statuses = slugs.map(
      (slug) =>
        manifest.entries.find(
          (entry) => entry.collection === "projects" && entry.translationKey === slug,
        )?.status,
    );
    expect(statuses).toEqual(slugs.map(() => "SYNCED"));
  });
});
