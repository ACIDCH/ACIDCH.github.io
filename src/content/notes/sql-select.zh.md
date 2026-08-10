---
translationKey: sql-select
locale: zh
slug: sql-select
title: SELECT：从关系表中读取第一份结果集
summary: 从 customers 与 orders 表开始，理解 SELECT、星号、FROM 与结果集的基本含义，并通过浏览器 SQLite 运行第一组不会修改数据的查询。
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
---

## 从“数据怎样组织”进入“怎样读取数据”

前四篇解决的是关系数据库的结构问题：

```text
Table / Record / Granularity
↓
Primary Key
↓
Foreign Key
↓
Relationship Cardinality
```

接下来开始真正向数据库提出问题。

最基本的查询形式是：

```sql
SELECT *
FROM customers;
```

这条语句的目标非常直接：读取 `customers` 表中的数据，并把查询结果返回出来。

SQL 查询从这里开始。

## SELECT * FROM customers 到底在说什么？

把最基本的查询拆开看：

```sql
SELECT *
FROM customers;
```

其中：

```text
SELECT
→ 执行查询

*
→ 返回所有列

FROM
→ 指定数据来自哪张表

customers
→ 被查询的表
```

可以把它读成一句自然语言：

> 从 `customers` 表中读取所有列。

如果当前表中有三条客户记录：

| customer_id | customer_name | email | segment |
|---:|---|---|---|
| 1001 | North Retail | north@example.com | Retail |
| 1002 | Coast Foods | coast@example.com | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | Enterprise |

那么最基本的 `SELECT * FROM customers` 会返回这些记录以及表中的全部列。

## 星号 * 表示什么？

在：

```sql
SELECT *
FROM customers;
```

中，`*` 表示：

```text
all columns
```

也就是当前结果集保留这张表的全部字段。

如果 `customers` 有：

```text
customer_id
customer_name
email
segment
```

那么 `SELECT *` 会把这些列全部返回。

此时还没有讨论“只选择其中几列”。那属于后面的 Projection（投影查询）。这一篇只先建立最基本的查询结构。

## 没有 WHERE 时会发生什么？

最基础的：

```sql
SELECT *
FROM customers;
```

没有任何筛选条件。

因此，从逻辑上看，它会读取当前表中的所有记录。

如果 `orders` 中有四张订单：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

执行：

```sql
SELECT *
FROM orders;
```

会返回当前 `orders` 表中的全部记录。

下一篇才会加入 `WHERE`，让结果只保留满足条件的行。

## 查询结果本身也是一个二维表

`SELECT` 返回的不是一句文本说明，而是一个 **Result Set（结果集）**。

结果集同样可以看作二维结构：

```text
columns
+
rows
```

例如：

```sql
SELECT *
FROM customers;
```

结果仍然具有列名：

```text
customer_id
customer_name
email
segment
```

以及对应的多条记录。

因此，理解 SQL 查询时可以始终保留一个基本视角：

```text
输入：一张或多张关系表
↓
SQL query
↓
输出：一个结果集
```

后面的筛选、投影、排序、聚合与连接，本质上都在改变这个结果集的行、列、顺序或粒度。

## SELECT 会修改原表吗？

普通 `SELECT` 是读取操作。

执行：

```sql
SELECT *
FROM customers;
```

不会因为查询本身而把客户删除、改名或新增记录。

它只是读取当前数据库状态，并返回结果集。

这和后续的：

```text
INSERT
UPDATE
DELETE
```

不同。

因此，在开始探索一份新数据时，`SELECT` 通常是最自然的第一步。

## 先运行最基础的查询

下面的浏览器实验继续使用同一组 synthetic Business Analytics 数据。

默认示例会打开：

```sql
SELECT *
FROM customers
ORDER BY customer_id;
```

其中 `ORDER BY` 只是为了让演示结果稳定地按 ID 展示，排序本身会在后面的独立笔记中详细解释。

可以先直接运行，再把查询修改成：

```sql
SELECT *
FROM orders;
```

观察结果集从“客户粒度”切换成“订单粒度”。

<div data-learning-slot="sql-playground"></div>

## 查询前先记住记录粒度

SQL 01 已经建立过一个重要习惯：

```text
One row = ?
```

这个问题在查询阶段同样重要。

例如：

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
FROM orders;
```

则是：

```text
One result row = one order
```

即使两条查询都使用 `SELECT *`，结果集的业务含义也完全不同。

因此，看到 SQL 查询结果以后，不应该只检查“有多少行”，还要先确认“一行代表什么”。

## SELECT 并不一定需要 FROM

`SELECT` 也可以直接计算表达式。

例如：

```sql
SELECT 100 + 200;
```

结果会返回表达式计算值。

另一个常见的小查询是：

```sql
SELECT 1;
```

它不需要读取业务表。

这种简单语句经常适合用来确认数据库连接和查询执行链路是否可以正常响应。

在上面的 SQLite 实验中，可以选择：

```text
SELECT 1 连接检查
```

直接观察这一类不依赖表数据的结果集。

## 分号 ; 有什么作用？

SQL 示例通常写成：

```sql
SELECT *
FROM customers;
```

末尾的：

```text
;
```

表示一条 SQL 语句结束。

不同客户端对单条语句是否强制要求分号可能有所不同，但在学习、脚本和需要连续执行多条语句时，明确写出分号能让语句边界更清楚。

因此，这套 Learning Notes 的 SQL 示例默认保留分号。

## SQL 关键字为什么经常写成大写？

常见写法是：

```sql
SELECT *
FROM customers;
```

而不是：

```sql
select *
from customers;
```

对许多 SQL 数据库而言，关键字本身通常不依赖这种大小写风格才能执行。

使用大写主要是为了让结构更容易扫描：

```text
SELECT
FROM
WHERE
ORDER BY
GROUP BY
JOIN
```

与表名、字段名形成视觉区分。

因此，本系列统一采用关键字大写的书写方式。

## SELECT * 适合什么时候使用？

在刚接触一张小型表、教学数据或快速查看结构时：

```sql
SELECT *
FROM customers;
```

非常直观。

它能快速回答：

```text
有哪些列？
有哪些记录？
字段值大概是什么样？
一行代表什么？
```

但随着真实表变宽、字段增多，分析任务通常不会永远需要所有列。

因此，`SELECT *` 是理解基本查询的很好起点，但不是后续所有查询都必须保留的固定写法。

SQL 07 会专门进入列选择和别名，也就是 Projection。

## 一份新表可以先这样读

面对第一次看到的数据表，可以先执行：

```sql
SELECT *
FROM customers;
```

然后检查：

1. **结果有多少列？**
2. **字段名称是否与预期一致？**
3. **一行代表什么业务对象？**
4. **主键字段在哪里？**
5. **是否出现 NULL？**
6. **哪些字段未来可能用于筛选、排序或连接？**

这让 `SELECT *` 不只是“把表打印出来”，而成为理解新数据结构的第一步。

## 常见错误

### 忘记 FROM 后面的表名

例如：

```sql
SELECT * FROM;
```

数据库不知道应该从哪张表读取数据。

### 表名写错

如果数据库中只有：

```text
customers
```

却查询：

```sql
SELECT *
FROM customer;
```

就可能得到“表不存在”之类的错误。

### 把 SELECT 结果误认为新表已经保存

普通查询返回的是结果集，并不会因为结果显示在屏幕上就自动创建一张永久新表。

### 只看数值，不看粒度

客户表和订单表都可以被 `SELECT *` 查询，但它们的一行代表完全不同的业务对象。

## 本篇的核心判断

最基础的查询可以压缩成：

```text
SELECT
→ 要读取什么

*
→ 当前先返回所有列

FROM
→ 数据来自哪里

Result Set
→ 查询返回的二维结果
```

最先需要掌握的不是复杂语法，而是看到：

```sql
SELECT *
FROM customers;
```

时能够准确解释它从哪里读取数据、返回什么结构，以及结果中的一行代表什么。

## 下一步：只保留满足条件的记录

`SELECT * FROM customers` 会返回当前表中的全部记录。

真实分析通常会进一步提出：

```text
只看 Retail 客户怎么办？
只看金额超过 500 的订单怎么办？
同时满足多个条件怎么办？
```

下一篇 SQL 06 将进入：

```text
WHERE
```

也就是条件查询。
