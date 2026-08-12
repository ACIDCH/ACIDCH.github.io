---
translationKey: sql-projection
locale: zh
slug: sql-projection
title: 列选择与表达式
summary: 查询不一定要把整张表原样搬出来。这里从选择几列开始，再加入别名和计算表达式，把结果整理成真正适合分析和报表使用的结构。
tags:
  - Projection
  - SELECT
  - 列别名
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
order: 7
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-where
  - sql-order-by
---

## 从筛选行进入选择列

WHERE 决定哪些行留下，接下来要解决的是另一件事：结果里到底需要哪些列。

例如客户表有：

```text
customer_id
customer_name
email
phone
segment
```

如果报表只需要客户 ID、名称和 segment，就没有必要把邮箱和电话一起返回。

```sql
SELECT
  customer_id,
  customer_name,
  segment
FROM customers;
```

这就是 SQL 里的 projection：控制结果集的列结构。

<div data-learning-slot="projection-columns-lab"></div>

## Projection 改变的是结果集的列

原表有 5 列，并不代表每次查询都必须返回 5 列。

下面这条查询：

```sql
SELECT
  order_id,
  order_value
FROM orders;
```

只返回：

| order_id | order_value |
| -------: | ----------: |
|    50001 |      420.00 |
|    50002 |      185.00 |
|    50003 |      760.00 |
|    50004 |      510.00 |

订单表本身没有被修改，只是这次查询选择了两列。

Projection 可以先理解成：**从原始表结构里挑出当前任务真正需要的字段。**

## 不返回某列不等于删除某列

下面的查询不包含 `email`：

```sql
SELECT
  customer_id,
  customer_name
FROM customers;
```

但 `email` 仍然留在原表里。

这是读取和修改的区别。SELECT 只定义结果集，不会把没有选中的列从数据库结构里删掉。

真正删除字段属于 DDL 操作，需要类似 `ALTER TABLE`，风险和语义完全不同。

## 结果列的顺序由 SELECT 列表决定

原表字段顺序不重要，只要查询明确写出需要的顺序：

```sql
SELECT
  segment,
  customer_name,
  customer_id
FROM customers;
```

结果就会按：

```text
segment
customer_name
customer_id
```

返回。

这在导出文件、API 或报表中很有用，因为输出结构可以和原始表不同。

不过长期接口最好把列顺序当成明确契约，而不是依赖 `SELECT *` 当前刚好返回什么。

## 列别名改变结果集字段名

数据库字段名不一定适合直接展示。

例如：

```sql
SELECT
  customer_id AS customer_key,
  customer_name AS name
FROM customers;
```

结果列名会变成：

```text
customer_key
name
```

原表里的列名仍然是 `customer_id` 和 `customer_name`。

Alias 只改变这次结果集里的显示名或引用名，不会重命名数据库字段。

对计算列来说，别名尤其重要，否则结果可能只有一段难读的表达式当列名。

## Projection 可以和 WHERE 组合

选择列和筛选行是两件独立的事，所以可以一起使用：

```sql
SELECT
  order_id,
  order_value
FROM orders
WHERE order_value >= 500;
```

结果只保留金额至少 500 的订单，同时只显示两列。

可以把逻辑分成：

```text
WHERE
→ 哪些行留下

SELECT
→ 留下的行要显示哪些列
```

虽然 SQL 写法是 SELECT 在前，理解查询时不必把所有语句当成从左到右的一次性处理。

## 表达式也可以成为结果列

SELECT 列表不只能写原始字段，还可以写计算。

例如假设需要看一个 10% 上调情景：

```sql
SELECT
  order_id,
  order_value,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders;
```

`scenario_value` 没有存进 `orders` 表，而是在查询时计算出来。

这类 computed column 很适合：

- 比率；
- 金额换算；
- 情景值；
- 日期差；
- 文本拼接；
- CASE 分类。

SQL 查询因此可以承担一部分轻量的数据整形，而不必每次都先修改源表。

## 表达式需要给清楚的别名

下面虽然能运行：

```sql
SELECT order_value * 1.10
FROM orders;
```

但结果列名不适合长期使用。

更好的写法：

```sql
SELECT
  order_value * 1.10 AS scenario_value
FROM orders;
```

一个好的别名应该说明结果是什么，而不是重复公式本身。

如果后续 BI 工具或代码会引用这个字段，稳定、清楚的别名还能减少下游改动。

## 同一个字段可以在结果里出现多次

例如同时显示原金额和转换后的金额：

```sql
SELECT
  order_value AS base_value,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders;
```

两列都来自同一个原始字段，但业务含义不同。

Projection 的目标不是追求“每个源字段只用一次”，而是组织当前分析真正需要的结果结构。

## SELECT 星号为什么不适合作为长期接口

`SELECT *` 在探索阶段非常方便，但长期使用会带来几个问题。

### 输出会随着表结构变化

数据库新增一列后，`SELECT *` 会自动多返回一列。下游程序如果假设固定 schema，可能突然出错。

### 传输不需要的数据

宽表中只需要 3 列，却把 50 列全部取回，会增加 I/O 和网络传输。

### 权限和隐私更难控制

如果表后来增加敏感字段，旧的 `SELECT *` 查询可能在没有注意的情况下把新字段带出去。

所以正式查询更适合明确列清单。

## Projection 不负责排序

即使 SELECT 列表写成：

```sql
SELECT
  order_value,
  order_id
FROM orders;
```

也只是改变列顺序，不代表订单记录会按 `order_value` 排序。

行的排列需要 `ORDER BY`：

```sql
ORDER BY order_value DESC
```

要把两个“顺序”分开：

```text
SELECT 列表顺序
→ 决定列怎么排

ORDER BY
→ 决定行怎么排
```

这两个概念名字都和顺序有关，却控制完全不同的方向。

## DISTINCT 也会影响结果，但它不是简单的列选择

查询：

```sql
SELECT DISTINCT segment
FROM customers;
```

只返回不同的 segment 值。

这里 SELECT 先选择 `segment`，`DISTINCT` 再去掉重复行。

因此，`DISTINCT` 会改变行数，不只是改变列。使用时应该明确它为什么需要，而不是看到重复就习惯性加上。

如果重复来自一对多 JOIN，直接 DISTINCT 可能只是把粒度问题遮住。

## 结果结构最好服务于下一个使用场景

同一张表可以为不同用途返回完全不同的 projection。

报表可能需要：

```text
order_id
order_date
order_value
```

机器学习特征表可能需要：

```text
customer_id
segment
scenario_value
```

API 可能只需要：

```text
customer_key
name
```

SQL 不需要把数据库物理结构原样暴露给每个使用者。查询结果可以根据任务重新组织。

## 写列清单时最常见的问题

- 拼错列名；
- 两张表 JOIN 后没有给同名字段加表别名；
- 计算表达式没有 alias；
- 把列顺序误认为行排序；
- 用 `SELECT *` 作为长期接口；
- 用 DISTINCT 掩盖本来应该检查的重复问题。

## 一套简单的结果结构检查顺序

1. 先确认当前任务真正需要哪些字段；
2. SELECT 里明确写出列名；
3. 给计算列和不直观字段加清楚的 alias；
4. WHERE 负责行筛选，不要混淆；
5. 需要排序时单独使用 ORDER BY；
6. 看到重复时先检查粒度，再决定是否使用 DISTINCT；
7. 长期接口避免依赖 `SELECT *`。

Projection 的价值就是把“数据库里有什么”整理成“当前任务需要什么”。下一篇会继续处理结果顺序：列已经选好以后，怎样让行按照明确、可重复的规则排列。
