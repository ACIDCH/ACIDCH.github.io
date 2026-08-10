---
translationKey: sql-select
locale: zh
slug: sql-select
title: SELECT：从关系表中读取第一份结果集
summary: 从统一的 customers、orders、products 与 order_items 数据开始，理解 SELECT、星号、FROM、结果集和查询执行的基本含义，并通过浏览器 SQLite 运行不会修改数据的基础查询。
tags:
  - SELECT
  - 基本查询
  - 结果集
  - SQL 查询
topics:
  - 数据查询
  - 数据理解
  - SQL 基础
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 5
publishedAt: 2026-08-10
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-relationships
  - sql-where
---

## 从“数据怎样组织”进入“怎样读取数据”

前四篇解决关系数据库的结构问题：

```text
Relational Database
↓
Primary Key
↓
Foreign Key
↓
Relationship Cardinality
```

接下来开始真正向数据库提出查询。

最基本的形式是：

```sql
SELECT *
FROM customers;
```

它读取 `customers` 表中的数据，并返回一个结果集。

## SELECT * FROM customers 到底在说什么？

把查询拆开：

```sql
SELECT *
FROM customers;
```

可以读成：

```text
SELECT
→ 发起读取查询

*
→ 当前选择所有列

FROM
→ 指定数据来源

customers
→ 被读取的表
```

统一数据集中的 `customers` 是：

| customer_id | customer_name | email | phone | segment |
|---:|---|---|---|---|
| 1001 | North Retail | north@example.com | 021-440-810 | Retail |
| 1002 | Coast Foods | coast@example.com | 021-440-811 | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | 021-440-812 | Enterprise |

因此 `SELECT * FROM customers` 会返回当前三条客户记录与全部五列。

## 星号 * 表示什么？

在：

```sql
SELECT *
FROM customers;
```

中，`*` 表示当前数据源的所有列。

对于 `customers`：

```text
customer_id
customer_name
email
phone
segment
```

都会出现在结果中。

这一篇暂时不展开“只选择某几列”。那属于 SQL 07 Projection。

## 没有 WHERE 时会发生什么？

最基础查询没有筛选条件：

```sql
SELECT *
FROM orders;
```

所以逻辑上会读取当前 `orders` 中所有记录。

统一数据集有四张订单：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

因此未筛选的订单查询返回四行。

SQL 06 才会加入 `WHERE`，让结果只保留满足条件的行。

## 查询结果本身也是一个二维表

`SELECT` 返回的是 **Result Set（结果集）**。

它仍然可以表示成：

```text
rows × columns
```

例如：

```sql
SELECT *
FROM customers;
```

当前结果是：

```text
3 rows × 5 columns
```

而：

```sql
SELECT *
FROM orders;
```

当前结果是：

```text
4 rows × 4 columns
```

互动 SQL 运行器会直接显示这个维度摘要，让“结果集”不只是一个抽象定义。

后续 WHERE、Projection、GROUP BY 与 JOIN，本质上都在改变结果集的行、列、粒度或组合方式。

## SELECT 会修改原表吗？

普通 `SELECT` 是读取操作。

执行：

```sql
SELECT *
FROM customers;
```

不会因为查询本身而新增、删除或改写客户记录。

这与后面的数据修改语句不同：

```text
INSERT
UPDATE
DELETE
```

因此，面对一张陌生表时，SELECT 通常是最自然的探索入口。

## 先运行最基础的查询

下面的浏览器实验继续使用 SQL 01 展示过的同一 canonical dataset。

默认打开：

```sql
SELECT *
FROM customers
ORDER BY customer_id;
```

这里额外写 `ORDER BY customer_id`，只是为了让教学界面的行顺序稳定，方便逐项对照。

**没有 `ORDER BY` 时，不应该把数据库当前恰好返回的行顺序当成有保证的业务顺序。** 排序规则会在 SQL 08 单独讲解。

还可以切换到：

```sql
SELECT *
FROM orders
ORDER BY order_id;
```

```sql
SELECT *
FROM products
ORDER BY product_id;
```

```sql
SELECT *
FROM order_items
ORDER BY order_id, product_id;
```

观察不同表的记录粒度与结果维度。

<div data-learning-slot="sql-playground"></div>

## 查询前先记住记录粒度

SQL 01 已经建立一个核心问题：

```text
One row = ?
```

它在 SELECT 阶段仍然重要。

```sql
SELECT *
FROM customers;
```

可以理解为：

```text
One result row = one customer
```

而：

```sql
SELECT *
FROM order_items;
```

则是：

```text
One result row = one product line within one order
```

即使两条查询语法都很简单，结果的业务含义并不相同。

## SELECT 并不一定需要 FROM

`SELECT` 也可以直接计算表达式。

例如：

```sql
SELECT 100 + 200;
```

结果会返回：

```text
300
```

还可以运行：

```sql
SELECT 1 AS execution_ok;
```

它不需要读取业务表。

### SELECT 1 是“连接检查”吗？

在真实的 client/server 数据库应用中，`SELECT 1` 经常被用作很轻量的连接或 liveness 查询，因为如果客户端能够把 SQL 发给数据库并收到结果，至少说明这条查询链路能够工作。

但本系列浏览器实验使用的是当前页面内存中的 sql.js/SQLite，并不存在浏览器到远程数据库服务器的网络连接。

因此，这里的：

```sql
SELECT 1 AS execution_ok;
```

只验证：

```text
SQLite engine loaded
+
SQL statement executed
+
result returned
```

不能把它描述成“验证远程数据库网络连接”。

## 分号 ; 有什么作用？

SQL 示例统一写成：

```sql
SELECT *
FROM customers;
```

末尾：

```text
;
```

标记一条 SQL statement 结束。

某些客户端在只执行单条语句时可以接受省略分号，但脚本、多语句输入和跨工具复制时，明确分号能让语句边界更清楚。

## SQL 关键字为什么经常写成大写？

下面两种写法在许多数据库中都能被解析：

```sql
select * from customers;
```

```sql
SELECT * FROM customers;
```

本系列统一使用第二种风格，让：

```text
SELECT
FROM
WHERE
ORDER BY
GROUP BY
JOIN
```

与字段名、表名形成视觉区分。

这是一种书写规范，不是查询逻辑本身。

## SELECT * 适合什么时候使用？

在教学、小型表和第一次检查数据时：

```sql
SELECT *
FROM customers;
```

非常直观，可以快速观察：

- 有哪些列；
- 有哪些记录；
- 值的大致格式；
- 主键字段；
- 是否存在 NULL；
- 一行代表什么。

但真实生产表可能有几十甚至上百列。长期把 `SELECT *` 写进分析管道可能带来：

- 读取不需要的列；
- schema 新增列后结果结构意外变化；
- 网络和内存传输增加；
- 下游代码对列顺序或列集合产生隐式依赖。

因此 `SELECT *` 是很好的学习起点，但不是所有生产查询的默认最佳实践。

SQL 07 会进入明确列选择与别名。

## 一份新表可以先这样读

面对第一次看到的表，可以先运行基础 SELECT，然后检查：

1. **结果有多少 rows × columns？**
2. **一行代表什么？**
3. **字段名称与数据类型是否符合预期？**
4. **主键在哪里？**
5. **是否出现 NULL？**
6. **哪些字段可能用于 WHERE？**
7. **哪些字段可能用于 JOIN？**
8. **当前行顺序有没有明确 ORDER BY 保证？**

这让 `SELECT *` 不只是“把表打印出来”，而成为数据理解入口。

## 常见错误

### 忘记 FROM 后面的表名

```sql
SELECT * FROM;
```

数据库不知道应该读取哪张表。

### 表名写错

数据库中是：

```text
customers
```

却查询：

```sql
SELECT *
FROM customer;
```

通常会得到表不存在之类的错误。

### 把 Result Set 误认为永久新表

普通查询返回结果集，不会因为屏幕上显示了结果就自动创建永久表。

### 认为 SELECT * 的行顺序天然稳定

没有 `ORDER BY` 时，不应依赖当前返回顺序。

### 只看数字，不看粒度

customers、orders 与 order_items 都可以 `SELECT *`，但一行代表完全不同的业务对象。

### 在本地 sql.js 中把 SELECT 1 误解成网络连接测试

当前实验没有远程数据库网络链路。它只是一个 SQL engine execution check。

## 本篇的核心判断

基础 SELECT 可以压缩成：

```text
SELECT
→ 发起读取并定义结果表达式

*
→ 当前返回全部列

FROM
→ 指定数据来源

Result Set
→ 查询返回的 rows × columns
```

看到：

```sql
SELECT *
FROM customers;
```

应该能够准确解释：

- 从哪里读取；
- 返回哪些列；
- 当前有多少行；
- 一行代表什么；
- 是否会修改原表；
- 当前顺序是否有 ORDER BY 保证。

## 下一步：只保留满足条件的记录

基础 SELECT 会读取整张表。

真实分析通常会继续提出：

```text
只看 Retail 客户？
只看金额超过 500 的订单？
只看某个日期范围？
同时满足多个条件？
```

SQL 06 将进入：

```text
WHERE
```

也就是条件查询。
