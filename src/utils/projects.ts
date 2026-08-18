import type { CollectionEntry } from "astro:content";
import type { Locale } from "../config/site";

const updatedTime = (entry: CollectionEntry<"projects">) =>
  entry.data.updatedAt?.getTime() ?? 0;

export function sortProjects(entries: CollectionEntry<"projects">[], locale: Locale) {
  const language = locale === "zh" ? "zh-CN" : "en";

  return [...entries].sort(
    (left, right) =>
      right.data.priority - left.data.priority ||
      Number(right.data.featured) - Number(left.data.featured) ||
      updatedTime(right) - updatedTime(left) ||
      left.data.title.localeCompare(right.data.title, language),
  );
}
