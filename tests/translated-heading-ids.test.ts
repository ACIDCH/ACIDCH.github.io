import { describe, expect, it } from "vitest";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import {
  preserveTranslatedHeadingIds,
  translatedHeadingIds,
} from "../src/content-support/heading-ids.mjs";
import { parseContentFile } from "../scripts/lib/i18n-sync.mjs";

const processor = await createSatteriMarkdownProcessor({
  syntaxHighlight: false,
  hastPlugins: [preserveTranslatedHeadingIds],
});

describe("translated headings preserve published fragments", () => {
  it.each(Object.entries(translatedHeadingIds))(
    "keeps the real HTML and TOC in agreement for %s",
    async (key, headings) => {
      const file = parseContentFile(`src/content/notes/${key}.zh.md`);
      const result = await processor.render(file.body, {
        frontmatter: file.frontmatter,
      });
      for (const [text, slug] of Object.entries(headings)) {
        expect(result.metadata.headings).toContainEqual(
          expect.objectContaining({ slug, text }),
        );
        expect(result.code).toContain(`id="${slug}"`);
      }
      const slugs = result.metadata.headings.map((heading) => heading.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    },
  );

  it.each([
    { locale: "en", translationKey: "logistic-regression" },
    { locale: "zh", translationKey: "another-note" },
    {},
  ])("does not change unrelated content: %j", async (frontmatter) => {
    const result = await processor.render("## 从概率到优势", { frontmatter });
    expect(result.metadata.headings[0].slug).toBe("从概率到优势");
  });

  it("preserves an explicit author-supplied ID", async () => {
    const result = await processor.render('<h2 id="custom">从概率到优势</h2>', {
      frontmatter: { locale: "zh", translationKey: "logistic-regression" },
    });
    expect(result.code).toContain('id="custom"');
    expect(result.code).not.toContain('id="从-probability-到-odds"');
  });
});
