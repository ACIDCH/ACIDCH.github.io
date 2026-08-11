---
translationKey: sql-select
locale: zh
slug: sql-select
title: SELECT 查询
summary: 表结构弄清楚以后，下一步就是把数据读出来。这里从最简单的 SELECT 和 FROM 开始，说明结果集、星号和只读查询到底是什么意思。
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
updatedAt: 2026-08-11
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

前面几篇一直在处理表结构：一行是什么、主键怎么定、外键怎么连、表之间是什么关系。到了这里，终于开始真正向数据库提问。

最简单的一条查询是：

```sql
SELECT *
FROM customers;
```

它的意思很直接：从 `customers` 表中读取当前全部列和全部记录。

## SELECT * FROM customers 到底在说什么？

把这条语句拆开：

```text
SELECT
→ 说明要读取什么

*
→ 当前选择所有列

FROM
→ 说明数据从哪里来

customers
→ 数据来源表
```

客户表现在有三条记录：

| customer_id | customer_name | email | phone | segment |
|---:|---|---|---|---|
| 1001 | North Retail | north@example.com | 021-440-810 | Retail |
| 1002 | Coast Foods | coast@example.com | 021-440-811 | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | 021-440-812 | Enterprise |

所以这条查询会返回 3 行、5 列。

SQL 的基本阅读顺序可以先保持简单：**SELECT 决定要看什么，FROM 决定去哪里拿。**

## 星号 * 表示什么？

`*` 表示当前数据源的全部列。

对 `customers` 来说就是：

```text
customer_id
customer_name
email
phone
segment
```

在探索数据时，`SELECT *` 很方便，因为可以先快速看一张表长什么样。

不过正式分析或长期接口通常更适合明确写出需要的列。原因不是星号“不能用”，而是表以后加新字段时，`SELECT *` 的输出结构也会跟着变化。

列选择会在 SQL 07 专门展开。

## 没有 WHERE 时会发生什么？

例如：

```sql
SELECT *
FROM orders;
```

没有筛选条件，所以返回当前订单表的全部记录：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

这里的重点不是记住“4 行”，而是理解：**SELECT 本身不负责筛选。** 如果只想要某些订单，需要再加 WHERE。

## 查询结果本身也是一个二维表

数据库执行 SELECT 后，返回的是一个 result set。

它看起来仍然像一张表：有列名，也有一行一行的记录。但这个结果集不等于原表本身。

例如：

```sql
SELECT *
FROM customers;
```

得到的是 `customers` 当前状态的一次查询结果。程序、报表或分析工具可以继续使用这个结果，但查询并没有创建一张永久新表。

后面即使做筛选、排序、计算列，得到的也仍然是查询结果，而不是自动修改原始数据。

## SELECT 会修改原表吗？

正常的 SELECT 是读取操作。

```sql
SELECT * FROM orders;
```

不会把订单删掉，也不会改变金额。

真正修改数据的是：

```sql
INSERT
UPDATE
DELETE
```

这一区分很重要。学习 SQL 时，可以大胆在只读数据上尝试 SELECT、WHERE 和 ORDER BY；一旦进入 UPDATE 或 DELETE，就需要更严格地确认条件。

## SELECT 并不一定需要 FROM

有些数据库允许 SELECT 直接计算表达式：

```sql
SELECT 1;
```

或者：

```sql
SELECT 2 + 3 AS result;
```

SQLite 可以直接运行：

```sql
SELECT 1 AS execution_ok;
```

结果是一行一列：

```text
execution_ok
1
```

这类查询没有读取业务表，只是让数据库计算一个表达式。

### SELECT 1 是“连接检查”吗？

`SELECT 1` 本身只是一条很轻量的查询。

在应用系统里，它经常被拿来做数据库连接或 health check，因为如果数据库连接正常，执行这条语句通常很快。但它并没有特殊的“检查连接”语法含义。

所以更准确的理解是：应用借助一条非常简单的 SELECT，确认数据库能不能正常响应。

## SELECT 可以返回表达式，不只返回原始字段

即使暂时不进入完整 Projection，也可以看到 SELECT 的一个基本能力：结果列可以来自计算。

```sql
SELECT
  order_id,
  order_value,
  order_value * 1.10 AS scenario_value
FROM orders;
```

`scenario_value` 不需要预先存进订单表，它可以在查询时计算出来。

SQL 的结果集因此不只是“原表复制”，而是可以根据需要重新组织数据。

## SELECT * 适合什么时候使用？

比较适合：

- 初次查看一张小表；
- 调试和探索；
- 临时验证数据是否加载成功；
- 教学示例里快速展示整表结构。

不太适合：

- 长期生产接口；
- 只需要两三列却把宽表全部传回来；
- 对列顺序有严格依赖的代码；
- 需要稳定 schema 的报表。

长期查询更清楚的写法通常是明确列名：

```sql
SELECT
  customer_id,
  customer_name,
  segment
FROM customers;
```

## SQL 查询最好先从最小问题开始

刚开始写查询时，不必一次就把 WHERE、JOIN、GROUP BY 和 ORDER BY 全塞进去。

更容易调试的顺序是：

```text
先确认 FROM 的表对不对
↓
再确认 SELECT 的列对不对
↓
再加 WHERE
↓
再加排序、聚合或连接
```

如果最终查询结果不对，可以逐层回退，很快找到是哪一步改变了结果。

下面的交互实验使用 sql.js 在浏览器本地运行 SQLite。输入的查询不会发到远程数据库服务器，所以这里看到的是一套可重复的本地练习环境，而不是生产数据库连接。

<div data-learning-slot="sql-playground"></div>

## 常见的几种初学错误

### 表名写错

```sql
SELECT * FROM customer;
```

如果实际表叫 `customers`，数据库会直接报错。

### 把字符串当字段名

```sql
SELECT "customer_name";
```

不同数据库对双引号语义不同。想读取字段时，最稳妥的是直接写正确列名；想写字符串常量则使用单引号。

### 以为 SELECT * 会自动排序

没有 `ORDER BY` 时，数据库并不承诺返回顺序。当前看到的行序不能当成永久规则。

### 把结果集当成永久表

SELECT 返回的是一次查询结果。要真正创建表或视图，需要另外使用相应 DDL。

## 这一篇先把查询骨架记住

最基础的结构只有：

```sql
SELECT ...
FROM ...;
```

它回答两个问题：要什么数据，从哪里拿。

下一篇加入 WHERE，开始控制**哪些行**进入结果。到那时，同一张订单表就不再只能“全部读出来”，而是可以按金额、客户、日期或其他条件精确筛选。