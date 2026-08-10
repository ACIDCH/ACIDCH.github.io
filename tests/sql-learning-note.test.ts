import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const note = readFileSync("src/content/notes/sql-relational-data.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const noteList = readFileSync("src/components/NoteList.astro", "utf8");
const primaryKeyLab = readFileSync("src/components/learning/PrimaryKeyLab.astro", "utf8");
const sqlPlayground = readFileSync("src/components/learning/SqlPlayground.astro", "utf8");

describe("SQL and relational data Learning Note", () => {
  it("publishes the SQL handbook with stable series metadata", () => {
    expect(note).toContain("slug: sql-relational-data");
    expect(note).toContain("title: SQL 与关系数据");
    expect(note).toContain("seriesSlug: sql");
    expect(note).toContain("status: published");
    expect(note).toContain("draft: false");
  });

  it("covers the relational model concepts from the handbook source", () => {
    [
      "## 关系表到底在保存什么？",
      "## 主键：怎样唯一定位一条记录？",
      "### 自增整数与 UUID",
      "### 联合主键",
      "## 外键：表之间怎样建立关系？",
      "### 多对多关系",
      "### 一对一关系",
      "## 索引：为什么有的查询更快？",
      "## 从结构走向查询：主键和外键为什么重要？",
    ].forEach((term) => expect(note).toContain(term));
  });

  it("uses Business Analytics tables instead of classroom student examples", () => {
    expect(note).toContain("customers");
    expect(note).toContain("orders");
    expect(note).toContain("products");
    expect(note).not.toContain("students");
    expect(note).not.toContain("classes");
  });

  it("renders the SQL handbook through the shared spacious handbook layout", () => {
    expect(layout).toContain('entry.data.slug === "sql-relational-data"');
    expect(layout).toContain('const handbookTitle = isSqlHandbook ? "SQL 与关系数据" : "统计学与 R"');
    expect(layout).toContain("<PrimaryKeyLab />");
    expect(layout).toContain("<SqlPlayground />");
    expect(layout).toContain('data-learning-block="primary-key-lab"');
    expect(layout).toContain('data-learning-block="sql-playground"');
  });

  it("keeps the SQL handbook card compact on homepage and Notes listings", () => {
    expect(noteList).toContain('"sql-relational-data": "SQL 与关系数据"');
    expect(noteList).toContain("isCompactHandbook");
    expect(noteList).toContain("note-card--handbook");
  });

  it("provides an interactive primary-key stability demonstration", () => {
    expect(primaryKeyLab).toContain("data-key-choice");
    expect(primaryKeyLab).toContain("data-key-change");
    expect(primaryKeyLab).toContain("customer_id");
    expect(primaryKeyLab).toContain("email");
    expect(primaryKeyLab).toContain("phone");
  });

  it("provides a real lazy-loaded SQLite playground", () => {
    expect(sqlPlayground).toContain("sql.js@1.14.1");
    expect(sqlPlayground).toContain("sql-wasm.js");
    expect(sqlPlayground).toContain("PRAGMA foreign_keys = ON");
    expect(sqlPlayground).toContain("PRIMARY KEY");
    expect(sqlPlayground).toContain("FOREIGN KEY");
    expect(sqlPlayground).toContain("data-sql-run");
    expect(sqlPlayground).toContain("data-sql-reset");
    expect(sqlPlayground.indexOf("getSqlModule")).toBeLessThan(sqlPlayground.indexOf("runQuery"));
  });

  it("does not expose course-facing or private identity labels", () => {
    expect(note).not.toMatch(/BUSINFO|Assignment|Submission|课程项目|课程作业/u);
    expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
  });
});
