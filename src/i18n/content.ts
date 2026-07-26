import type { CollectionEntry } from "astro:content";
import type { Locale } from "../config/site";

type TranslatableEntry = CollectionEntry<"projects"> | CollectionEntry<"notes">;

export function findTranslation<T extends TranslatableEntry>(
  entries: T[],
  translationKey: string,
  locale: Locale,
): T | undefined {
  return entries.find(
    (entry) =>
      entry.data.translationKey === translationKey && entry.data.locale === locale,
  );
}
