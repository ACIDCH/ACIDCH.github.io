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

SELECT 决定返回哪些列，WHERE 决定哪些行留下。即使这两步都完全正确，数据库仍然没有答应“这些行会按什么顺序出现”。

如果结果顺序对报表、Top-N 或分页有意义，就需要明确写 `ORDER BY`。

例如按客户 ID 从小到大：

```sql
SELECT
  customer_id,
  customer_name
FROM customers
ORDER BY customer_id ASC;
```

排序不是为了让表格“看起来整齐”，而是在需要顺序时把规则真正写进查询。

<div data-learning-slot="order-by-lab"></div>

## ORDER BY 改变的是结果行的排列顺序

假设订单表是：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

按金额升序：

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value ASC;
```

结果会是：

```text
50002 | 185
50001 | 420
50004 | 510
50003 | 760
```

列没有变，行数也没有变，只是排列顺序改变了。

## ASC 是默认方向，但显式写出更容易复查

下面两条查询在常见数据库中效果相同：

```sql
ORDER BY customer_id
```

```sql
ORDER BY customer_id ASC
```

`ASC` 表示 ascending，也就是升序。

虽然可以省略，但在教学、团队代码和复杂多列排序里显式写出来通常更清楚。读查询时不需要再记“这个位置没写方向，所以应该是什么”。

数字升序是从小到大，日期通常从早到晚，文本则取决于数据库排序规则和 collation。

## DESC 把排序方向反转

按订单金额从高到低：

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

按日期从新到旧：

```sql
ORDER BY order_date DESC
```

这类写法特别适合“最新记录”“金额最高”“最近事件”等查询。

## 多列排序是逐层解决并列值

只有一列排序时，如果两个记录在第一排序键上相同，它们之间仍然可能没有确定顺序。

例如按 `customer_id`：

```sql
ORDER BY customer_id ASC
```

订单 50001 和 50002 都属于客户 1001。此时可以再加第二排序键：

```sql
ORDER BY customer_id ASC, order_date DESC;
```

数据库先按 `customer_id` 分组排序；遇到相同 customer_id，再按 `order_date` 从新到旧。

所以多列 ORDER BY 可以读成：

```text
先看第一列
相同时再看第二列
还相同再看第三列
```

这和 Excel 的多级排序逻辑很接近。

## 只有第一排序键还不一定形成稳定总顺序

假设分页按照金额从高到低：

```sql
ORDER BY order_value DESC
```

如果以后出现两张订单金额完全相同，数据库没有义务保证这两条记录谁先谁后。

更稳妥的写法是增加唯一 tie-breaker：

```sql
ORDER BY order_value DESC, order_id ASC;
```

只要 `order_id` 唯一，所有行最终都会有确定位置。

这种排序叫 deterministic ordering。它对分页、排行榜和可重复测试尤其重要。

当前订单按：

```text
order_value DESC, order_id ASC
```

得到稳定顺序：

```text
50003
50004
50001
50002
```

## 稳定排序不是为了“数据库每次一定会乱”

没有 tie-breaker 时，数据库可能连续很多次都返回同一个顺序，看起来非常稳定。

问题是，这个顺序没有被查询契约保证。执行计划、索引、数据量或数据库版本变化以后，相同排序键的记录可以换位置。

因此，重点不是预测它什么时候会变，而是：如果业务要求顺序可重复，就把全部排序规则写完整。

“现在看起来没变”不能替代明确的 SQL 规则。

## WHERE、Projection 与 ORDER BY 怎样组合

例如只看金额至少 400 的订单，只返回 ID 和金额，再从高到低排序：

```sql
SELECT
  order_id,
  order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC;
```

可以把查询理解成：

```text
FROM
→ 数据来源

WHERE
→ 哪些行符合条件

SELECT
→ 结果显示哪些列

ORDER BY
→ 最终结果怎样排列
```

这不是严格的数据库内部执行计划说明，而是一种帮助阅读查询逻辑的方式。

## ORDER BY 可以使用结果列别名

如果 SELECT 里定义了别名：

```sql
SELECT
  order_id,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders
ORDER BY scenario_value DESC;
```

常见数据库允许 ORDER BY 使用这个输出别名。

这能避免把复杂表达式重复写一遍。

不过不同 SQL 子句对别名可见性的规则并不完全相同。能在 ORDER BY 使用，不代表 WHERE 中也一定可以直接引用同一个别名。

## NULL 排序不能只凭直觉推断

如果排序列里有 NULL，不同数据库的默认位置可能不同。

例如：

```sql
ORDER BY phone ASC
```

NULL 是排在最前还是最后，不能把某一个数据库当前行为当成所有 SQL 系统的统一规则。

PostgreSQL 支持：

```sql
NULLS FIRST
NULLS LAST
```

其他数据库可能使用不同方式控制。

如果 NULL 位置对业务有意义，应该查具体数据库规则并显式处理，而不是依赖默认行为。

## 文本排序还会受到 collation 影响

数字 1、2、10 的大小关系很明确，但文本排序涉及更多规则：

- 大小写；
- 重音符号；
- 语言环境；
- Unicode 比较；
- 数据库 collation。

所以：

```sql
ORDER BY customer_name ASC
```

不只是简单按“字母表肉眼顺序”。正式多语言系统需要明确字符集和 collation。

当前学习数据以英文名称为主，主要用来理解 ORDER BY 结构，而不是覆盖所有语言排序细节。

## ORDER BY 是分页之前的关键前提

假设每页显示两条订单。

如果没有稳定排序，第一页和第二页实际上没有清楚定义，因为数据库没有被要求先把记录排成固定顺序。

分页应该建立在：

```sql
ORDER BY order_value DESC, order_id ASC
```

这样的确定排序上，再用 LIMIT / OFFSET 切页面。

因此，分页不是“先 LIMIT，再随便排序”。顺序是页面窗口的基础。

## 排序成本和索引有关，但不能只看语法

ORDER BY 可能需要数据库对结果执行排序。如果查询规模很大，排序列上是否有合适索引会影响性能。

但索引并不是“看到 ORDER BY 就创建一个”。还要结合：

- WHERE 条件；
- 排序方向；
- 多列组合；
- 返回行数；
- 数据分布；
- 实际执行计划。

这部分会在后续 Index 专题里继续展开。当前先把排序的逻辑契约写清楚。

## 常见的排序错误

### 依赖原表当前行序

没有 ORDER BY，就没有业务层面的顺序保证。

### 只排第一键，却要求结果完全可重复

有并列值时需要 tie-breaker。

### 把列顺序当成行排序

SELECT 列表控制列，ORDER BY 控制行。

### 忽略 NULL 和文本 collation

不同数据库的默认规则可能不一样。

### 分页时没有稳定排序

页面内容可能在并列值附近出现不稳定。

## 一套实用的排序检查顺序

1. 先确认业务真正想按什么排；
2. 明确 ASC 或 DESC；
3. 第一排序键可能并列时增加第二键；
4. 最终最好用唯一键形成完整 tie-breaker；
5. NULL 位置重要时显式处理；
6. 文本排序需要时确认 collation；
7. 做分页前先保证 ORDER BY 稳定。

ORDER BY 看起来只是把行重新排一下，但只要结果需要被重复查看、导出或分页，它就变成查询契约的一部分。下一篇会直接建立在这个稳定顺序上，把结果切成一页一页的窗口。