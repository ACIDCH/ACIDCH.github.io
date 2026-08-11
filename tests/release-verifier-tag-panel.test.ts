import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Learning Notes production verifier compatibility", () => {
  it("tracks the floating tag panel by a stable class token before the series map", async () => {
    const verifier = await source("scripts/verify-decision-models-production.mjs");
    const explorer = await source("src/components/NotesExplorer.astro");

    expect(explorer).toContain("tag-cloud-panel tag-cloud-panel--floating");
    expect(verifier).toContain('"tag-cloud-panel--floating"');
    expect(verifier).not.toContain("'class=\"tag-cloud-panel\"'");
    expect(verifier).toContain('class=\"learning-series-map\"');
    expect(verifier).toContain('class=\"notes-results-heading\"');
  });
});
