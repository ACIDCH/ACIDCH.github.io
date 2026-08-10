import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const notes = {
  overview: read("src/content/notes/sql-relational-data.zh.md"),
  primaryKey: read("src/content/notes/sql-primary-key.zh.md"),
  foreignKey: read("src/content/notes/sql-foreign-key.zh.md"),
  relationships: read("src/content/notes/sql-relationships.zh.md"),
  select: read("src/content/notes/sql-select.zh.md"),
};
const layout = read("src/layouts/NoteLayout.astro");
const noteList = read("src/components/NoteList.astro");
const primaryKeyLab = read("src/components/learning/PrimaryKeyLab.astro");
const foreignKeyLab = read("src/components/learning/ForeignKeyLab.astro");
const relationshipLab = read("src/components/learning/RelationshipCardinalityLab.astro");
const sqlPlayground = read("src/components/learning/SqlPlayground.astro");

describe("SQL and relational data Learning Notes", () => {
  it("publishes SQL 01 through SQL 05 in one stable series", () => {
    [
      [notes.overview, "sql-relational-data", 1],
      [notes.primaryKey, "sql-primary-key", 2],
      [notes.foreignKey, "sql-foreign-key", 3],
      [notes.relationships, "sql-relationships", 4],
      [notes.select, "sql-select", 5],
    ].forEach(([note, slug, order]) => {
      expect(note).toContain(`slug: ${slug}`);
      expect(note).toContain("seriesSlug: sql");
      expect(note).toContain(`order: ${order}`);
      expect(note).toContain("status: published");
      expect(note).toContain("draft: false");
    });
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
    ].forEach((term) => expect(notes.overview).toContain(term));
    expect(notes.overview).not.toContain('data-learning-slot="primary-key-lab"');
    expect(notes.overview).not.toContain('data-learning-slot="sql-playground"');
  });

  it("gives SQL 02 a complete primary-key learning sequence", () => {
    [
      "## 一张表为什么需要“记录身份”？",
      "## 主键首先必须解决唯一性",
      "## “当前唯一”并不等于“适合作为主键”",
      "## 业务字段与记录身份应该分开",
      "## 重复主键会发生什么？",
      "## 自增整数：最容易理解的主键方案",
      "## UUID：当记录需要在不同系统中独立生成",
      "## 联合主键：一条记录也可以由多个字段共同确定",
      "## 在 Business Analytics 中，主键为什么同样重要？",
      "## 下一步：从“身份”进入“关系”",
    ].forEach((term) => expect(notes.primaryKey).toContain(term));
    expect(notes.primaryKey).toContain('data-learning-slot="primary-key-lab"');
    expect(notes.primaryKey).toContain('data-learning-slot="sql-playground"');
  });

  it("gives SQL 03 a focused foreign-key and integrity sequence", () => {
    [
      "## 主键解决“是谁”，外键解决“和谁有关”",
      "## 外键不是因为列名相同才成立",
      "## 什么叫引用完整性？",
      "## 外键约束如何阻止无效订单？",
      "## 逻辑外键与数据库外键约束不是同一件事",
      "## 外键为什么会直接影响分析质量？",
      "## 下一步：关系到底是一对多还是多对多？",
    ].forEach((term) => expect(notes.foreignKey).toContain(term));
    expect(notes.foreignKey).toContain('data-learning-slot="foreign-key-lab"');
    expect(notes.foreignKey).toContain('data-learning-slot="sql-playground"');
  });

  it("gives SQL 04 a complete relationship-cardinality sequence", () => {
    [
      "## “两张表有关联”还不够",
      "## 一对多：一个客户可以有多张订单",
      "## 多对多：订单和产品为什么不能只加一个外键？",
      "## 中间表把多对多拆成两个一对多",
      "## 中间表为什么经常使用联合主键？",
      "## 一对一：一条记录最多对应另一条记录",
      "## 只有外键为什么还不能保证一对一？",
      "## 关系基数会直接影响 JOIN 后有多少行",
      "## 下一步：开始真正查询数据",
    ].forEach((term) => expect(notes.relationships).toContain(term));
    expect(notes.relationships).toContain(
      'data-learning-slot="relationship-cardinality-lab"',
    );
  });

  it("gives SQL 05 a focused basic SELECT sequence", () => {
    [
      "## 从“数据怎样组织”进入“怎样读取数据”",
      "## SELECT * FROM customers 到底在说什么？",
      "## 星号 * 表示什么？",
      "## 没有 WHERE 时会发生什么？",
      "## 查询结果本身也是一个二维表",
      "## SELECT 会修改原表吗？",
      "## 先运行最基础的查询",
      "## 查询前先记住记录粒度",
      "## SELECT 并不一定需要 FROM",
      "## SELECT * 适合什么时候使用？",
      "## 下一步：只保留满足条件的记录",
    ].forEach((term) => expect(notes.select).toContain(term));
    expect(notes.select).toContain("SELECT 1;");
    expect(notes.select).toContain('data-learning-slot="sql-playground"');
    expect(notes.select).not.toContain("## WHERE");
  });

  it("uses one Business Analytics demo-data universe across the SQL sequence", () => {
    expect(notes.overview).toContain("customers");
    expect(notes.overview).toContain("orders");
    expect(notes.primaryKey).toContain("order_items");
    expect(notes.relationships).toContain("products");
    expect(notes.select).toContain("customers");
    expect(notes.select).toContain("orders");

    Object.values(notes).forEach((note) => {
      expect(note).not.toContain("students");
      expect(note).not.toContain("classes");
      expect(note).not.toContain("teachers");
    });
  });

  it("renders SQL 01 through SQL 05 through the shared editorial layout", () => {
    [
      "sql-relational-data",
      "sql-primary-key",
      "sql-foreign-key",
      "sql-relationships",
      "sql-select",
    ].forEach((slug) => expect(layout).toContain(`entry.data.slug === "${slug}"`));
    [
      "const sqlOverviewToc",
      "const sqlPrimaryKeyToc",
      "const sqlForeignKeyToc",
      "const sqlRelationshipsToc",
      "const sqlSelectToc",
    ].forEach((term) => expect(layout).toContain(term));
    expect(layout).toContain("<LearningNoteHero title={handbookTitle} />");
  });

  it("places topic-specific interactions on SQL 02 through SQL 05", () => {
    expect(layout).toContain("<PrimaryKeyLab />");
    expect(layout).toContain("<ForeignKeyLab />");
    expect(layout).toContain("<RelationshipCardinalityLab />");
    expect(layout).toContain('<SqlPlayground defaultPreset="customers" />');
    expect(layout).toContain('data-learning-block="primary-key-lab"');
    expect(layout).toContain('data-learning-block="foreign-key-lab"');
    expect(layout).toContain('data-learning-block="relationship-cardinality-lab"');
    expect(layout).toContain('data-learning-block="sql-playground"');
  });

  it("keeps only the SQL overview as the compact handbook card", () => {
    expect(noteList).toContain('"sql-relational-data": "SQL 与关系数据"');
    expect(noteList).toContain("isCompactHandbook");
    ["sql-primary-key", "sql-foreign-key", "sql-relationships", "sql-select"].forEach(
      (slug) => expect(noteList).not.toContain(`"${slug}":`),
    );
  });

  it("provides interactive primary-key, foreign-key and relationship demonstrations", () => {
    expect(primaryKeyLab).toContain("data-key-choice");
    expect(primaryKeyLab).toContain("data-key-change");
    expect(foreignKeyLab).toContain("data-foreign-key-choice");
    expect(foreignKeyLab).toContain('value="9999"');
    expect(relationshipLab).toContain('data-relation-choice="one-to-many"');
    expect(relationshipLab).toContain('data-relation-choice="many-to-many"');
    expect(relationshipLab).toContain('data-relation-choice="one-to-one"');
    expect(relationshipLab).toContain("order_items · bridge");
  });

  it("keeps one lazy-loaded SQLite playground reusable across SQL topics", () => {
    expect(sqlPlayground).toContain("defaultPreset");
    expect(sqlPlayground).toContain("data-default-preset={defaultPreset}");
    expect(sqlPlayground).toContain('option value="customers"');
    expect(sqlPlayground).toContain('option value="orders"');
    expect(sqlPlayground).toContain('option value="expression"');
    expect(sqlPlayground).toContain("SELECT 1 AS connection_ok");
    expect(sqlPlayground).toContain("sql.js@1.14.1");
    expect(sqlPlayground).toContain("PRAGMA foreign_keys = ON");
    expect(sqlPlayground).toContain("测试重复主键");
    expect(sqlPlayground).toContain("测试无效外键");
  });

  it("does not expose course-facing, private identity or first-person labels", () => {
    Object.values(notes).forEach((note) => {
      expect(note).not.toMatch(/BUSINFO|Assignment|Submission|课程项目|课程作业/u);
      expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
      expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
    });
  });
});
