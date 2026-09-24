export type SearchGroup = "page" | "project" | "note";

export interface SearchItem {
  title: string;
  description: string;
  path: string;
  locale: "en" | "zh";
  group: SearchGroup;
  searchText: string;
}

export function normaliseSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

export function findSearchResults(
  items: SearchItem[],
  query: string,
  limit = 18,
): SearchItem[] {
  const needle = normaliseSearchText(query);
  if (!needle) return [];

  return items
    .filter((item) => normaliseSearchText(item.searchText).includes(needle))
    .sort((left, right) => {
      const leftTitle = normaliseSearchText(left.title);
      const rightTitle = normaliseSearchText(right.title);
      return Number(rightTitle.includes(needle)) - Number(leftTitle.includes(needle));
    })
    .slice(0, limit);
}

/** Prepare immutable page content once, rather than normalising it per keystroke. */
export function createSearchMatcher(items: SearchItem[]) {
  const prepared = items.map((item) => ({
    item,
    text: normaliseSearchText(item.searchText),
    title: normaliseSearchText(item.title),
  }));
  return (query: string, limit = 18): SearchItem[] => {
    const needle = normaliseSearchText(query);
    if (!needle) return [];
    return prepared
      .filter((entry) => entry.text.includes(needle))
      .sort(
        (left, right) =>
          Number(right.title.includes(needle)) - Number(left.title.includes(needle)),
      )
      .slice(0, limit)
      .map((entry) => entry.item);
  };
}

export function splitHighlight(
  value: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  const needle = normaliseSearchText(query);
  const haystack = normaliseSearchText(value);
  const start = haystack.indexOf(needle);
  if (!needle || start < 0) return [{ text: value, match: false }];

  return [
    { text: value.slice(0, start), match: false },
    { text: value.slice(start, start + needle.length), match: true },
    { text: value.slice(start + needle.length), match: false },
  ].filter((segment) => segment.text);
}
