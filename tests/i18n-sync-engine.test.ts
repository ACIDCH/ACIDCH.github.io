import { describe, expect, it } from "vitest";
import {
  buildManifest,
  classifyChange,
  contentHashes,
  protectedTokens,
  structuralSignature,
  translatableContent,
  validateProtectedPair,
} from "../scripts/lib/i18n-sync.mjs";

const file = (
  locale: "en" | "zh",
  body: string,
  overrides: Record<string, unknown> = {},
) => ({
  collection: "notes",
  path: `src/content/notes/example.${locale}.md`,
  source: body,
  rawFrontmatter: "",
  body,
  frontmatter: {
    translationKey: "example",
    locale,
    slug: "example",
    title: locale === "zh" ? "示例" : "Example",
    summary: locale === "zh" ? "摘要" : "Summary",
    seriesSlug: "sql",
    order: 1,
    status: "published",
    draft: false,
    isPlaceholder: false,
    tags: [],
    topics: [],
    tools: [],
    relatedProjects: [],
    relatedNotes: [],
    ...overrides,
  },
});

const sourceBody = `## 查询 1

使用 \`customer_id\` 并保留结果 42。

\`\`\`sql
SELECT customer_id FROM customers;
\`\`\`

公式 $x = 2$，参见 [文档](https://example.com/sql)。

<SqlPlayground data-learning-slot="query" />
`;

const targetBody = `## Query 1

Keep \`customer_id\` and the result 42. This paragraph can be longer.

\`\`\`sql
SELECT customer_id FROM customers;
\`\`\`

The formula is $x = 2$; see the [documentation](https://example.com/sql).

<SqlPlayground data-learning-slot="query" />
`;

describe("bilingual sync engine", () => {
  it("extracts protected technical tokens by Markdown block", () => {
    const tokens = protectedTokens(sourceBody);
    expect(tokens.code).toHaveLength(1);
    expect(tokens.inlineCode).toEqual(["`customer_id`"]);
    expect(tokens.math).toEqual(["$x = 2$"]);
    expect(tokens.urls).toContain("https://example.com/sql");
    expect(tokens.slots).toEqual(["query"]);
    expect(tokens.components).toEqual(["SqlPlayground"]);
    expect(tokens.numbers).toEqual(expect.arrayContaining(["1", "42"]));
  });

  it("allows natural prose length differences while preserving technical structure", () => {
    expect(structuralSignature(sourceBody)).toEqual(structuralSignature(targetBody));
    expect(
      validateProtectedPair(file("zh", sourceBody), file("en", targetBody)),
    ).toEqual([]);
  });

  it("detects untranslated Han prose while exempting protected code", () => {
    expect(
      translatableContent("English prose.\n\n```text\n中文保护内容\n```"),
    ).not.toMatch(/[\u3400-\u9fff]/u);
    const leaked = buildManifest([
      file("zh", sourceBody),
      file("en", targetBody.replace("Keep", "保留")),
    ]);
    expect(leaked.entries[0].status).toBe("LANGUAGE_LEAK");
  });

  it("fails changed code, math, URLs, numeric results and learning slots", () => {
    const mutated = targetBody
      .replace("customer_id FROM", "account_id FROM")
      .replace("42", "43")
      .replace("$x = 2$", "$x = 3$")
      .replace("example.com/sql", "example.com/other")
      .replace('data-learning-slot="query"', 'data-learning-slot="result"');
    const issues = validateProtectedPair(file("zh", sourceBody), file("en", mutated));
    expect(issues.some((issue) => issue.type === "PROTECTED_TOKEN_MISMATCH")).toBe(
      true,
    );
    expect(
      issues
        .filter((issue) => issue.type === "PROTECTED_TOKEN_MISMATCH")
        .map((issue) => ("tokenType" in issue ? issue.tokenType : null)),
    ).toEqual(expect.arrayContaining(["code", "math", "urls", "numbers", "slots"]));
  });

  it("classifies structural, content, metadata and cosmetic source changes", () => {
    const baselineFile = file("zh", sourceBody);
    const baseline = contentHashes(baselineFile);
    expect(classifyChange(baseline, contentHashes(baselineFile))).toBeNull();
    expect(
      classifyChange(
        baseline,
        contentHashes(file("zh", sourceBody.replace("##", "###"))),
      ),
    ).toBe("STRUCTURAL_CHANGE");
    expect(
      classifyChange(
        baseline,
        contentHashes(file("zh", sourceBody.replace("使用", "继续使用"))),
      ),
    ).toBe("CONTENT_CHANGE");
    expect(
      classifyChange(baseline, contentHashes(file("zh", sourceBody, { order: 2 }))),
    ).toBe("METADATA_CHANGE");
    const cosmetic = { ...baseline, file: "different" };
    expect(classifyChange(baseline, cosmetic)).toBe("COSMETIC_CHANGE");
  });

  it("keeps historical debt non-blocking in a versioned warning manifest", () => {
    const manifest = buildManifest([file("zh", sourceBody)]);
    expect(manifest.version).toBe(1);
    expect(manifest.mode).toBe("warning");
    expect(manifest.counts).toEqual({ MISSING: 1 });
    expect(manifest.entries[0]).toMatchObject({
      key: "notes:example",
      status: "MISSING",
      strictBlocking: true,
      sourcePath: "src/content/notes/example.zh.md",
      targetPath: null,
    });
  });

  it("keeps explicit draft and placeholder pairs outside the strict public gate", () => {
    const draft = buildManifest([
      file("zh", sourceBody, { status: "draft", draft: true }),
      file("en", targetBody, {
        status: "draft",
        draft: true,
        isPlaceholder: true,
      }),
    ]);
    expect(draft.entries[0]).toMatchObject({
      status: "DRAFT_ONLY",
      strictBlocking: false,
    });
  });

  it("detects stale content against the accepted source hash", () => {
    const source = file("zh", sourceBody);
    const target = file("en", targetBody);
    const accepted = buildManifest([source, target]);
    const changedSource = file("zh", sourceBody.replace("使用", "继续使用"));
    const stale = buildManifest([changedSource, target], accepted);
    expect(stale.entries[0]).toMatchObject({
      status: "STALE_CONTENT",
      change: "CONTENT_CHANGE",
    });
    const refreshed = buildManifest(
      [changedSource, file("en", targetBody.replace("Keep", "Continue to keep"))],
      stale,
      new Set(["notes:example"]),
    );
    expect(refreshed.entries[0].status).toBe("SYNCED");
  });
});
