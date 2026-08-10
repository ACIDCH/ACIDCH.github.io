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
const sqlPlayground = read("src/components/learning/SqlPlayground.astro");

describe("SQL and relational data Learning Notes", () => {
  it("publishes SQL 01 through SQL 07 in one stable series", () => {
    [
      [notes.overview, "sql-relational-data", 1],
      [notes.primaryKey, "sql-primary-key", 2],
      [notes.foreignKey, "sql-foreign-key", 3],
      [notes.relationships, "sql-relationships", 4],
      [notes.select, "sql-select", 5],
      [notes.where, "sql-where", 6],
      [notes.projection, "sql-projection", 7],
    ].forEach(([note, slug, order]) => {
      expect(note).toContain(`slug: ${slug}`);
      expect(note).toContain("seriesSlug: sql");
      expect(note).toContain(`order: ${order}`);
      expect(note).toContain("status: published");
      expect(note).toContain("draft: false");
    });
  });

  it("restores SQL 01 as a complete relational-database foundation", () => {
    [
      "## 为什么需要数据库？",
      "## 数据不只有一种组织模型",
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
    expect(notes.overview).not.toContain('data-learning-slot="primary-key-lab"');
  });

  it("gives SQL 02 a complete and dialect-aware primary-key sequence", () => {
    [
      "## 一张表为什么需要“记录身份”？",
      "## 主键首先必须解决唯一性",
      "## “当前唯一”并不等于“适合作为主键”",
      "## 业务字段与记录身份应该分开",
      "## 重复主键会发生什么？",
      "## 自增整数：常见但不是唯一方案",
      "## INTEGER 和 BIGINT 的容量差别有多大？",
      "## SQLite 的 INTEGER PRIMARY KEY 有什么特殊之处？",
      "## UUID：适合分布式生成，但不是一种单一算法",
      "## 联合主键：多个字段也可以共同确定身份",
      "## 在 Business Analytics 中，主键为什么同样重要？",
      "## 下一步：从“身份”进入“关系”",
    ].forEach((term) => expect(notes.primaryKey).toContain(term));
    expect(notes.primaryKey).toContain('data-learning-slot="primary-key-lab"');
    expect(notes.primaryKey).toContain('data-learning-slot="sql-playground"');
  });

  it("gives SQL 03 a complete foreign-key, DDL and integrity sequence", () => {
    [
      "## 主键解决“是谁”，外键解决“和谁有关”",
      "## 外键不是因为列名相同才成立",
      "## 什么叫引用完整性？",
      "## 外键约束如何阻止无效订单？",
      "## 外键也可以后加，但语法取决于数据库",
      "### SQLite 为什么不同？",
      "## 逻辑外键与数据库约束不是同一件事",
      "## 外键为什么会直接影响分析质量？",
      "## 下一步：关系到底是一对多还是多对多？",
    ].forEach((term) => expect(notes.foreignKey).toContain(term));
    expect(notes.foreignKey).toContain('data-learning-slot="foreign-key-lab"');
    expect(notes.foreignKey).toContain('data-learning-slot="sql-playground"');
  });

  it("gives SQL 04 a canonical relationship-cardinality sequence", () => {
    [
      "## “两张表有关联”还不够",
      "## 一对多：一个客户可以有多张订单",
      "## 多对多：订单与产品为什么不能只加一个外键？",
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
    expect(notes.relationships).toContain("300 + 120 = 420");
  });

  it("gives SQL 05 a precise basic SELECT sequence", () => {
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
      "### SELECT 1 是“连接检查”吗？",
      "## SELECT * 适合什么时候使用？",
      "## 下一步：只保留满足条件的记录",
    ].forEach((term) => expect(notes.select).toContain(term));
    expect(notes.select).toContain("SELECT 1 AS execution_ok;");
    expect(notes.select).toContain('data-learning-slot="sql-playground"');
    expect(notes.select).not.toContain("## WHERE");
  });

  it("gives SQL 06 a complete WHERE and predicate-logic sequence", () => {
    [
      "## 从“读取整张表”进入“只保留需要的记录”",
      "## WHERE 改变的是结果集的“行”",
      "## 比较运算符是条件表达式的基础",
      "## AND：所有条件都必须成立",
      "## OR：任意一个条件成立即可",
      "## NOT：对一个条件取反",
      "## NOT、AND、OR 有优先级",
      "## 括号比记忆优先级更可靠",
      "## 范围条件为什么经常写错？",
      "## BETWEEN：更直接地表达闭区间",
      "## IN：一个字段允许落在多个离散值中",
      "## LIKE：按文本模式筛选",
      "## NULL 不能用 = NULL 判断",
      "## WHERE 中存在三值逻辑",
      "## WHERE 和 ORDER BY 解决的不是同一个问题",
      "## WHERE 不等于“查询一定很快”",
      "## Business Analytics 中的 WHERE 通常来自业务规则",
      "## 下一步：不只筛选行，还要选择列",
    ].forEach((term) => expect(notes.where).toContain(term));
    expect(notes.where).toContain('data-learning-slot="where-filter-lab"');
    expect(notes.where).toContain('data-learning-slot="sql-playground"');
    expect(notes.where).toContain("WHERE phone IS NULL");
    expect(notes.where).toContain("BETWEEN 400 AND 600");
    expect(notes.where).toContain("segment IN ('Retail', 'Enterprise')");
  });

  it("gives SQL 07 a complete Projection and result-shape sequence", () => {
    [
      "## 从筛选行进入选择列",
      "## Projection 改变的是结果集的列",
      "## 不返回某列不等于删除某列",
      "## 结果列的顺序由 SELECT 列表决定",
      "## 列别名改变结果集字段名",
      "## AS 为什么值得保留",
      "## Projection 可以和 WHERE 组合",
      "## 表达式也可以成为结果列",
      "## 别名应该表达业务语义",
      "## 重复或模糊的输出列名会制造风险",
      "## SELECT 星号为什么不适合作为长期接口",
      "## Projection 不负责排序",
      "## Business Analytics 中 Projection 是结果接口设计",
      "## 下一步控制结果的行顺序",
    ].forEach((term) => expect(notes.projection).toContain(term));
    expect(notes.projection).toContain('data-learning-slot="projection-columns-lab"');
    expect(notes.projection).toContain('data-learning-slot="sql-playground"');
    expect(notes.projection).toContain("3 rows × 3 columns");
    expect(notes.projection).toContain("customer_id AS customer_key");
    expect(notes.projection).toContain("ROUND(order_value * 1.10, 2) AS scenario_value");
  });

  it("renders SQL 01 through SQL 07 through the shared editorial layout", () => {
    [
      "sql-relational-data",
      "sql-primary-key",
      "sql-foreign-key",
      "sql-relationships",
      "sql-select",
      "sql-where",
      "sql-projection",
    ].forEach((slug) => expect(layout).toContain(`entry.data.slug === "${slug}"`));
    [
      "const sqlOverviewToc",
      "const sqlPrimaryKeyToc",
      "const sqlForeignKeyToc",
      "const sqlRelationshipsToc",
      "const sqlSelectToc",
      "const sqlWhereToc",
      "const sqlProjectionToc",
    ].forEach((term) => expect(layout).toContain(term));
    expect(layout).toContain("<LearningNoteHero title={handbookTitle} />");
  });

  it("adds richer topic-specific visuals instead of one generic playground", () => {
    expect(layout).toContain("<RelationalModelExplorer />");
    expect(layout).toContain("<SqlDatasetExplorer />");
    expect(layout).toContain("<PrimaryKeyLab />");
    expect(layout).toContain("<ForeignKeyLab />");
    expect(layout).toContain("<RelationshipCardinalityLab />");
    expect(layout).toContain("<WhereFilterLab />");
    expect(layout).toContain("<ProjectionColumnsLab />");
    expect(relationalModelExplorer).toContain('data-model-choice="hierarchical"');
    expect(relationalModelExplorer).toContain('data-model-choice="network"');
    expect(relationalModelExplorer).toContain('data-model-choice="relational"');
    expect(datasetExplorer).toContain('data-dataset-choice="order-items"');
    expect(primaryKeyLab).toContain("data-key-checks");
    expect(foreignKeyLab).toContain('data-fk-mode="constraint"');
    expect(foreignKeyLab).toContain('data-fk-mode="logical"');
    expect(relationshipLab).toContain('data-relation-choice="many-to-many"');
    expect(whereFilterLab).toContain('data-where-rule="between"');
    expect(whereFilterLab).toContain('data-where-rule="null"');
    expect(whereFilterLab).toContain("KEEP ✓");
    expect(projectionLab).toContain('data-projection-mode="columns"');
    expect(projectionLab).toContain('data-projection-mode="alias"');
    expect(projectionLab).toContain('data-projection-mode="where"');
    expect(projectionLab).toContain("sqlCustomers");
    expect(projectionLab).toContain("sqlOrders");
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
    ].forEach((slug) => expect(noteList).not.toContain(`"${slug}":`));
  });

  it("keeps a focused lazy-loaded SQLite playground reusable across SQL topics", () => {
    expect(sqlPlayground).toContain("sqlLearningSeedSql");
    expect(sqlPlayground).toContain("inferredFocus");
    expect(sqlPlayground).toContain('data-sql-focus={focus}');
    expect(sqlPlayground).toContain('value: "duplicate"');
    expect(sqlPlayground).toContain('value: "foreign-key"');
    expect(sqlPlayground).toContain('value: "expression"');
    expect(sqlPlayground).toContain('value: "where-gte"');
    expect(sqlPlayground).toContain('value: "where-grouped"');
    expect(sqlPlayground).toContain('value: "where-null"');
    expect(sqlPlayground).toContain('value: "projection-columns"');
    expect(sqlPlayground).toContain('value: "projection-alias"');
    expect(sqlPlayground).toContain('value: "projection-expression"');
    expect(sqlPlayground).toContain("SELECT 1 AS execution_ok");
    expect(sqlPlayground).toContain("order_value BETWEEN 400 AND 600");
    expect(sqlPlayground).toContain("customer_id AS customer_key");
    expect(sqlPlayground).toContain("ROUND(order_value * 1.10, 2) AS scenario_value");
    expect(sqlPlayground).toContain("sql.js@1.14.1");
    expect(sqlPlayground).toContain("data-sql-result-summary");
  });

  it("does not expose course-facing, private identity or first-person labels", () => {
    Object.values(notes).forEach((note) => {
      expect(note).not.toMatch(/BUSINFO|Assignment|Submission|课程项目|课程作业/u);
      expect(note).not.toMatch(/Xintao Liu|刘鑫/u);
      expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
    });
  });
});