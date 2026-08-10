import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { learningSeries } from "../src/data/learning-series";
import {
  sqlCustomerProfiles,
  sqlCustomers,
  sqlLearningSeedSql,
  sqlOrderItems,
  sqlOrders,
  sqlOrderTotal,
  sqlProducts,
} from "../src/data/sql-learning";

const read = (path: string) => readFileSync(path, "utf8");
const sqlSources = [
  "src/content/notes/sql-relational-data.zh.md",
  "src/content/notes/sql-primary-key.zh.md",
  "src/content/notes/sql-foreign-key.zh.md",
  "src/content/notes/sql-relationships.zh.md",
  "src/content/notes/sql-select.zh.md",
  "src/content/notes/sql-where.zh.md",
  "src/content/notes/sql-projection.zh.md",
  "src/content/notes/sql-order-by.zh.md",
  "src/components/learning/RelationalModelExplorer.astro",
  "src/components/learning/PrimaryKeyLab.astro",
  "src/components/learning/ForeignKeyLab.astro",
  "src/components/learning/RelationshipCardinalityLab.astro",
  "src/components/learning/SqlDatasetExplorer.astro",
  "src/components/learning/WhereFilterLab.astro",
  "src/components/learning/ProjectionColumnsLab.astro",
  "src/components/learning/OrderByLab.astro",
  "src/components/learning/SqlPlayground.astro",
].map(read);

describe("SQL Learning Notes integrity contract", () => {
  it("keeps canonical primary keys unique", () => {
    const assertUnique = (values: Array<string | number>) => {
      expect(new Set(values).size).toBe(values.length);
    };

    assertUnique(sqlCustomers.map((row) => row.customer_id));
    assertUnique(sqlOrders.map((row) => row.order_id));
    assertUnique(sqlProducts.map((row) => row.product_id));
    assertUnique(sqlCustomerProfiles.map((row) => row.customer_id));
    assertUnique(sqlOrderItems.map((row) => `${row.order_id}:${row.product_id}`));
  });

  it("keeps every canonical foreign-key reference valid", () => {
    const customerIds = new Set(sqlCustomers.map((row) => row.customer_id));
    const orderIds = new Set(sqlOrders.map((row) => row.order_id));
    const productIds = new Set(sqlProducts.map((row) => row.product_id));

    sqlOrders.forEach((order) => expect(customerIds.has(order.customer_id)).toBe(true));
    sqlOrderItems.forEach((item) => {
      expect(orderIds.has(item.order_id)).toBe(true);
      expect(productIds.has(item.product_id)).toBe(true);
    });
    sqlCustomerProfiles.forEach((profile) => {
      expect(customerIds.has(profile.customer_id)).toBe(true);
    });
  });

  it("reconciles order headers to line-item values exactly", () => {
    sqlOrders.forEach((order) => {
      const detailTotal = sqlOrderItems
        .filter((item) => item.order_id === order.order_id)
        .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      expect(detailTotal).toBe(order.order_value);
    });
    expect(sqlOrderTotal).toBe(1875);
  });

  it("keeps the SQLite seed aligned with the canonical tables", () => {
    [
      "CREATE TABLE customers",
      "CREATE TABLE orders",
      "CREATE TABLE products",
      "CREATE TABLE order_items",
      "CREATE TABLE customer_profiles",
      "PRAGMA foreign_keys = ON",
      "(50001, 301, 2, 150.00)",
      "(50004, 305, 3, 170.00)",
    ].forEach((marker) => expect(sqlLearningSeedSql).toContain(marker));
  });

  it("prevents stale fictional IDs from drifting into the SQL teaching system", () => {
    sqlSources.forEach((source) => expect(source).not.toContain("50008"));
  });

  it("keeps the data-model visual on canonical SQL entities only", () => {
    const explorer = read("src/components/learning/RelationalModelExplorer.astro");
    ["Customers", "Orders", "Order Items", "Products", "Customer Profiles"].forEach(
      (entity) => expect(explorer).toContain(entity),
    );
    ["Shipments", "Warehouses", "Categories"].forEach((inventedEntity) => {
      expect(explorer).not.toContain(inventedEntity);
    });
  });

  it("locks the SQL roadmap to the complete 20-note sequence", () => {
    const sql = learningSeries.find((series) => series.slug === "sql");
    expect(sql).toBeDefined();
    expect(sql?.modules).toHaveLength(20);
    expect(sql?.modules.map((module) => module.code)).toEqual(
      Array.from({ length: 20 }, (_, index) => `SQL ${String(index + 1).padStart(2, "0")}`),
    );
    expect(sql?.modules.map((module) => module.title)).toEqual([
      "Relational Database",
      "Primary Key",
      "Foreign Key",
      "One-to-Many / Many-to-Many / One-to-One",
      "SELECT",
      "WHERE",
      "Projection",
      "ORDER BY",
      "Pagination",
      "Aggregation",
      "GROUP BY",
      "JOIN",
      "Subquery",
      "INSERT",
      "UPDATE",
      "DELETE",
      "Index",
      "Transaction",
      "Isolation",
      "Analytics SQL Case Study",
    ]);
  });

  it("restores the missing relational-database foundation topics", () => {
    const overview = read("src/content/notes/sql-relational-data.zh.md");
    [
      "## 为什么需要数据库？",
      "### 层次模型 Hierarchical Model",
      "### 网状模型 Network Model",
      "### 关系模型 Relational Model",
      "DECIMAL(p,s)",
      "## SQL 是什么？",
      "### DDL — Data Definition Language",
      "### DML — Data Manipulation Language",
      "### DQL — Data Query Language",
      "## 标准 SQL 和数据库方言不要混淆",
      "## 常见关系数据库有哪些？",
      'data-learning-slot="relational-model-explorer"',
      'data-learning-slot="sql-dataset-explorer"',
    ].forEach((marker) => expect(overview).toContain(marker));
  });

  it("documents database-specific behavior instead of presenting one dialect as universal", () => {
    const primary = read("src/content/notes/sql-primary-key.zh.md");
    const foreign = read("src/content/notes/sql-foreign-key.zh.md");
    const where = read("src/content/notes/sql-where.zh.md");
    const orderBy = read("src/content/notes/sql-order-by.zh.md");

    expect(primary).toContain("AUTO_INCREMENT` 是 MySQL 方言");
    expect(primary).toContain("SQLite 的 INTEGER PRIMARY KEY 有什么特殊之处");
    expect(foreign).toContain("PRAGMA foreign_keys = ON");
    expect(foreign).toContain("ADD CONSTRAINT fk_orders_customer");
    expect(foreign).toContain("SQLite 的 `ALTER TABLE` 支持范围比 MySQL/PostgreSQL 受限");
    expect(where).toContain("标准 SQL 常用");
    expect(where).toContain("`LIKE` 的大小写行为、字符排序与 collation 规则会随数据库与配置变化");
    expect(orderBy).toContain("不同数据库对默认 NULL 排序位置并不完全一致");
    expect(orderBy).toContain("SQLite / MySQL");
    expect(orderBy).toContain("PostgreSQL");
    expect(orderBy).toContain("NULLS FIRST");
    expect(orderBy).toContain("NULLS LAST");
  });

  it("keeps SELECT semantics explicit and appropriate for the local sql.js environment", () => {
    const select = read("src/content/notes/sql-select.zh.md");
    expect(select).toContain("3 rows × 5 columns");
    expect(select).toContain("4 rows × 4 columns");
    expect(select).toContain("SELECT 100 + 200;");
    expect(select).toContain("SELECT 1 AS execution_ok;");
    expect(select).toContain("没有 `ORDER BY` 时");
    expect(select).toContain("并不存在浏览器到远程数据库服务器的网络连接");
  });

  it("keeps WHERE examples numerically aligned with the canonical orders", () => {
    expect(
      sqlOrders.filter((order) => order.order_value >= 500).map((order) => order.order_id),
    ).toEqual([50003, 50004]);
    expect(
      sqlOrders
        .filter((order) => order.order_value >= 400 && order.customer_id !== 1002)
        .map((order) => order.order_id),
    ).toEqual([50001, 50004]);
    expect(
      sqlOrders
        .filter((order) => order.customer_id === 1001 || order.order_value >= 700)
        .map((order) => order.order_id),
    ).toEqual([50001, 50002, 50003]);
    expect(
      sqlOrders
        .filter(
          (order) =>
            (order.customer_id === 1001 || order.order_value >= 500) &&
            order.customer_id === 1003,
        )
        .map((order) => order.order_id),
    ).toEqual([50004]);
    expect(
      sqlOrders
        .filter((order) => order.order_value >= 400 && order.order_value <= 600)
        .map((order) => order.order_id),
    ).toEqual([50001, 50004]);
    expect(
      sqlCustomers
        .filter((customer) => ["Retail", "Enterprise"].includes(customer.segment))
        .map((customer) => customer.customer_id),
    ).toEqual([1001, 1003]);
    expect(
      sqlCustomers
        .filter((customer) => customer.customer_name.startsWith("Coast"))
        .map((customer) => customer.customer_id),
    ).toEqual([1002]);
    expect(sqlCustomers.filter((customer) => customer.phone == null)).toEqual([]);
  });

  it("keeps Projection examples aligned with canonical rows and result shapes", () => {
    const customerProjection = sqlCustomers.map(({ customer_id, customer_name, segment }) => ({
      customer_id,
      customer_name,
      segment,
    }));
    expect(customerProjection).toEqual([
      { customer_id: 1001, customer_name: "North Retail", segment: "Retail" },
      { customer_id: 1002, customer_name: "Coast Foods", segment: "Wholesale" },
      { customer_id: 1003, customer_name: "Alpine Labs", segment: "Enterprise" },
    ]);

    expect(
      sqlOrders
        .filter((order) => order.order_value >= 500)
        .map((order) => [order.order_id, order.customer_id, order.order_value]),
    ).toEqual([
      [50003, 1002, 760],
      [50004, 1003, 510],
    ]);

    expect(sqlOrders.map((order) => Number((order.order_value * 1.1).toFixed(2)))).toEqual([
      462,
      203.5,
      836,
      561,
    ]);
  });

  it("keeps ORDER BY examples aligned with canonical row order", () => {
    expect(
      [...sqlOrders].sort((a, b) => a.order_value - b.order_value).map((row) => row.order_id),
    ).toEqual([50002, 50001, 50004, 50003]);
    expect(
      [...sqlOrders].sort((a, b) => b.order_value - a.order_value).map((row) => row.order_id),
    ).toEqual([50003, 50004, 50001, 50002]);
    expect(
      [...sqlOrders]
        .sort(
          (a, b) => a.customer_id - b.customer_id || b.order_date.localeCompare(a.order_date),
        )
        .map((row) => row.order_id),
    ).toEqual([50002, 50001, 50003, 50004]);
  });

  it("makes interactive visuals read from canonical data instead of private copies", () => {
    const primaryLab = read("src/components/learning/PrimaryKeyLab.astro");
    const relationshipLab = read(
      "src/components/learning/RelationshipCardinalityLab.astro",
    );
    const datasetExplorer = read("src/components/learning/SqlDatasetExplorer.astro");
    const whereFilterLab = read("src/components/learning/WhereFilterLab.astro");
    const projectionLab = read("src/components/learning/ProjectionColumnsLab.astro");
    const orderByLab = read("src/components/learning/OrderByLab.astro");
    const playground = read("src/components/learning/SqlPlayground.astro");

    [
      primaryLab,
      relationshipLab,
      datasetExplorer,
      whereFilterLab,
      projectionLab,
      orderByLab,
      playground,
    ].forEach((source) => {
      expect(source).toContain("sql-learning");
    });
    expect(playground).toContain("sqlLearningSeedSql");
    expect(playground).toContain("rows × ${result.columns.length} columns");
    expect(playground).toContain("inferredFocus");
    expect(playground).toContain('"where-gte"');
    expect(playground).toContain('"projection-columns"');
    expect(relationshipLab).toContain("customerOrders.length");
    expect(whereFilterLab).toContain("order_value >= 500");
    expect(whereFilterLab).toContain("segment IN ('Retail', 'Enterprise')");
    expect(projectionLab).toContain("customer_id AS customer_key");
    expect(projectionLab).toContain("WHERE order_value >= 500");
    expect(orderByLab).toContain("sqlLearningSeedSql");
    expect(orderByLab).toContain("ORDER BY order_value DESC, order_id ASC");
  });
});
