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
  "src/components/learning/PrimaryKeyLab.astro",
  "src/components/learning/ForeignKeyLab.astro",
  "src/components/learning/RelationshipCardinalityLab.astro",
  "src/components/learning/SqlDatasetExplorer.astro",
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

    expect(primary).toContain("AUTO_INCREMENT` 是 MySQL 方言");
    expect(primary).toContain("SQLite 的 INTEGER PRIMARY KEY 有什么特殊之处");
    expect(foreign).toContain("PRAGMA foreign_keys = ON");
    expect(foreign).toContain("ADD CONSTRAINT fk_orders_customer");
    expect(foreign).toContain("SQLite 的 `ALTER TABLE` 支持范围比 MySQL/PostgreSQL 受限");
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

  it("makes interactive visuals read from canonical data instead of private copies", () => {
    const primaryLab = read("src/components/learning/PrimaryKeyLab.astro");
    const relationshipLab = read(
      "src/components/learning/RelationshipCardinalityLab.astro",
    );
    const datasetExplorer = read("src/components/learning/SqlDatasetExplorer.astro");
    const playground = read("src/components/learning/SqlPlayground.astro");

    [primaryLab, relationshipLab, datasetExplorer, playground].forEach((source) => {
      expect(source).toContain("sql-learning");
    });
    expect(playground).toContain("sqlLearningSeedSql");
    expect(playground).toContain("rows × ${result.columns.length} columns");
    expect(playground).toContain("inferredFocus");
    expect(relationshipLab).toContain("customerOrders.length");
  });
});
