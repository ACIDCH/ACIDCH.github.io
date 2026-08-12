import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sqlOrders } from "../src/data/sql-learning";

const read = (path: string) => readFileSync(path, "utf8");

const ordered = [...sqlOrders].sort(
  (a, b) => b.order_value - a.order_value || a.order_id - b.order_id,
);

function page(size: number, index: number) {
  const offset = size * (index - 1);
  return ordered.slice(offset, offset + size).map((row) => row.order_id);
}

describe("SQL09 Pagination contract", () => {
  it("keeps the canonical stable order used by every page window", () => {
    expect(ordered.map((row) => row.order_id)).toEqual([50003, 50004, 50001, 50002]);
  });

  it("maps one-based page indexes to zero-based OFFSET windows", () => {
    expect(page(2, 1)).toEqual([50003, 50004]);
    expect(page(2, 2)).toEqual([50001, 50002]);
    expect(page(2, 3)).toEqual([]);
  });

  it("handles a partial last page when page size is three", () => {
    expect(page(3, 1)).toEqual([50003, 50004, 50001]);
    expect(page(3, 2)).toEqual([50002]);
  });

  it("keeps filtered pagination aligned with the same WHERE contract", () => {
    const filtered = ordered.filter((row) => row.order_value >= 400);
    expect(filtered.map((row) => row.order_id)).toEqual([50003, 50004, 50001]);
    expect(filtered.slice(2, 4).map((row) => row.order_id)).toEqual([50001]);
  });

  it("uses canonical data, a unique tie-breaker and real SQLite execution", () => {
    const component = read("src/components/learning/PaginationLab.astro");
    const note = read("src/content/notes/sql-pagination.zh.md");

    expect(component).toContain(
      'import { sqlLearningSeedSql, sqlOrders } from "../../data/sql-learning"',
    );
    expect(component).toContain(
      "b.order_value - a.order_value || a.order_id - b.order_id",
    );
    expect(component).toContain("ORDER BY order_value DESC, order_id ASC");
    expect(component).toContain("data-pagination-run");
    expect(note).toContain("Keyset pagination");
    expect(note).not.toContain("50008");
    expect(component).not.toContain("50008");
  });
});
