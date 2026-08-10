---
translationKey: sql-order-by
locale: zh
slug: sql-order-by
title: ORDER BY：把结果顺序变成明确的数据契约
summary: 基于统一 orders 数据理解 ORDER BY 如何控制升序、降序与多列排序，并进一步处理并列值、稳定 tie-breaker、别名、NULL、文本排序和分页前的确定性问题。
tags:
  - ORDER BY
  - ASC
  - DESC
  - 排序
topics:
  - 数据查询
  - 数据理解
  - SQL 基础
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 8
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-projection
---

## 从结果结构进入结果顺序

前面的查询已经分别回答了三个问题：

```text
SELECT      → 从哪里读取、返回什么结果
WHERE       → 哪些行进入结果集
Projection  → 哪些列进入结果集
```

但还有一个经常被忽略的问题：

> 这些结果行应该以什么顺序出现？

例如：

```sql
SELECT order_id, order_value
FROM orders;
```

可能在当前环境中看起来像按 `order_id` 返回，但这不构成查询保证。

没有 `ORDER BY` 时，数据库可以根据存储布局、扫描方式、索引、执行计划或后续优化选择不同的返回顺序。

因此：

> **需要稳定顺序时，必须显式声明 `ORDER BY`。**

## ORDER BY 改变的是结果行的排列顺序

统一数据集中的 `orders`：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

如果需要按订单金额从低到高：

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value ASC;
```

结果顺序是：

```text
50002 · 185
50001 · 420
50004 · 510
50003 · 760
```

这里没有减少行，也没有改变列结构。

```text
Rows    4 → 4
Columns 2 → 2
Order   changed
```

<div data-learning-slot="order-by-lab"></div>

## ASC 是默认方向，但显式写出更容易复查

`ASC` 表示 ascending，也就是升序。

下面两条语句在常见 SQL 数据库中表示相同方向：

```sql
ORDER BY order_value
```

```sql
ORDER BY order_value ASC
```

在教学、报表 SQL 和长期维护查询中，显式写出 `ASC` 往往更容易复查，尤其是在多列排序中同时出现升序与降序时。

## DESC 把排序方向反转

如果需要金额最大的订单先出现：

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value DESC;
```

结果变成：

```text
50003 · 760
50004 · 510
50001 · 420
50002 · 185
```

`DESC` 只作用于它前面的排序表达式。

## 多列排序是逐层解决并列值

真实数据经常出现相同排序值。

当前 `orders` 中客户 1001 有两张订单：

```text
50001 · 2026-07-03
50002 · 2026-07-05
```

先按客户编号升序，再让同一客户内部按日期降序：

```sql
SELECT order_id, customer_id, order_date
FROM orders
ORDER BY customer_id ASC, order_date DESC;
```

排序逻辑不是“同时随意参考两个字段”，而是：

```text
第 1 个 key: customer_id ASC
↓ 如果相同
第 2 个 key: order_date DESC
```

因此客户 1001 内部会得到：

```text
50002 · 2026-07-05
50001 · 2026-07-03
```

随后才是客户 1002 和 1003。

## 每一个排序列都有自己的方向

下面两种写法完全不同：

```sql
ORDER BY customer_id ASC, order_date DESC
```

```sql
ORDER BY customer_id DESC, order_date DESC
```

排序方向是逐个表达式解释的。

如果第二个字段没有写方向：

```sql
ORDER BY customer_id DESC, order_date
```

那么 `order_date` 使用默认 `ASC`。

因此多列排序中显式写出每个方向通常更清晰。

## 只有第一排序键还不一定形成稳定总顺序

假设查询写成：

```sql
ORDER BY customer_id ASC
```

客户 1001 的两张订单具有相同的 `customer_id`。

这个条件只保证：

```text
customer 1001
排在
customer 1002
之前
```

但并没有声明客户 1001 的两张订单谁先谁后。

如果下游逻辑要求完全确定的顺序，可以继续加入 tie-breaker：

```sql
ORDER BY
  customer_id ASC,
  order_date DESC,
  order_id ASC;
```

最终的 `order_id` 是唯一键，因此能够在前面的排序值全部相同时继续打破并列。

这类写法尤其重要于：

```text
分页
Top N
导出文件
可重复测试
前端列表
按顺序逐条处理的流程
```

## 稳定排序不是“排序算法稳定性”这个概念

这里所说的稳定结果，是指 SQL 查询本身给出了足够的排序键，使结果顺序可以被明确推导。

它不应该依赖：

```text
数据库碰巧沿用插入顺序
当前执行计划碰巧没变
某个索引碰巧输出同样顺序
同值记录碰巧保持上次排列
```

如果业务需要可重复顺序，应把 tie-breaker 写进 `ORDER BY`。

## WHERE、Projection 与 ORDER BY 怎样组合

例如，需要：

> 只看金额至少为 400 的订单，只返回三个字段，并按金额从高到低排列。

可以写成：

```sql
SELECT
  order_id,
  customer_id,
  order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC;
```

当前结果：

| order_id | customer_id | order_value |
|---:|---:|---:|
| 50003 | 1002 | 760.00 |
| 50004 | 1003 | 510.00 |
| 50001 | 1001 | 420.00 |

可以把职责拆开理解：

```text
WHERE
决定哪些行留下

Projection
决定哪些列输出

ORDER BY
决定留下的行怎样排列
```

## ORDER BY 为什么放在 WHERE 后面

SQL 写法遵循：

```sql
SELECT ...
FROM ...
WHERE ...
ORDER BY ...;
```

`WHERE` 先定义进入结果集的记录集合，`ORDER BY` 再对最终结果排序。

因此下面的顺序是错误的：

```sql
SELECT *
FROM orders
ORDER BY order_value DESC
WHERE order_value >= 400;
```

数据库会把它视为不合法的语法结构。

## 可以按输出别名排序

Projection 中已经建立过结果列别名。

例如：

```sql
SELECT
  order_id,
  order_value AS value
FROM orders
ORDER BY value DESC;
```

常见数据库允许 `ORDER BY` 引用输出列别名。

这对表达式列尤其有用：

```sql
SELECT
  order_id,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders
ORDER BY scenario_value DESC;
```

这样不需要在 `ORDER BY` 中再次完整重复表达式。

## 也能按列位置排序，但长期代码不推荐

一些数据库支持：

```sql
SELECT order_id, order_date, order_value
FROM orders
ORDER BY 3 DESC;
```

这里的 `3` 表示结果集第 3 列，也就是 `order_value`。

这种写法短，但存在维护风险：

```text
SELECT 列顺序一变
→ ORDER BY 3 的含义也跟着变
```

稳定分析代码通常优先使用明确的列名或别名：

```sql
ORDER BY order_value DESC
```

## ORDER BY 表达式不一定必须直接显示出来

排序键可以是表达式。

例如：

```sql
SELECT order_id, order_value
FROM orders
ORDER BY ROUND(order_value * 1.10, 2) DESC;
```

结果仍然只输出两个字段。

不过如果表达式代表重要业务指标，显式投影并给予清晰别名通常更容易审计：

```sql
SELECT
  order_id,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders
ORDER BY scenario_value DESC;
```

## NULL 排序不能只凭直觉推断

`NULL` 表示缺失或未知值，并不是普通数字或空字符串。

不同数据库对默认 NULL 排序位置并不完全一致。

例如：

```text
SQLite / MySQL
ASC  时 NULL 通常在前
DESC 时 NULL 通常在后

PostgreSQL
ASC  默认 NULLS LAST
DESC 默认 NULLS FIRST
```

SQLite 与 PostgreSQL 支持显式的：

```sql
NULLS FIRST
NULLS LAST
```

当 NULL 的展示位置属于业务规则时，不应只依赖数据库默认值。

跨数据库迁移时，这也是必须重新验证的排序语义之一。

## 文本排序还受到 collation 影响

数字排序相对直观，但文本排序还涉及 collation（排序规则）。

例如大小写、语言字符与重音符号的比较方式可能受：

```text
数据库
列定义
连接或会话设置
显式 COLLATE
```

影响。

因此不能简单把“字母排序”理解成所有数据库都完全一致的字符码顺序。

如果报表、主数据列表或跨系统接口对文本顺序有严格要求，应明确数据库使用的 collation 规则并进行验证。

## ORDER BY 不等于查询一定很慢，也不等于一定很快

数据库为了满足 `ORDER BY`，可能：

```text
执行显式排序
或
利用合适的索引顺序读取
```

是否能够利用索引，取决于：

```text
排序字段
排序方向
多列顺序
WHERE 条件
索引结构
优化器判断
返回数据比例
```

因此不能仅看到 `ORDER BY` 就断言性能差，也不能因为存在索引就断言一定不会排序。

索引设计将在后面的 Index 笔记中单独处理。

## ORDER BY 是分页之前的关键前提

下一篇会进入 Pagination。

分页的本质是从一个有序结果集中截取某一段。

如果分页查询没有一个足够确定的 `ORDER BY`，那么：

```text
第 1 页最后一条是谁？
第 2 页第一条是谁？
并列记录跨页后怎样分配？
```

都可能没有稳定答案。

因此分页之前首先应建立明确且可重复的排序契约。

## Business Analytics 中 ORDER BY 常见在哪里

排序不仅用于“看起来整齐”。

典型分析用途包括：

```text
金额最高的订单优先审阅
最新交易排在前面
客户内部按时间排序
异常值从高到低检查
报表导出保持可重复顺序
Top N 前先定义排名依据
分页接口提供确定顺序
```

真正关键的是：

> **排序字段必须对应业务问题，而不是只为了视觉效果。**

## 常见错误

### 1. 把默认返回顺序当成数据库保证

错误。

没有 `ORDER BY` 时不能依赖结果顺序。

### 2. 忘记 DESC 只作用于对应表达式

例如：

```sql
ORDER BY customer_id DESC, order_date
```

第二个字段仍然是默认 `ASC`。

### 3. 多列排序没有理解优先级

第二个 key 只在第一个 key 相同时才用于继续排序。

### 4. 并列值没有 tie-breaker

如果下游要求完全确定顺序，仅排序一个非唯一字段通常不够。

### 5. 把 ORDER BY 写到 WHERE 前面

SQL 子句顺序不合法。

### 6. 跨数据库假设 NULL 默认位置相同

SQLite、MySQL 与 PostgreSQL 的默认 NULL 排序存在差异。

### 7. 使用 ORDER BY 3 却忽略 SELECT 列顺序会变化

列位置写法短，但维护性较弱。

## 排序查询可以按这个顺序检查

```text
1. 业务问题真正需要按什么字段排序？
2. 每个字段分别是 ASC 还是 DESC？
3. 第一排序键是否可能出现并列？
4. 是否需要唯一 tie-breaker 形成稳定总顺序？
5. WHERE 与 Projection 是否已经定义正确的行和列？
6. NULL 的位置是否属于业务规则？
7. 文本排序是否受 collation 影响？
8. 下游是否会分页、Top N 或逐条处理？
9. 是否错误依赖当前看到的默认顺序？
```

## 本篇的核心判断

`ORDER BY` 的核心不是让表格“看起来有序”，而是：

> **把结果行的排列规则写成查询本身可以验证的数据契约。**

只要顺序会影响解释、分页、导出、排名或下游处理，就应显式声明排序键，并在需要时加入 tie-breaker。

## 下一步从有序结果中截取一页

SQL 09 将进入：

```text
Pagination
```

下一步需要回答：

> 当结果已经具有明确顺序后，怎样只取其中一段，同时保证分页逻辑可重复？
