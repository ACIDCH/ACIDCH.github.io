---
translationKey: sql-projection
locale: zh
slug: sql-projection
title: Projection：只返回分析真正需要的列
summary: 从统一 customers 与 orders 数据出发，理解 Projection 如何选择、重排列并重命名结果集字段，以及它与 WHERE、原表 schema、表达式列和下游分析接口之间的关系。
tags:
  - Projection
  - SELECT
  - 列别名
  - 结果集
topics:
  - 数据查询
  - 数据理解
  - SQL 基础
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 7
publishedAt: 2026-08-10
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-where
---

## 从筛选行进入选择列

SQL 06 的 `WHERE` 回答的是：

```text
哪些记录应该进入结果集？
```

例如：

```sql
SELECT *
FROM orders
WHERE order_value >= 500;
```

会从四张订单中保留两行。

但结果仍然包含 `orders` 的全部四列。真实分析经常还需要回答另一个问题：

```text
结果里到底需要哪些字段？
```

这就是 Projection（投影查询）解决的问题。

最基本的结构是：

```sql
SELECT column_1, column_2, column_3
FROM table_name;
```

与 `SELECT *` 相比，Projection 明确声明结果集需要哪些列。

## Projection 改变的是结果集的列

统一数据集中的 `customers` 有五列：

```text
customer_id
customer_name
email
phone
segment
```

基础查询：

```sql
SELECT *
FROM customers;
```

返回：

```text
3 rows × 5 columns
```

如果分析只需要客户标识、名称与细分：

```sql
SELECT customer_id, customer_name, segment
FROM customers;
```

结果变成：

```text
3 rows × 3 columns
```

三条客户记录仍然存在，只是结果集不再返回 `email` 与 `phone`。

因此可以把 SQL 06 与 SQL 07 的差别记成：

```text
WHERE       → 选择行
Projection  → 选择列
```

<div data-learning-slot="projection-columns-lab"></div>

## 不返回某列不等于删除某列

Projection 只影响当前查询结果。

执行：

```sql
SELECT customer_id, customer_name
FROM customers;
```

不会修改 `customers` 的 schema，也不会删除 `email`、`phone` 或 `segment`。

下一条查询仍然可以写：

```sql
SELECT *
FROM customers;
```

并再次得到全部五列。

这和 `ALTER TABLE` 一类结构修改操作完全不同。

## 结果列的顺序由 SELECT 列表决定

Projection 不要求沿用原表列顺序。

例如：

```sql
SELECT segment, customer_name, customer_id
FROM customers;
```

结果列会按下面的顺序出现：

```text
segment
customer_name
customer_id
```

而不是原表中的顺序。

这意味着 `SELECT` 列表本身就是一个结果接口定义：不仅决定“有哪些列”，也决定“这些列以什么顺序出现”。

## 列别名改变结果集字段名

有时数据库字段名适合存储，却不适合报表或数据接口。

例如：

```sql
SELECT
  customer_id AS customer_key,
  customer_name AS customer,
  segment AS customer_segment
FROM customers;
```

结果列名会变成：

```text
customer_key
customer
customer_segment
```

但原表字段依然叫：

```text
customer_id
customer_name
segment
```

列别名只属于当前结果集。

## AS 为什么值得保留

很多数据库允许省略 `AS`：

```sql
SELECT customer_id customer_key
FROM customers;
```

也可以显式写成：

```sql
SELECT customer_id AS customer_key
FROM customers;
```

两者在常见数据库中通常都能工作。

本系列优先使用 `AS`，原因不是语法必须，而是可读性：

```text
原字段  AS  输出字段
```

在长查询中更容易区分列名、表达式和别名。

## Projection 可以和 WHERE 组合

行筛选与列选择可以同时出现。

例如，只返回金额至少为 500 的订单，并且只保留分析需要的三列：

```sql
SELECT
  order_id,
  customer_id,
  order_value AS value
FROM orders
WHERE order_value >= 500;
```

当前 canonical dataset 返回：

| order_id | customer_id | value |
|---:|---:|---:|
| 50003 | 1002 | 760.00 |
| 50004 | 1003 | 510.00 |

结果是：

```text
2 rows × 3 columns
```

可以分两步理解：

```text
WHERE
4 rows → 2 rows

Projection
4 columns → 3 columns
```

行与列是两个独立维度。

## 表达式也可以成为结果列

Projection 不只能返回原始字段，也可以返回基于当前行计算出的表达式。

例如建立一个简单的情景值：

```sql
SELECT
  order_id,
  order_value,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders;
```

这里：

```text
order_id
order_value
```

来自原表，而：

```text
scenario_value
```

是查询运行时生成的结果列。

它不会被写回 `orders`。

这类表达式列在 Business Analytics 中很常见，例如：

```text
情景价格
折算金额
单位成本
比例指标
日期派生字段
```

只要没有使用聚合、分组或其他会改变行结构的操作，当前这种逐行表达式仍然保持一条输入记录对应一条结果记录。

## 别名应该表达业务语义

技术上可以写：

```sql
SELECT order_value AS x
FROM orders;
```

但 `x` 几乎没有分析语义。

更容易维护的名称是：

```sql
SELECT order_value AS order_value_current
FROM orders;
```

或在情景计算中：

```sql
SELECT ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders;
```

好的别名应该让下游使用者不必重新阅读整条 SQL 才知道该列代表什么。

## 重复或模糊的输出列名会制造风险

某些数据库允许结果集中出现重复列名，例如：

```sql
SELECT
  customer_id AS id,
  customer_name AS id
FROM customers;
```

即使数据库能够返回结果，下游程序、CSV 导出、DataFrame 或可视化工具也很难可靠地区分两个 `id`。

因此应避免：

```text
重复别名
过度缩写
没有业务语义的临时名称
```

结果集本身也是数据接口，列名应保持清晰且稳定。

## SELECT 星号为什么不适合作为长期接口

`SELECT *` 对探索新表非常方便，但在稳定分析流程中存在几个风险：

1. 表以后新增字段，结果集会自动变宽；
2. 下游程序可能收到原本没有预期的新列；
3. 不必要字段增加结果集宽度；
4. 代码无法直接表达“哪些字段才是业务需要”。

因此：

```text
探索阶段
SELECT * 很方便

稳定分析或数据接口
显式列列表更可靠
```

这不是说 `SELECT *` 错误，而是使用场景不同。

## Projection 不负责排序

下面的查询：

```sql
SELECT customer_name, segment
FROM customers;
```

只定义返回哪些列，并没有承诺结果行的顺序。

即使当前看到的结果似乎总是按某个顺序出现，也不能把这种观察当成查询保证。

要明确控制结果顺序，需要下一篇的：

```sql
ORDER BY
```

因此：

```text
Projection → 列
WHERE      → 行
ORDER BY   → 顺序
```

三者解决的是不同问题。

## 在浏览器里实际运行 Projection

下面的 SQLite 实验只保留 SQL 07 相关预设：

- 三列 Projection；
- 重排列顺序；
- 使用 `AS` 重命名；
- Projection + WHERE；
- 表达式派生列。

所有查询仍然运行在同一份 canonical dataset 上。

<div data-learning-slot="sql-playground"></div>

## Business Analytics 中 Projection 是结果接口设计

在分析工作中，Projection 通常不是为了“少写几个字段”，而是在定义一个可消费的数据结果。

例如向一个报表提供订单明细时，可能只需要：

```sql
SELECT
  order_id,
  order_date,
  order_value
FROM orders;
```

而不需要把所有内部字段都暴露给下游。

显式列选择可以帮助：

```text
明确数据契约
减少无关字段
稳定字段顺序
统一业务命名
降低下游耦合
```

## 常见错误

### 1. 把 Projection 理解成修改表结构

错误理解：

```text
SELECT 不返回 email
→ email 被删除
```

正确理解：

```text
email 仍然存在于原表
当前结果集只是没有选择它
```

### 2. 以为结果列必须沿用原表顺序

错误。

结果列顺序由 `SELECT` 列表决定。

### 3. 以为别名会永久修改数据库字段名

错误。

`AS` 只改变当前结果集的列名。

### 4. 使用没有语义的别名

例如：

```sql
AS a
AS b
AS x1
```

短查询可能还能理解，进入长期报表或数据管道后会明显增加维护成本。

### 5. 用 Projection 期待结果自动排序

Projection 不定义行顺序。

排序属于 `ORDER BY`。

## Projection 可以按这个顺序检查

执行一条投影查询前，可以依次确认：

```text
1. 结果需要哪些业务字段？
2. 是否真的需要 SELECT *？
3. 列顺序是否符合下游消费方式？
4. 原字段名是否需要更清晰的输出别名？
5. 是否出现重复或含糊的结果列名？
6. WHERE 是否已经正确决定需要哪些行？
7. 是否错误地把 Projection 当成排序或 schema 修改？
```

## 本篇的核心判断

Projection 的核心不是“隐藏几列”，而是：

> **显式定义查询结果要暴露哪些字段、以什么顺序出现、用什么名称被下游理解。**

`WHERE` 负责缩小记录集合；Projection 负责塑造结果的列结构。

## 下一步控制结果的行顺序

SQL 08 将进入：

```text
ORDER BY
```

下一步需要回答：

> 当结果已经选好行和列后，怎样明确控制记录的排序规则？
