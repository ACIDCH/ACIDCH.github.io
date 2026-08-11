---
translationKey: sql-pagination
locale: zh
slug: sql-pagination
title: 分页查询
summary: 数据多到不能一次全显示时，就要把有序结果切成页面。这里用 LIMIT、OFFSET 和稳定 ORDER BY 做一个最小分页，再解释深分页和 keyset pagination 的区别。
tags:
  - Pagination
  - LIMIT
  - OFFSET
  - Keyset Pagination
topics:
  - 数据查询
  - SQL 基础
  - 查询性能
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 9
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-order-by
---

## 从排序结果进入页面窗口

订单只有四条时，一次全部返回当然没问题。真实系统里如果有几十万条记录，列表页不可能每次把所有行都传给浏览器。

分页做的事情其实很简单：先把结果按稳定规则排好，再从这个有序序列里切出一段。

当前订单按：

```sql
ORDER BY order_value DESC, order_id ASC
```

得到：

```text
50003 | 760
50004 | 510
50001 | 420
50002 | 185
```

如果每页 2 条，那么第一页就是前两条，第二页就是后两条。

<div data-learning-slot="pagination-lab"></div>

## LIMIT 定义页面最多返回多少行

SQLite 中：

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2;
```

会返回：

```text
50003 | 760
50004 | 510
```

`LIMIT 2` 表示这次最多取 2 行。

如果结果本来只有 1 行，LIMIT 不会硬凑出第二行；它只是设置上限。

不同数据库的分页语法可能不同，例如 SQL Server 常用 OFFSET/FETCH，标准和方言需要分开看。

## OFFSET 定义先跳过多少行

第二页需要先跳过第一页的 2 行：

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 2;
```

结果：

```text
50001 | 420
50002 | 185
```

可以把 OFFSET 理解成：**先从有序结果开头跳过多少行，再开始取 LIMIT 指定的数量。**

## 页码从 1 开始，OFFSET 从 0 开始

业务界面通常把第一页叫 page 1，但 OFFSET 是从 0 开始计算。

公式：

```text
OFFSET = pageSize × (pageIndex - 1)
```

每页 2 条：

```text
page 1 → OFFSET 0
page 2 → OFFSET 2
page 3 → OFFSET 4
```

因此：

```text
OFFSET = pageSize × (pageIndex - 1)
```

这个减 1 很容易写漏，结果就会整页错位。

## 总页数来自总记录数与 pageSize

如果总共有 4 条记录，每页 2 条：

\[
TotalPages=\lceil4/2\rceil=2
\]

如果有 5 条：

\[
TotalPages=\lceil5/2\rceil=3
\]

最后一页只有 1 条也完全正常。

页面组件通常还需要单独查询总记录数：

```sql
SELECT COUNT(*)
FROM orders;
```

然后再根据 pageSize 计算总页数。

## 越界 OFFSET 通常返回空结果，而不是报错

当前只有 4 条订单，如果运行：

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 10;
```

通常会得到空结果集。

这不表示 SQL 语法错误，只是跳过的行数已经超过当前结果长度。

应用层需要决定遇到越界页码时怎么办：显示空页、回到最后一页，还是返回 404/参数错误。数据库只负责执行查询。

## Pagination 必须建立在稳定 ORDER BY 上

分页最危险的错误不是 LIMIT 写错，而是排序不稳定。

如果只写：

```sql
ORDER BY order_value DESC
```

当两张订单金额相同时，它们之间没有确定顺序。

第一页切走一条，第二页再查询时，并列记录可能换位置，于是可能出现：

```text
某条记录重复出现
```

或者：

```text
某条记录被跳过
```

因此，更稳妥的排序是：

```sql
ORDER BY order_value DESC, order_id ASC
```

`order_id` 唯一，所以整个序列最终有明确顺序。

## LIMIT/OFFSET 分页其实是在反复“从头数”

要取第 5000 页，如果每页 20 行：

```text
OFFSET = 20 × (5000 - 1)
       = 99980
```

数据库需要先越过前面的 99,980 条，才能开始返回这一页。

具体执行方式取决于数据库和索引，但深 OFFSET 通常会越来越贵。

所以 LIMIT/OFFSET 很适合：

- 数据量不大；
- 页面不深；
- 管理后台需要直接跳到某页；
- 查询成本可接受。

它简单、直观，并不是“错误的分页方式”。只是规模变大以后要知道它的边界。

## OFFSET 越深，数据库通常需要跳过越多记录

例如：

```sql
LIMIT 20 OFFSET 100000
```

最终只返回 20 行，但前面大量记录仍然需要被定位和跳过。

如果页面主要是“下一页、下一页”向后浏览，而不是随机跳第 8000 页，keyset pagination 往往更适合。

优化分页之前，最好先看真实查询计划和访问模式，而不是只凭规则把所有 OFFSET 都换掉。

## 数据在翻页期间发生变化，会产生另一类问题

假设第一页查询完成以后，有一张新订单插入到排序最前面。

原来的第二条记录可能被推到第三位。此时再执行第二页的：

```text
OFFSET 2
```

页面边界已经变化。

结果可能出现重复或遗漏。

这不是 ORDER BY 不稳定，而是**数据本身在两次查询之间发生了变化**。

对变化频繁的数据流，单纯用 offset 表示“第几页”天然会受到这种位置移动影响。

## Keyset pagination 用“上一页最后一个键”继续向后找

Keyset pagination 不再说“跳过前 100000 行”，而是记住上一页最后一条记录的排序键。

当前排序：

```sql
ORDER BY order_value DESC, order_id ASC
```

第一页最后一条是：

```text
50004 | 510
```

下一页可以从“排在 510 / 50004 后面的记录”继续找。

概念上类似：

```sql
WHERE
  order_value < 510
  OR (order_value = 510 AND order_id > 50004)
ORDER BY order_value DESC, order_id ASC
LIMIT 2;
```

结果仍然是：

```text
50001 | 420
50002 | 185
```

它用游标位置代替了页码偏移。

## Keyset pagination 不是永远更好

Keyset 的优势：

- 深页通常更高效；
- 对前面插入的新记录更稳定；
- 很适合连续滚动和“加载更多”。

代价也很明显：

- 不方便直接跳到第 237 页；
- 游标需要包含完整排序键；
- 多列、NULL 和混合排序方向时条件更复杂；
- 前端 URL 和状态管理也要配合 cursor。

所以选择 offset 还是 keyset，应该看产品交互和数据规模，而不是把某一种方式当成所有场景的标准答案。

## 分页中的 COUNT 也要和查询口径一致

假设列表只显示金额至少 400 的订单：

```sql
SELECT
  order_id,
  order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 0;
```

总记录数也必须使用相同筛选：

```sql
SELECT COUNT(*)
FROM orders
WHERE order_value >= 400;
```

如果页面查询有 WHERE，而 COUNT 没有，前端会显示错误的总页数。

这类 bug 很常见，因为“数据查询”和“计数查询”被分别维护，条件后来只改了一边。

## 过滤条件、排序条件和 cursor 要互相匹配

Keyset pagination 下，cursor 不是随便挑一个 ID 就行。

如果排序是：

```text
order_value DESC, order_id ASC
```

游标也必须携带：

```text
last_order_value
last_order_id
```

只保存 `order_id` 无法恢复同一个排序位置。

同样，如果用户改变 WHERE 筛选或排序方式，旧 cursor 通常也不能继续使用，因为它属于另一条查询序列。

## 分页接口最好把边界条件说清楚

一个稳定分页接口通常需要明确：

```text
pageSize 最大允许多少？
pageIndex 从 0 还是 1 开始？
默认排序是什么？
排序是否有唯一 tie-breaker？
筛选变化后是否重置页码？
空页怎样返回？
cursor 是否有过期规则？
```

这些不是数据库语法问题，却直接影响分页是否可重复、前后端是否一致。

## 常见分页错误

### 没有 ORDER BY 就直接 LIMIT/OFFSET

页面没有稳定序列基础。

### ORDER BY 有并列值，却没有唯一 tie-breaker

分页边界可能不稳定。

### 页码公式忘记减 1

page 1 被错误转换成 OFFSET=pageSize。

### COUNT 和列表 WHERE 不一致

前端总页数错误。

### 深 OFFSET 很慢，却仍然无限加大页码

需要先看访问模式和查询计划，判断是否改用 keyset。

### 数据变化频繁，却假设“第 N 页”永远代表同一批记录

位置式分页本身就不保证这一点。

## 一套实用的分页检查顺序

1. 先定义稳定 ORDER BY，并加入唯一 tie-breaker；
2. 明确 pageSize 和 pageIndex；
3. 用 `OFFSET = pageSize × (pageIndex - 1)` 计算偏移；
4. COUNT 使用和列表一致的筛选口径；
5. 测试第一页、最后一页和越界页；
6. 测试并列排序值；
7. 数据量大时检查深 OFFSET 的执行成本；
8. 连续滚动场景再考虑 keyset pagination；
9. 使用 keyset 时让 cursor 完整对应排序键。

分页的核心不是 LIMIT 和 OFFSET 两个关键字，而是先建立一个确定的结果顺序，再用适合产品场景的方式沿这个顺序取数据。