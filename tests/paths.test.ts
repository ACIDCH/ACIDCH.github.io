import { describe, expect, it } from "vitest";
import { siteConfig } from "../src/config/site";
import { getLocalizedPath, withBase } from "../src/utils/paths";
import {
  getCanonicalUrl,
  getGitHubRepoUrl,
} from "../src/utils/urls";

describe("path helpers", () => {
  it("keeps English at the unprefixed root", () => {
    expect(getLocalizedPath("/projects/", "en")).toBe("/projects/");
  });

  it("adds and removes the Chinese locale prefix", () => {
    expect(getLocalizedPath("/projects/", "zh")).toBe("/zh/projects/");
    expect(getLocalizedPath("/zh/projects/", "en")).toBe("/projects/");
  });

  it("applies a project base path without duplication", () => {
    expect(withBase("/projects/", "/portfolio/")).toBe(
      "/portfolio/projects/",
    );
    expect(withBase("/portfolio/projects/", "/portfolio/")).toBe(
      "/portfolio/projects/",
    );
  });
});

describe("URL helpers", () => {
  it("generates repository URLs from central configuration", () => {
    expect(getGitHubRepoUrl("example-repository")).toBe(
      `${siteConfig.github.origin}/${siteConfig.github.repositoryOwner}/example-repository`,
    );
  });

  it("generates canonical URLs from central configuration", () => {
    expect(getCanonicalUrl("/zh/")).toBe(
      new URL("/zh/", siteConfig.siteUrl).toString(),
    );
  });

  it("rejects an empty repository slug", () => {
    expect(() => getGitHubRepoUrl("")).toThrow(
      "A repository slug is required.",
    );
  });
});
