import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const notes = {
  overview: read("src/content/notes/sql-relational-data.zh.md"),
  primaryKey: read("src/content/notes/sql-primary-key.zh.md"),
  foreignKey: read("src/content/notes/sql-foreign-key.zh.md"),
  relationships: read("src/content/notes/sql-relationships.zh.md"),
  select: read("src/content/notes/sql-select.zh.md"),
  where: read("src/content/notes/sql-where.zh.md"),
  projection: read("src/content/notes/sql-projection.zh.md"),
  orderBy: read("src/content/notes/sql-order-by.zh.md"),
  pagination: read("src/content/notes/sql-pagination.zh.md"),
};
const layout = read("src/layouts/NoteLayout.astro");
const noteList = read("src/components/NoteList.astro");
const relationalModelExplorer = read(
  "src/components/learning/RelationalModelExplorer.astro",
);
const datasetExplorer = read("src/components/learning/SqlDatasetExplorer.astro");
const primaryKeyLab = read("src/components/learning/PrimaryKeyLab.astro");
const foreignKeyLab = read("src/components/learning/ForeignKeyLab.astro");
const relationshipLab = read(
  "src/components/learning/RelationshipCardinalityLab.astro",
);
const whereFilterLab = read("src/components/learning/WhereFilterLab.astro");
const projectionLab = read("src/components/learning/ProjectionColumnsLab.astro");
const orderByLab = read("src/components/learning/OrderByLab.astro");
const paginationLab = read("src/components/learning/PaginationLab.astro");
const sqlPlayground = read("src/components/learning/SqlPlayground.astro");

describe("SQL and relational data Learning Notes", () => {
  it("publishes SQL 01 through SQL 09 in one stable series", () => {
    [
      [notes.overview, "sql-relational-data", 1],
      [notes.primaryKey, "sql-primary-key", 2],
      [notes.foreignKey, "sql-foreign-key", 3],
      [notes.relationships, "sql-relationships", 4],
      [notes.select, "sql-select", 5],
      [notes.where, "sql-where", 6],
      [notes.projection, "sql-projection", 7],
      [notes.orderBy, "sql-order-by", 8],
      [notes.pagination, "sql-pagination", 9],
    ].forEach(([note, slug, order]) => {
      expect(note).toContain(`slug: ${slug}`);
      expect(note).toContain("seriesSlug: sql");
      expect(note).toContain(`order: ${order}`);
      expect(note).toContain("status: published");
      expect(note).toContain("draft: false");
    });
  });

  it("keeps SQL 01 as the complete relational-database foundation", () => {
    [
      "## 为什么需要数据库？",
      "### 层次模型 Hierarchical Model",
      "### 网状模型 Network Model",
      "### 关系模型 Relational Model",
      "## 关系数据库为什么不是一个“大表”？",
      "## 整个 SQL 系列使用同一份业务数据",
      "## 一行到底代表什么？",
      "## 数据类型不是装饰，而是字段语义的一部分",
      "## NULL 到底表示什么？",
      "## Schema 和 Data 是两件事",
      "## SQL 是什么？",
      "### DDL — Data Definition Language",
      "### DML — Data Manipulation Language",
      "### DQL — Data Query Language",
      "## 标准 SQL 和数据库方言不要混淆",
      "## 常见关系数据库有哪些？",
    ].forEach((term) => expect(notes.overview).toContain(term));
    expect(notes.overview).toContain('data-learning-slot="relational-model-explorer"');
    expect(notes.overview).toContain('data-learning-slot="sql-dataset-explorer"');
  });

  it("keeps SQL 02 and SQL 03 constraint lessons complete and dialect-aware", () => {
    [
      "## 一张表为什么需要“记录身份”？",
      "## 主键首先必须解决唯一性",
      "## 自增整数：常见但不是唯一方案",
      "## SQLite 的 INTEGER PRIMARY KEY 有什么特殊之处？",
      "## UUID：适合分布式生成，但不是一种单一算法",
      "## 联合主键：多个字段也可以共同确定身份",
    ].forEach((term) => expect(notes.primaryKey).toContain(term));
    expect(notes.primaryKey).toContain('data-learning-slot="primary-key-lab"');
    expect(notes.primaryKey).toContain('data-learning-slot="sql-playground"');

    [
      "## 主键解决“是谁”，外键解决“和谁有关”",
      "## 外键不是因为列名相同才成立",
      "## 什么叫引用完整性？",
      "## 外键约束如何阻止无效订单？",
      "## 外键也可以后加，但语法取决于数据库",
      "### SQLite 为什么不同？",
      "## 逻辑外键与数据库约束不是同一件事",
    ].forEach((term) => expect(notes.foreignKey).toContain(term));
    expect(notes.foreignKey).toContain('data-learning-slot="foreign-key-lab"');
  });

  it("keeps SQL 04 relationship cardinality aligned with the canonical bridge table", () => {
    [
      "## “两张表有关联”还不够",
      "## 一对多：一个客户可以有多张订单",
      "## 多对多：订单与产品为什么不能只加一个外键？",
      "## 中间表把多对多拆成两个一对多",
      "## 中间表为什么经常使用联合主键？",
      "## 一对一：一条记录最多对应另一条记录",
      "## 关系基数会直接影响 JOIN 后有多少行",
    ].forEach((term) => expect(notes.relationships).toContain(term));
    expect(notes.relationships).toContain("300 + 120 = 420");
    expect(notes.relationships).toContain(
      'data-learning-slot="relationship-cardinality-lab"',
    );
  });

  it("keeps SQL 05 SELECT deliberately separate from WHERE and Projection", () => {
    [
      "## 从“数据怎样组织”进入“怎样读取数据”",
      "## SELECT * FROM customers 到底在说什么？",
      "## 查询结果本身也是一个二维表",
      "## SELECT 会修改原表吗？",
      "## SELECT 并不一定需要 FROM",
      "### SELECT 1 是“连接检查”吗？",
      "## SELECT * 适合什么时候使用？",
    ].forEach((term) => expect(notes.select).toContain(term));
    expect(notes.select).toContain("SELECT 1 AS execution_ok;");
    expect(notes.select).toContain('data-learning-slot="sql-playground"');
    expect(notes.select).not.toContain("## WHERE");
  });

  it("keeps SQL 06 WHERE complete and numerically auditable", () => {
    [
      "## WHERE 改变的是结果集的“行”",
      "## 比较运算符是条件表达式的基础",
      "## AND：所有条件都必须成立",
      "## OR：任意一个条件成立即可",
      "## NOT：对一个条件取反",
      "## NOT、AND、OR 有优先级",
      "## BETWEEN：更直接地表达闭区间",
      "## IN：一个字段允许落在多个离散值中",
      "## LIKE：按文本模式筛选",
      "## NULL 不能用 = NULL 判断",
      "## WHERE 中存在三值逻辑",
    ].forEach((term) => expect(notes.where).toContain(term));
    expect(notes.where).toContain('data-learning-slot="where-filter-lab"');
    expect(notes.where).toContain("BETWEEN 400 AND 600");
    expect(notes.where).toContain("segment IN ('Retail', 'Enterprise')");
  });

  it("keeps SQL 07 Projection focused on result shape and aliases", () => {
    [
      "## 从筛选行进入选择列",
      "## Projection 改变的是结果集的列",
      "## 不返回某列不等于删除某列",
      "## 结果列的顺序由 SELECT 列表决定",
      "## 列别名改变结果集字段名",
      "## Projection 可以和 WHERE 组合",
      "## 表达式也可以成为结果列",
      "## SELECT 星号为什么不适合作为长期接口",
      "## Projection 不负责排序",
    ].forEach((term) => expect(notes.projection).toContain(term));
    expect(notes.projection).toContain('data-learning-slot="projection-columns-lab"');
    expect(notes.projection).toContain("customer_id AS customer_key");
    expect(notes.projection).toContain("ROUND(order_value * 1.10, 2) AS scenario_value");
  });

  it("keeps SQL 08 ORDER BY focused on deterministic ordering contracts", () => {
    [
      "## 从结果结构进入结果顺序",
      "## ORDER BY 改变的是结果行的排列顺序",
      "## ASC 是默认方向，但显式写出更容易复查",
      "## DESC 把排序方向反转",
      "## 多列排序是逐层解决并列值",
      "## 只有第一排序键还不一定形成稳定总顺序",
      "## WHERE、Projection 与 ORDER BY 怎样组合",
      "## NULL 排序不能只凭直觉推断",
      "## ORDER BY 是分页之前的关键前提",
    ].forEach((term) => expect(notes.orderBy).toContain(term));
    expect(notes.orderBy).toContain('data-learning-slot="order-by-lab"');
    ["ORDER BY", "customer_id ASC", "order_date DESC", "order_id ASC"].forEach((term) =>
      expect(notes.orderBy).toContain(term),
    );
  });

  it("keeps SQL 09 Pagination complete from OFFSET windows through keyset boundaries", () => {
    [
      "## 从排序结果进入页面窗口",
      "## LIMIT 定义页面最多返回多少行",
      "## OFFSET 定义先跳过多少行",
      "## 页码从 1 开始，OFFSET 从 0 开始",
      "## 总页数来自总记录数与 pageSize",
      "## 越界 OFFSET 通常返回空结果，而不是报错",
      "## Pagination 必须建立在稳定 ORDER BY 上",
      "## OFFSET 越深，数据库通常需要跳过越多记录",
      "## 数据在翻页期间发生变化，会产生另一类问题",
      "## Keyset pagination 用“上一页最后一个键”继续向后找",
      "## Keyset pagination 不是永远更好",
      "## 分页中的 COUNT 也要和查询口径一致",
    ].forEach((term) => expect(notes.pagination).toContain(term));
    expect(notes.pagination).toContain('data-learning-slot="pagination-lab"');
    expect(notes.pagination).toContain("OFFSET = pageSize × (pageIndex - 1)");
    expect(notes.pagination).toContain("LIMIT 2 OFFSET 2");
    expect(notes.pagination).toContain("order_value DESC, order_id ASC");
  });

  it("renders SQL 01 through SQL 09 through one editorial layout with generated TOCs", () => {
    expect(layout).toContain('const isSqlEditorial = entry.data.seriesSlug === "sql"');
    expect(layout).toContain("const { Content, headings } = await render(entry)");
    expect(layout).toContain("const sqlGeneratedToc = headings");
    expect(layout).toContain("heading.depth === 2");
    expect(layout).toContain("const learningToc = isSqlEditorial ? sqlGeneratedToc : statisticsToc");
    [
      "sql-relational-data",
      "sql-primary-key",
      "sql-foreign-key",
      "sql-relationships",
      "sql-select",
      "sql-where",
      "sql-projection",
      "sql-order-by",
      "sql-pagination",
    ].forEach((slug) => expect(layout).toContain(`entry.data.slug === "${slug}"`));
    expect(layout).toContain("<LearningNoteHero title={handbookTitle} />");
    expect(layout).not.toContain("const sqlOverviewToc");
    expect(layout).not.toContain("const sqlProjectionToc");
  });

  it("uses topic-specific interactive explanations instead of one generic widget", () => {
    [
      "<RelationalModelExplorer />",
      "<SqlDatasetExplorer />",
      "<PrimaryKeyLab />",
      "<ForeignKeyLab />",
      "<RelationshipCardinalityLab />",
      "<WhereFilterLab />",
      "<ProjectionColumnsLab />",
      "<OrderByLab />",
      "<PaginationLab />",
    ].forEach((marker) => expect(layout).toContain(marker));
    expect(relationalModelExplorer).toContain('data-model-choice="relational"');
    expect(datasetExplorer).toContain('data-dataset-choice="order-items"');
    expect(primaryKeyLab).toContain("data-key-checks");
    expect(foreignKeyLab).toContain('data-fk-mode="constraint"');
    expect(relationshipLab).toContain('data-relation-choice="many-to-many"');
    expect(whereFilterLab).toContain('data-where-rule="between"');
    expect(projectionLab).toContain('data-projection-mode="alias"');
    expect(orderByLab).toContain('data-order-rule="multi"');
    expect(orderByLab).toContain('data-order-rule="stable"');
    expect(orderByLab).toContain("data-order-sql-run");
    expect(paginationLab).toContain("data-pagination-page-size");
    expect(paginationLab).toContain("data-pagination-page-index");
    expect(paginationLab).toContain("data-pagination-demo-beyond");
    expect(paginationLab).toContain("data-pagination-run");
    expect(paginationLab).toContain("sqlLearningSeedSql");
  });

  it("keeps only the SQL overview as the compact handbook card", () => {
    expect(noteList).toContain('"sql-relational-data": "SQL 与关系数据"');
    expect(noteList).toContain("isCompactHandbook");
    [
      "sql-primary-key",
      "sql-foreign-key",
      "sql-relationships",
      "sql-select",
      "sql-where",
      "sql-projection",
      "sql-order-by",
      "sql-pagination",
    ].forEach((slug) => expect(noteList).not.toContain(`"${slug}":`));
  });

  it("keeps the shared SQLite playground focused and lazy-loaded for SQL 02–07", () => {
    expect(sqlPlayground).toContain("sqlLearningSeedSql");
    expect(sqlPlayground).toContain("inferredFocus");
    expect(sqlPlayground).toContain('data-sql-focus={focus}');
    expect(sqlPlayground).toContain('value: "duplicate"');
    expect(sqlPlayground).toContain('value: "foreign-key"');
    expect(sqlPlayground).toContain('value: "where-gte"');
    expect(sqlPlayground).toContain('value: "where-grouped"');
    expect(sqlPlayground).toContain('value: "projection-columns"');
    expect(sqlPlayground).toContain('value: "projection-alias"');
    expect(sqlPlayground).toContain('value: "projection-expression"');
    expect(sqlPlayground).toContain("sql.js@1.14.1");
    expect(sqlPlayground).toContain("data-sql-result-summary");
  });

  it("keeps all published SQL 01–09 notes free of course-facing, private and first-person labels", () => {
    Object.values(notes).forEach((note) => {
      expect(note).not.toMatch(/BUSINFO|Assignment|Submission|课程项目|课程作业/u);
      expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
      expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
    });
  });
});
