import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sqlOrders } from "../src/data/sql-learning";

const read = (path: string) => readFileSync(path, "utf8");
const note = read("src/content/notes/sql-order-by.zh.md");
const lab = read("src/components/learning/OrderByLab.astro");
const layout = read("src/layouts/NoteLayout.astro");
const audit = read("scripts/audit-learning-notes.mjs");

describe("SQL 08 ORDER BY Learning Note", () => {
  it("publishes SQL 08 in the locked SQL series", () => {
    expect(note).toContain("translationKey: sql-order-by");
    expect(note).toContain("slug: sql-order-by");
    expect(note).toContain("seriesSlug: sql");
    expect(note).toContain("order: 8");
    expect(note).toContain("status: published");
    expect(note).toContain("draft: false");
    expect(note).toContain("isPlaceholder: false");
  });

  it("covers the complete ORDER BY knowledge skeleton plus practical boundaries", () => {
    [
      "## 从结果结构进入结果顺序",
      "## ORDER BY 改变的是结果行的排列顺序",
      "## ASC 是默认方向，但显式写出更容易复查",
      "## DESC 把排序方向反转",
      "## 多列排序是逐层解决并列值",
      "## 每一个排序列都有自己的方向",
      "## 只有第一排序键还不一定形成稳定总顺序",
      "## WHERE、Projection 与 ORDER BY 怎样组合",
      "## ORDER BY 为什么放在 WHERE 后面",
      "## 可以按输出别名排序",
      "## 也能按列位置排序，但长期代码不推荐",
      "## NULL 排序不能只凭直觉推断",
      "## 文本排序还受到 collation 影响",
      "## ORDER BY 是分页之前的关键前提",
      "## Business Analytics 中 ORDER BY 常见在哪里",
      "## 下一步从有序结果中截取一页",
    ].forEach((marker) => expect(note).toContain(marker));
    expect(note).toContain('data-learning-slot="order-by-lab"');
  });

  it("keeps ascending and descending examples aligned with canonical orders", () => {
    expect(
      [...sqlOrders].sort((a, b) => a.order_value - b.order_value).map((row) => row.order_id),
    ).toEqual([50002, 50001, 50004, 50003]);
    expect(
      [...sqlOrders].sort((a, b) => b.order_value - a.order_value).map((row) => row.order_id),
    ).toEqual([50003, 50004, 50001, 50002]);
  });

  it("uses the second sort key only to resolve the canonical customer tie", () => {
    const ordered = [...sqlOrders]
      .sort(
        (a, b) => a.customer_id - b.customer_id || b.order_date.localeCompare(a.order_date),
      )
      .map((row) => row.order_id);
    expect(ordered).toEqual([50002, 50001, 50003, 50004]);
  });

  it("keeps the filtered ORDER BY example numerically correct", () => {
    const ordered = sqlOrders
      .filter((row) => row.order_value >= 400)
      .sort((a, b) => b.order_value - a.order_value || a.order_id - b.order_id)
      .map((row) => row.order_id);
    expect(ordered).toEqual([50003, 50004, 50001]);
  });

  it("uses canonical data for both the visual explorer and real SQLite runner", () => {
    expect(lab).toContain('from "../../data/sql-learning"');
    expect(lab).toContain("sqlLearningSeedSql");
    expect(lab).toContain('data-order-rule="multi"');
    expect(lab).toContain('data-order-rule="stable"');
    expect(lab).toContain('data-order-sql-run');
    expect(lab).toContain("sql.js@1.14.1");
    expect(lab).toContain("ORDER BY order_value DESC, order_id ASC");
    expect(lab).toContain("ORDER BY customer_id ASC, order_date DESC, order_id ASC");
  });

  it("makes SQL handbook TOCs derive from rendered headings instead of copied IDs", () => {
    expect(layout).toContain("const { Content, headings } = await render(entry)");
    expect(layout).toContain('entry.data.seriesSlug === "sql"');
    expect(layout).toContain("const sqlGeneratedToc = headings");
    expect(layout).toContain("heading.depth === 2");
    expect(layout).toContain("<OrderByLab />");
    expect(layout).not.toContain("const sqlOrderByToc");
  });

  it("extends the public Learning Note build audit through SQL 08", () => {
    expect(audit).toContain('source: "sql-order-by.zh.md"');
    expect(audit).toContain('route: "sql-order-by"');
  });

  it("keeps public SQL 08 text free of private, course-facing and first-person labels", () => {
    expect(note).not.toMatch(/BUSINFO|Assignment|Submission|课程项目|课程作业/u);
    expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
    expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
    expect(note).not.toMatch(/\bAI\b|ChatGPT|OpenAI|LLM/iu);
  });
});
