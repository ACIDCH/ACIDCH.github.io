---
translationKey: sql-order-by
locale: zh
slug: sql-order-by
title: ORDER BY 排序
summary: 查询能返回正确的记录，不代表顺序也可靠。这里从升序、降序和多列排序开始，说明为什么稳定排序需要 tie-breaker，以及它和分页有什么关系。
tags:
  - ORDER BY
  - 排序
  - SQL 查询
  - 稳定顺序
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
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-projection
  - sql-pagination
---

## 从结果结构进入结果顺序

SELECT 决定返回哪些列，WHERE 决定哪些行留下。即使这两步都正确，数据库仍然没有承诺“这些行会按什么顺序出现”。

如果结果顺序对报表、Top-N 或分页有意义，就要明确写 `ORDER BY`。

```sql
SELECT
  customer_id,
  customer_name
FROM customers
ORDER BY customer_id ASC;
```

排序不是为了让表格看起来整齐，而是在需要顺序时把规则真正写进查询。

<div data-learning-slot="order-by-lab"></div>

## ORDER BY 改变的是结果行的排列顺序

当前订单表：

| order_id | customer_id | order_date | order_value |
| -------: | ----------: | ---------- | ----------: |
|    50001 |        1001 | 2026-07-03 |      420.00 |
|    50002 |        1001 | 2026-07-05 |      185.00 |
|    50003 |        1002 | 2026-07-06 |      760.00 |
|    50004 |        1003 | 2026-07-09 |      510.00 |

按金额升序：

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value ASC;
```

结果：

```text
50002 | 185
50001 | 420
50004 | 510
50003 | 760
```

列没有变，行数也没有变，只是排列顺序改变了。

## ASC 是默认方向，但显式写出更容易复查

下面两种写法在常见数据库中效果相同：

```sql
ORDER BY customer_id
```

```sql
ORDER BY customer_id ASC
```

`ASC` 表示 ascending，也就是升序。

虽然可以省略，但在团队代码和多列排序里显式写出来更清楚。数字通常从小到大，日期从早到晚，文本则还会受到 collation 影响。

## DESC 把排序方向反转

按金额从高到低：

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value DESC;
```

结果：

```text
50003 | 760
50004 | 510
50001 | 420
50002 | 185
```

按日期从新到旧则可以写：

```sql
ORDER BY order_date DESC
```

## 多列排序是逐层解决并列值

如果只按 `customer_id` 排序，订单 50001 和 50002 都属于客户 1001，它们在第一排序键上并列。

可以加第二个排序键：

```sql
ORDER BY customer_id ASC, order_date DESC;
```

数据库先按 `customer_id` 排；相同时，再按 `order_date` 从新到旧。

多列排序可以读成：

```text
先看第一列
相同再看第二列
还相同再看第三列
```

## 每一个排序列都有自己的方向

多列 ORDER BY 里，每个字段都可以单独指定 ASC 或 DESC。

例如：

```sql
ORDER BY customer_id ASC, order_date DESC, order_id ASC;
```

含义是：

```text
customer_id 从小到大
同一客户内，日期从新到旧
如果日期仍相同，再按 order_id 从小到大
```

不要把第一个字段的方向自动套到后面。方向属于每一个排序表达式本身。

## 只有第一排序键还不一定形成稳定总顺序

假设分页只写：

```sql
ORDER BY order_value DESC
```

如果以后两张订单金额相同，它们之间没有确定顺序。

更稳妥的写法是加入唯一 tie-breaker：

```sql
ORDER BY order_value DESC, order_id ASC;
```

只要 `order_id` 唯一，所有记录最终都有明确位置。

当前数据因此得到稳定顺序：

```text
50003
50004
50001
50002
```

这种 deterministic ordering 对分页、排行榜和可重复测试都很重要。

## WHERE、Projection 与 ORDER BY 怎样组合

只看金额至少 400 的订单，只返回 ID 和金额，再从高到低排列：

```sql
SELECT
  order_id,
  order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC;
```

可以把查询逻辑拆成：

```text
FROM
→ 数据从哪里来

WHERE
→ 哪些行留下

SELECT
→ 显示哪些列

ORDER BY
→ 最终怎样排列
```

## ORDER BY 为什么放在 WHERE 后面

SQL 的书写顺序不是随便排的：

```sql
SELECT ...
FROM ...
WHERE ...
ORDER BY ...;
```

业务上先筛出符合条件的记录，再对最终结果排序更容易理解。

数据库内部实际执行计划可能因为优化器而调整，但 SQL 语法层面仍然要求 ORDER BY 位于 WHERE 之后。

这也是为什么不能写：

```sql
SELECT *
FROM orders
ORDER BY order_value DESC
WHERE order_value >= 400;
```

这种语法顺序会直接报错。

## 可以按输出别名排序

如果 SELECT 里创建了别名：

```sql
SELECT
  order_id,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders
ORDER BY scenario_value DESC;
```

常见数据库允许 ORDER BY 使用 `scenario_value`。

这能避免把复杂表达式重复一遍，也让查询更容易读。

不过别名在不同子句中的可见性规则并不相同。能在 ORDER BY 使用，不代表 WHERE 也一定能直接引用同一个别名。

## 也能按列位置排序，但长期代码不推荐

部分数据库允许：

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY 2 DESC;
```

这里 `2` 表示按 SELECT 结果的第二列排序，也就是 `order_value`。

这种写法短，但可维护性差。一旦 SELECT 列顺序变化，排序含义也会跟着变。

长期代码更适合明确写字段或别名：

```sql
ORDER BY order_value DESC
```

## NULL 排序不能只凭直觉推断

如果排序列包含 NULL，不同数据库的默认位置可能不同。

例如：

```sql
ORDER BY phone ASC
```

NULL 是最前还是最后，不能把某一个数据库当前行为当成统一 SQL 规则。

PostgreSQL 支持：

```sql
NULLS FIRST
NULLS LAST
```

其他数据库可能有不同做法。如果 NULL 位置影响业务结果，应查看具体数据库并显式处理。

## 文本排序还受到 collation 影响

文本排序不仅涉及字母顺序，还可能受到：

- 大小写；
- 重音符号；
- 语言环境；
- Unicode 规则；
- 数据库 collation。

因此：

```sql
ORDER BY customer_name ASC
```

并不等于所有数据库都按完全相同的“肉眼字母表”排序。

当前示例以英文名称为主，主要用于理解 ORDER BY 结构；正式多语言系统还需要明确字符集和 collation。

## ORDER BY 是分页之前的关键前提

如果每页显示两条订单，却没有稳定 ORDER BY，第一页和第二页实际上没有清楚定义。

分页应该先建立：

```sql
ORDER BY order_value DESC, order_id ASC
```

这样的确定顺序，再用 LIMIT / OFFSET 截取页面。

所以分页不是“先 LIMIT，再看数据库给什么顺序”。页面窗口必须建立在稳定序列上。

## Business Analytics 中 ORDER BY 常见在哪里

排序在分析工作中远不只是展示功能。

常见场景包括：

```text
找金额最高的订单
查看最新交易
按风险分数排客户
制作 Top-N 产品榜单
为分页建立固定顺序
按时间检查异常变化
```

例如：

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value DESC
LIMIT 3;
```

这里 ORDER BY 决定“最高”的含义，LIMIT 只是从已经排好的结果里取前三条。

## 排序成本和索引有关，但不能只看语法

ORDER BY 可能需要数据库执行额外排序。数据量很大时，排序列和 WHERE 条件上是否有合适索引会影响性能。

但索引不是“看到 ORDER BY 就自动建一个”。还需要结合：

- WHERE 条件；
- 多列组合；
- 排序方向；
- 返回行数；
- 数据分布；
- 实际执行计划。

索引会在后续专题继续展开。这里先把顺序契约写清楚。

## 常见的排序错误

### 依赖原表当前行序

没有 ORDER BY，就没有业务层面的顺序保证。

### 只排第一键，却要求结果完全可重复

有并列值时需要 tie-breaker。

### 把列顺序当成行排序

SELECT 列表控制列，ORDER BY 控制行。

### 忽略 NULL 和文本 collation

不同数据库默认行为可能不同。

### 分页时没有稳定排序

页面内容可能在并列值附近出现重复或遗漏。

## 一套实用的排序检查顺序

1. 先确认业务真正想按什么排；
2. 明确每个字段是 ASC 还是 DESC；
3. 第一排序键可能并列时增加第二键；
4. 最终最好用唯一键形成完整 tie-breaker；
5. NULL 位置重要时显式处理；
6. 文本排序需要时确认 collation；
7. 做分页前先保证 ORDER BY 稳定。

## 下一步从有序结果中截取一页

ORDER BY 看起来只是把行重新排一下，但只要结果需要被重复查看、导出、排名或分页，它就变成查询契约的一部分。

下一篇会直接建立在稳定排序上：先明确页面大小，再用 LIMIT 和 OFFSET 切出一段结果；数据量变大以后，再比较 keyset pagination。
