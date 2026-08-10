import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const overview = readFileSync("src/content/notes/sql-relational-data.zh.md", "utf8");
const primaryKey = readFileSync("src/content/notes/sql-primary-key.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const noteList = readFileSync("src/components/NoteList.astro", "utf8");
const primaryKeyLab = readFileSync("src/components/learning/PrimaryKeyLab.astro", "utf8");
const sqlPlayground = readFileSync("src/components/learning/SqlPlayground.astro", "utf8");

describe("SQL and relational data Learning Notes", () => {
  it("publishes SQL 01 and SQL 02 with stable series ordering", () => {
    expect(overview).toContain("slug: sql-relational-data");
    expect(overview).toContain("seriesSlug: sql");
    expect(overview).toContain("order: 1");
    expect(overview).toContain("status: published");
    expect(overview).toContain("draft: false");
    expect(overview).toContain("  - sql-primary-key");

    expect(primaryKey).toContain("slug: sql-primary-key");
    expect(primaryKey).toContain("seriesSlug: sql");
    expect(primaryKey).toContain("order: 2");
    expect(primaryKey).toContain("status: published");
    expect(primaryKey).toContain("draft: false");
    expect(primaryKey).toContain("  - sql-relational-data");
  });

  it("keeps SQL 01 focused on relational-data foundations", () => {
    [
      "## 关系数据库为什么不是一个“大表”？",
      "## 一行到底代表什么？",
      "## 字段名称只是开始，数据类型同样重要",
      "## NULL 到底表示什么？",
      "## 表结构和表中的数据是两件事",
      "## 多张表是如何组成一个业务模型的？",
      "## SQL 查询为什么依赖正确的数据结构？",
      "SQL 02 — Primary Key",
    ].forEach((term) => expect(overview).toContain(term));
    expect(overview).not.toContain('data-learning-slot="primary-key-lab"');
    expect(overview).not.toContain('data-learning-slot="sql-playground"');
  });

  it("gives SQL 02 a complete primary-key learning sequence", () => {
    [
      "## 一张表为什么需要“记录身份”？",
      "## 主键首先必须解决唯一性",
      "## “当前唯一”并不等于“适合作为主键”",
      "## 业务字段与记录身份应该分开",
      "## 重复主键会发生什么？",
      "## 自增整数：最容易理解的主键方案",
      "## 为什么经常看到 BIGINT？",
      "## UUID：当记录需要在不同系统中独立生成",
      "## 联合主键：一条记录也可以由多个字段共同确定",
      "## 主键、UNIQUE 与普通字段不要混淆",
      "## 在 Business Analytics 中，主键为什么同样重要？",
      "## 下一步：从“身份”进入“关系”",
    ].forEach((term) => expect(primaryKey).toContain(term));
    expect(primaryKey).toContain('data-learning-slot="primary-key-lab"');
    expect(primaryKey).toContain('data-learning-slot="sql-playground"');
  });

  it("uses one Business Analytics demo-data universe across both notes", () => {
    expect(overview).toContain("customers");
    expect(overview).toContain("orders");
    expect(overview).toContain("products");
    expect(primaryKey).toContain("customers");
    expect(primaryKey).toContain("orders");
    expect(primaryKey).toContain("order_items");
    expect(overview).not.toContain("students");
    expect(primaryKey).not.toContain("students");
  });

  it("renders both SQL notes through the shared editorial layout", () => {
    expect(layout).toContain('entry.data.slug === "sql-relational-data"');
    expect(layout).toContain('entry.data.slug === "sql-primary-key"');
    expect(layout).toContain("const isSqlEditorial = isSqlOverview || isSqlPrimaryKey");
    expect(layout).toContain("const sqlOverviewToc");
    expect(layout).toContain("const sqlPrimaryKeyToc");
    expect(layout).toContain("<LearningNoteHero title={handbookTitle} />");
  });

  it("moves the primary-key interactions to SQL 02 only", () => {
    expect(layout).toContain("isSqlPrimaryKey && (");
    expect(layout).toContain("<PrimaryKeyLab />");
    expect(layout).toContain("<SqlPlayground />");
    expect(layout).toContain('data-learning-block="primary-key-lab"');
    expect(layout).toContain('data-learning-block="sql-playground"');
  });

  it("keeps the SQL overview card compact while SQL 02 remains a normal series note", () => {
    expect(noteList).toContain('"sql-relational-data": "SQL 与关系数据"');
    expect(noteList).toContain("isCompactHandbook");
    expect(noteList).not.toContain('"sql-primary-key":');
  });

  it("provides an interactive primary-key stability demonstration", () => {
    expect(primaryKeyLab).toContain("data-key-choice");
    expect(primaryKeyLab).toContain("data-key-change");
    expect(primaryKeyLab).toContain("customer_id");
    expect(primaryKeyLab).toContain("email");
    expect(primaryKeyLab).toContain("phone");
  });

  it("keeps a real lazy-loaded SQLite constraint playground", () => {
    expect(sqlPlayground).toContain("sql.js@1.14.1");
    expect(sqlPlayground).toContain("sql-wasm.js");
    expect(sqlPlayground).toContain("PRAGMA foreign_keys = ON");
    expect(sqlPlayground).toContain("PRIMARY KEY");
    expect(sqlPlayground).toContain("data-sql-run");
    expect(sqlPlayground).toContain("data-sql-reset");
    expect(sqlPlayground).toContain("测试重复主键");
    expect(sqlPlayground.indexOf("getSqlModule")).toBeLessThan(sqlPlayground.indexOf("runQuery"));
  });

  it("does not expose course-facing or private identity labels", () => {
    [overview, primaryKey].forEach((note) => {
      expect(note).not.toMatch(/BUSINFO|Assignment|Submission|课程项目|课程作业/u);
      expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
    });
  });
});
