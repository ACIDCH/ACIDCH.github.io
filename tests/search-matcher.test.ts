import { describe, expect, it } from "vitest";
import {
  createSearchMatcher,
  findSearchResults,
  type SearchItem,
} from "../src/utils/search";

const items: SearchItem[] = [
  {
    title: "回归诊断",
    description: "残差与杠杆值",
    searchText: "回归诊断 残差 leverage R",
    path: "/zh/notes/regression-diagnostics/",
    locale: "zh",
    group: "note",
  },
  {
    title: "SQL notes",
    description: "Queries",
    searchText: "SQL notes SELECT customer churn",
    path: "/notes/sql/",
    locale: "en",
    group: "note",
  },
  {
    title: "Customer Churn",
    description: "Models",
    searchText: "Customer Churn 机器学习 回归 SQL",
    path: "/projects/customer-churn/",
    locale: "en",
    group: "project",
  },
];

describe("prepared search retains existing matching and ranking", () => {
  it.each([
    "",
    "  ",
    "回归",
    "sql",
    "ＳＱＬ",
    "ChUrN",
    " customer   churn ",
    "leverage",
    "missing",
    "机器学习",
  ])("matches the original implementation for %s", (query) => {
    const match = createSearchMatcher(items);
    expect(match(query)).toEqual(findSearchResults(items, query));
    expect(match(query, 1)).toEqual(findSearchResults(items, query, 1));
  });
  it("does not mutate source records or reorder the input array", () => {
    const before = JSON.stringify(items);
    const match = createSearchMatcher(items);
    match("SQL");
    match("回归");
    match("");
    expect(JSON.stringify(items)).toBe(before);
  });
  it("reads source search text only during preparation", () => {
    let reads = 0;
    const source = {
      ...items[0]!,
      get searchText() {
        reads++;
        return "回归";
      },
    };
    const match = createSearchMatcher([source]);
    match("回");
    match("回归");
    expect(reads).toBe(1);
  });
});
