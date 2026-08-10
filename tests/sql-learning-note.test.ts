import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const overview = readFileSync("src/content/notes/sql-relational-data.zh.md", "utf8");
const primaryKey = readFileSync("src/content/notes/sql-primary-key.zh.md", "utf8");
const foreignKey = readFileSync("src/content/notes/sql-foreign-key.zh.md", "utf8");
const relationships = readFileSync("src/content/notes/sql-relationships.zh.md", "utf8");
const layout = readFileSync("src/layouts/NoteLayout.astro", "utf8");
const noteList = readFileSync("src/components/NoteList.astro", "utf8");
const primaryKeyLab = readFileSync("src/components/learning/PrimaryKeyLab.astro", "utf8");
const foreignKeyLab = readFileSync("src/components/learning/ForeignKeyLab.astro", "utf8");
const relationshipLab = readFileSync(
  "src/components/learning/RelationshipCardinalityLab.astro",
  "utf8",
);
const sqlPlayground = readFileSync("src/components/learning/SqlPlayground.astro", "utf8");

describe("SQL and relational data Learning Notes", () => {
  it("publishes SQL 01 through SQL 04 with stable series ordering", () => {
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

    expect(foreignKey).toContain("slug: sql-foreign-key");
    expect(foreignKey).toContain("seriesSlug: sql");
    expect(foreignKey).toContain("order: 3");
    expect(foreignKey).toContain("status: published");
    expect(foreignKey).toContain("draft: false");
    expect(foreignKey).toContain("  - sql-primary-key");

    expect(relationships).toContain("slug: sql-relationships");
    expect(relationships).toContain("seriesSlug: sql");
    expect(relationships).toContain("order: 4");
    expect(relationships).toContain("status: published");
    expect(relationships).toContain("draft: false");
    expect(relationships).toContain("  - sql-foreign-key");
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

  it("gives SQL 03 a focused foreign-key and integrity sequence", () => {
    [
      "## 主键解决“是谁”，外键解决“和谁有关”",
      "## 外键不是因为列名相同才成立",
      "## 父表与子表怎样理解？",
      "## 什么叫引用完整性？",
      "## 外键约束如何阻止无效订单？",
      "## 为什么必须先有父表记录？",
      "## 外键列可以重复吗？",
      "## 外键可以为空吗？",
      "## 逻辑外键与数据库外键约束不是同一件事",
      "## 删除外键约束不等于删除字段",
      "## 外键为什么会直接影响分析质量？",
      "## 下一步：关系到底是一对多还是多对多？",
    ].forEach((term) => expect(foreignKey).toContain(term));
    expect(foreignKey).toContain('data-learning-slot="foreign-key-lab"');
    expect(foreignKey).toContain('data-learning-slot="sql-playground"');
  });

  it("gives SQL 04 a complete relationship-cardinality sequence", () => {
    [
      "## “两张表有关联”还不够",
      "## 一对多：一个客户可以有多张订单",
      "## 一对多的外键放在哪一边？",
      "## 多对多：订单和产品为什么不能只加一个外键？",
      "## 中间表把多对多拆成两个一对多",
      "## 中间表为什么经常使用联合主键？",
      "## 一对一：一条记录最多对应另一条记录",
      "## 只有外键为什么还不能保证一对一？",
      "## 关系基数会直接影响 JOIN 后有多少行",
      "## 多对多连接为什么更容易放大记录数？",
      "## 从业务语言判断关系类型",
      "## 下一步：开始真正查询数据",
    ].forEach((term) => expect(relationships).toContain(term));
    expect(relationships).toContain('data-learning-slot="relationship-cardinality-lab"');
  });

  it("uses one Business Analytics demo-data universe across SQL 01 to SQL 04", () => {
    expect(overview).toContain("customers");
    expect(overview).toContain("orders");
    expect(overview).toContain("products");
    expect(primaryKey).toContain("order_items");
    expect(foreignKey).toContain("customers");
    expect(foreignKey).toContain("orders");
    expect(relationships).toContain("customers");
    expect(relationships).toContain("orders");
    expect(relationships).toContain("order_items");
    expect(relationships).toContain("products");
    [overview, primaryKey, foreignKey, relationships].forEach((note) => {
      expect(note).not.toContain("students");
      expect(note).not.toContain("classes");
      expect(note).not.toContain("teachers");
    });
  });

  it("renders SQL 01 to SQL 04 through the shared editorial layout", () => {
    expect(layout).toContain('entry.data.slug === "sql-relational-data"');
    expect(layout).toContain('entry.data.slug === "sql-primary-key"');
    expect(layout).toContain('entry.data.slug === "sql-foreign-key"');
    expect(layout).toContain('entry.data.slug === "sql-relationships"');
    expect(layout).toContain("const isSqlEditorial");
    ["isSqlOverview", "isSqlPrimaryKey", "isSqlForeignKey", "isSqlRelationships"].forEach(
      (term) => expect(layout).toContain(term),
    );
    expect(layout).toContain("const sqlOverviewToc");
    expect(layout).toContain("const sqlPrimaryKeyToc");
    expect(layout).toContain("const sqlForeignKeyToc");
    expect(layout).toContain("const sqlRelationshipsToc");
    expect(layout).toContain("<LearningNoteHero title={handbookTitle} />");
  });

  it("places topic-specific interactions on SQL 02 to SQL 04", () => {
    expect(layout).toContain("isSqlPrimaryKey && (");
    expect(layout).toContain("isSqlForeignKey && (");
    expect(layout).toContain("isSqlRelationships && (");
    expect(layout).toContain("<PrimaryKeyLab />");
    expect(layout).toContain("<ForeignKeyLab />");
    expect(layout).toContain("<RelationshipCardinalityLab />");
    expect(layout).toContain("<SqlPlayground />");
    expect(layout).toContain('data-learning-block="primary-key-lab"');
    expect(layout).toContain('data-learning-block="foreign-key-lab"');
    expect(layout).toContain('data-learning-block="relationship-cardinality-lab"');
  });

  it("keeps the SQL overview card compact while numbered SQL notes remain normal series notes", () => {
    expect(noteList).toContain('"sql-relational-data": "SQL 与关系数据"');
    expect(noteList).toContain("isCompactHandbook");
    expect(noteList).not.toContain('"sql-primary-key":');
    expect(noteList).not.toContain('"sql-foreign-key":');
    expect(noteList).not.toContain('"sql-relationships":');
  });

  it("provides an interactive primary-key stability demonstration", () => {
    expect(primaryKeyLab).toContain("data-key-choice");
    expect(primaryKeyLab).toContain("data-key-change");
    expect(primaryKeyLab).toContain("customer_id");
    expect(primaryKeyLab).toContain("email");
    expect(primaryKeyLab).toContain("phone");
  });

  it("provides an interactive foreign-key integrity demonstration", () => {
    expect(foreignKeyLab).toContain("data-foreign-key-choice");
    expect(foreignKeyLab).toContain('value="9999"');
    expect(foreignKeyLab).toContain("引用有效");
    expect(foreignKeyLab).toContain("引用无效");
    expect(foreignKeyLab).toContain("customers.customer_id");
  });

  it("provides an interactive relationship-cardinality comparison", () => {
    expect(relationshipLab).toContain('data-relation-choice="one-to-many"');
    expect(relationshipLab).toContain('data-relation-choice="many-to-many"');
    expect(relationshipLab).toContain('data-relation-choice="one-to-one"');
    expect(relationshipLab).toContain("order_items · bridge");
    expect(relationshipLab).toContain("PK (order_id, product_id)");
    expect(relationshipLab).toContain("UNIQUE customer_id");
  });

  it("keeps a real lazy-loaded SQLite constraint playground", () => {
    expect(sqlPlayground).toContain("sql.js@1.14.1");
    expect(sqlPlayground).toContain("sql-wasm.js");
    expect(sqlPlayground).toContain("PRAGMA foreign_keys = ON");
    expect(sqlPlayground).toContain("PRIMARY KEY");
    expect(sqlPlayground).toContain("FOREIGN KEY");
    expect(sqlPlayground).toContain("data-sql-run");
    expect(sqlPlayground).toContain("data-sql-reset");
    expect(sqlPlayground).toContain("测试重复主键");
    expect(sqlPlayground).toContain("测试无效外键");
  });

  it("does not expose course-facing, private identity or first-person labels", () => {
    [overview, primaryKey, foreignKey, relationships].forEach((note) => {
      expect(note).not.toMatch(/BUSINFO|Assignment|Submission|课程项目|课程作业/u);
      expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
      expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
    });
  });
});
