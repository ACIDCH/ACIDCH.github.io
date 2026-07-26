import { siteConfig } from "../config/site";
import { withBase } from "./paths";

export function getGitHubProfileUrl(): string {
  return `${siteConfig.github.origin}/${siteConfig.github.username}`;
}

export function getGitHubRepoUrl(repoSlug: string): string {
  const safeSlug = repoSlug
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (!safeSlug) {
    throw new Error("A repository slug is required.");
  }

  return `${siteConfig.github.origin}/${siteConfig.github.repositoryOwner}/${safeSlug}`;
}

export function getCanonicalUrl(path: string): string {
  return new URL(withBase(path), siteConfig.siteUrl).toString();
}
