---
translationKey: sql-pagination
locale: zh
slug: sql-pagination
title: Pagination：把有序结果切成可重复的页面窗口
summary: 基于统一 orders 数据理解 LIMIT/OFFSET、页大小、页码、总页数与稳定排序，并进一步处理越界页、过滤后分页、深 OFFSET 成本、数据变动造成的重复或漏行，以及 keyset pagination 的适用边界。
tags:
  - Pagination
  - LIMIT
  - OFFSET
  - 分页
topics:
  - 数据查询
  - 数据理解
  - SQL 基础
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

`ORDER BY` 已经解决了一个关键问题：结果行应该按照什么顺序出现。

Pagination 继续解决另一个问题：

> 当完整结果集很长时，一次只返回其中哪一段？

例如，统一数据集中的 `orders` 按金额从高到低，并用唯一主键 `order_id` 处理潜在并列：

```sql
SELECT
  order_id,
  customer_id,
  order_date,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC;
```

当前完整顺序是：

| position | order_id | customer_id | order_date | order_value |
|---:|---:|---:|---|---:|
| 1 | 50003 | 1002 | 2026-07-06 | 760.00 |
| 2 | 50004 | 1003 | 2026-07-09 | 510.00 |
| 3 | 50001 | 1001 | 2026-07-03 | 420.00 |
| 4 | 50002 | 1001 | 2026-07-05 | 185.00 |

如果每页只显示 2 条，那么可以把同一个有序结果集切成：

```text
Page 1 → positions 1–2
Page 2 → positions 3–4
```

分页不是重新定义数据，也不是修改表结构。

它只是对已经确定的查询结果建立一个返回窗口。

<div data-learning-slot="pagination-lab"></div>

## LIMIT 定义页面最多返回多少行

最基本的限制写法：

```sql
SELECT
  order_id,
  customer_id,
  order_date,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2;
```

这里的 `LIMIT 2` 表示：

> 最多返回结果集前 2 行。

当前结果：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

如果完整结果本来只有 1 行，`LIMIT 2` 不会凭空补齐第二行。

因此 `LIMIT` 是上限，不是“必须返回固定数量”。

## OFFSET 定义先跳过多少行

第二页需要跳过第一页已经显示的 2 条记录：

```sql
SELECT
  order_id,
  customer_id,
  order_date,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 2;
```

可以拆成：

```text
OFFSET 2
→ 先跳过 positions 1–2

LIMIT 2
→ 再最多返回 2 行
```

当前第二页结果：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |

## 页码从 1 开始，OFFSET 从 0 开始

这是最容易混淆的地方之一。

业务界面通常使用：

```text
Page 1
Page 2
Page 3
```

但 `OFFSET` 表示跳过多少行，因此第一页不需要跳过任何记录：

```text
Page 1 → OFFSET 0
Page 2 → OFFSET 2
Page 3 → OFFSET 4
```

如果：

```text
pageSize  = 每页行数
pageIndex = 当前页码，从 1 开始
```

那么：

```text
OFFSET = pageSize × (pageIndex - 1)
```

例如每页 2 条、查询第 2 页：

```text
OFFSET = 2 × (2 - 1)
       = 2
```

对应：

```sql
LIMIT 2 OFFSET 2
```

## 总页数来自总记录数与 pageSize

如果当前查询一共有 4 条记录，每页 2 条：

```text
totalRows = 4
pageSize  = 2
```

总页数：

```text
totalPages = CEILING(totalRows / pageSize)
           = CEILING(4 / 2)
           = 2
```

如果共有 5 条记录，每页 2 条：

```text
totalPages = CEILING(5 / 2)
           = 3
```

最后一页可以只有 1 条。

SQL 查询常常需要单独计算总记录数：

```sql
SELECT COUNT(*) AS total_rows
FROM orders;
```

然后应用层根据 `total_rows` 与 `pageSize` 计算页数。

需要注意：

> “查当前页”与“计算完整结果总数”是两个不同任务。

大型查询中，`COUNT(*)` 本身也可能带来计算成本，因此不能默认“总页数永远免费”。

## 越界 OFFSET 通常返回空结果，而不是报错

当前有 4 条订单。

如果每页 2 条，但请求第 3 页：

```sql
SELECT
  order_id,
  customer_id,
  order_date,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 4;
```

这里已经跳过全部 4 行。

因此结果是：

```text
0 rows
```

这通常不是 SQL 错误。

它只是说明当前窗口已经落在结果集末尾之后。

应用层可以把这种状态解释为：

```text
空页
越界页
当前筛选条件下没有更多结果
```

## Pagination 必须建立在稳定 ORDER BY 上

分页最危险的误解之一，是认为：

```sql
SELECT *
FROM orders
LIMIT 2 OFFSET 2;
```

天然代表“第二页”。

这条语句确实会限制返回范围，但没有定义一个可依赖的结果顺序。

没有 `ORDER BY` 时：

```text
第 1 页最后一条是谁
第 2 页第一条是谁
同一条记录会不会在执行计划变化后移动位置
```

都没有足够明确的查询契约。

因此稳定分页通常至少需要：

```sql
ORDER BY <business_sort_key>, <unique_tie_breaker>
LIMIT <page_size>
OFFSET <offset>;
```

当前示例使用：

```sql
ORDER BY order_value DESC, order_id ASC
```

其中：

```text
order_value DESC
→ 业务排序键

order_id ASC
→ 唯一 tie-breaker
```

即使未来出现两张金额相同的订单，`order_id` 仍然能够形成确定顺序。

## 只有业务排序键，仍可能产生跨页并列问题

假设大量订单具有相同 `order_value`。

如果只写：

```sql
ORDER BY order_value DESC
```

数据库只需要保证较大金额排在较小金额前面。

同金额记录之间的先后并没有被完整声明。

如果分页边界恰好切在一组并列值中间，那么不同执行环境可能把这些并列记录分配到不同页面位置。

因此需要稳定分页时，应增加能够最终打破并列的唯一键：

```sql
ORDER BY order_value DESC, order_id ASC
```

这也是上一章 ORDER BY 中“稳定排序契约”在分页中的直接应用。

## WHERE 先定义候选集合，再对筛选结果分页

分页通常不会独立出现。

例如：

> 只查看金额至少为 400 的订单，按金额从高到低，并每页返回 2 条。

可以写成：

```sql
SELECT
  order_id,
  customer_id,
  order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 0;
```

当前候选记录有：

```text
50003 · 760
50004 · 510
50001 · 420
```

第一页：

```text
50003 · 760
50004 · 510
```

第二页：

```sql
...
LIMIT 2 OFFSET 2;
```

结果只剩：

```text
50001 · 420
```

这里需要重新计算：

```text
filtered totalRows = 3
pageSize           = 2
totalPages          = 2
```

因此：

> 分页的总记录数必须对应同一套 WHERE 条件，而不是整张表的总记录数。

## Projection、WHERE、ORDER BY 与 Pagination 可以形成完整查询管道

一个常见分析接口可能只需要输出：

```text
order_id
order_date
order_value
```

同时只保留高价值订单，并稳定分页：

```sql
SELECT
  order_id,
  order_date,
  order_value AS value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 0;
```

可以把职责分成四层：

```text
WHERE
决定哪些行有资格进入结果

Projection
决定输出哪些字段

ORDER BY
决定候选行的稳定顺序

LIMIT / OFFSET
决定当前只返回哪个窗口
```

这比把全部逻辑理解成“一条很长的 SQL”更容易检查。

## LIMIT 2 OFFSET 0 与 LIMIT 2

第一页：

```sql
LIMIT 2 OFFSET 0
```

通常可以简写为：

```sql
LIMIT 2
```

因为没有显式 `OFFSET` 时，相当于从结果开头开始。

不过在分页代码中，显式保留 `OFFSET 0` 有时更便于生成统一 SQL 模板：

```text
Page 1 → LIMIT 2 OFFSET 0
Page 2 → LIMIT 2 OFFSET 2
Page 3 → LIMIT 2 OFFSET 4
```

这样应用层不需要为第一页建立不同语句结构。

## MySQL 还支持逗号写法，但更容易读反

MySQL 支持：

```sql
LIMIT 2 OFFSET 4
```

也支持：

```sql
LIMIT 4, 2
```

逗号形式中的顺序是：

```text
LIMIT offset, row_count
```

而关键字形式是：

```text
LIMIT row_count OFFSET offset
```

两种形式的数字位置相反。

SQLite 文档也明确提醒这种逗号语法容易造成混淆。

因此长期分析 SQL 更适合优先使用：

```sql
LIMIT <page_size> OFFSET <offset>
```

语义更直接，也更容易跨环境复查。

## OFFSET 越深，数据库通常需要跳过越多记录

例如：

```sql
LIMIT 50 OFFSET 0
LIMIT 50 OFFSET 500
LIMIT 50 OFFSET 50000
LIMIT 50 OFFSET 5000000
```

从业务界面看，每次都只需要 50 条记录。

但从数据库执行角度看，深 OFFSET 常常意味着：

> 为了到达很靠后的窗口，需要先定位或处理大量前置记录，再把它们丢弃。

因此 `LIMIT/OFFSET` 很适合：

```text
结果规模有限的管理后台
页数不深的报表列表
探索性查询
简单静态数据集
```

但对于极深分页、大规模事件流或高频 API，性能可能逐渐恶化。

这不是 `LIMIT` 本身无效，而是 OFFSET 模型的成本结构发生了变化。

## 数据在翻页期间发生变化，会产生另一类问题

假设第一页已经返回：

```text
#1 50003
#2 50004
```

然后在读取第二页之前，一条更高金额的新订单插入到结果顶部。

原本的位置会整体向后移动：

```text
旧位置 1 → 新位置 2
旧位置 2 → 新位置 3
旧位置 3 → 新位置 4
...
```

如果第二页仍然使用固定：

```sql
LIMIT 2 OFFSET 2
```

就可能发生：

```text
上一页出现过的记录再次出现
或
某条记录被跳过
```

这类问题并不是 SQL 语法错误，而是：

> OFFSET 是基于“当前位置”的分页，而位置会随着结果集变化而变化。

因此实时、高频变化的数据需要更谨慎的分页策略。

## Keyset pagination 用“上一页最后一个键”继续向后找

当结果非常大、分页很深，或者数据持续变化时，可以考虑另一类策略：keyset pagination，也常被称为 cursor-style pagination。

如果排序契约是：

```sql
ORDER BY order_value DESC, order_id ASC
```

第一页最后一条记录是：

```text
order_value = 510
order_id    = 50004
```

下一页不再说“跳过前 2 条”，而是说：

> 从这个排序键之后继续读取。

概念形式可以写成：

```sql
SELECT
  order_id,
  customer_id,
  order_value
FROM orders
WHERE
  order_value < 510
  OR (order_value = 510 AND order_id > 50004)
ORDER BY order_value DESC, order_id ASC
LIMIT 2;
```

当前数据会得到：

```text
50001 · 420
50002 · 185
```

这种方法的重点不是背这段条件，而是理解：

```text
OFFSET pagination
→ 用“位置”继续

Keyset pagination
→ 用“最后一个排序键”继续
```

## Keyset pagination 不是永远更好

它也有明显边界。

适合：

```text
下一页 / 加载更多
大型时间序列
高频变化数据
深分页接口
稳定复合排序键
```

但如果业务要求：

```text
直接跳到第 187 页
显示精确页码导航
任意页快速跳转
```

OFFSET pagination 往往更直观。

因此分页策略应该由交互需求、数据规模、变动频率和性能要求共同决定，而不是只看哪一种语法更高级。

## Keyset pagination 依赖完整排序键

如果排序是：

```sql
ORDER BY order_value DESC, order_id ASC
```

cursor 也必须能够表达：

```text
order_value
order_id
```

只保存 `order_value = 510` 不够，因为未来可能存在多张相同金额的订单。

这再次说明：

> 稳定分页、tie-breaker 与 cursor 设计本质上是同一个结果排序问题的不同层面。

## 分页中的 COUNT 也要和查询口径一致

例如实际页面查询：

```sql
SELECT order_id, order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 0;
```

对应总数查询应该是：

```sql
SELECT COUNT(*) AS total_rows
FROM orders
WHERE order_value >= 400;
```

不能使用：

```sql
SELECT COUNT(*)
FROM orders;
```

因为它统计的是整张表，而不是当前筛选后的候选集合。

如果页面显示：

```text
3 results · 2 pages
```

那么这个数字必须和当前 WHERE 条件完全一致。

## 分页参数属于查询输入，需要验证

应用层常见输入：

```text
pageIndex
pageSize
cursor
```

需要明确规则，例如：

```text
pageIndex >= 1
pageSize > 0
pageSize 不能无限大
cursor 必须符合预期结构
```

如果允许任意巨大 `pageSize`，分页接口最终可能重新变成一次返回全部数据。

如果 `pageIndex` 小于 1，OFFSET 公式也会失去正常业务含义。

因此分页不仅是数据库语法问题，也是接口契约问题。

## Business Analytics 中 Pagination 常见在哪里

典型分析场景包括：

```text
交易明细浏览
客户列表
异常订单审查
日志或事件查看
数据质量问题清单
管理后台表格
报表 drill-through 明细
API 批量读取
大型结果导出前的分块处理
```

这些场景真正需要的是：

```text
稳定顺序
清晰过滤口径
可解释页大小
可重复页面边界
足够可控的查询成本
```

分页按钮本身只是这些数据契约的界面表现。

## 常见错误

### 1. 把 pageIndex 直接当 OFFSET

例如每页 20 条，第 3 页并不是：

```text
OFFSET 3
```

而是：

```text
OFFSET = 20 × (3 - 1) = 40
```

### 2. 忘记第一页 OFFSET 是 0

页码通常从 1 开始，但跳过行数从 0 开始。

### 3. 没有 ORDER BY 就开始分页

结果窗口缺乏稳定顺序契约。

### 4. 排序键有并列却没有唯一 tie-breaker

同值记录可能在分页边界上缺乏确定位置。

### 5. COUNT 使用了不同 WHERE 条件

页面显示的总行数与实际列表不一致。

### 6. 认为 OFFSET 越界一定报错

常见结果是空结果集。

### 7. 认为 LIMIT 10 一定返回 10 条

`LIMIT` 只是最大返回量。

### 8. 把 MySQL 的 LIMIT 4, 2 读成 LIMIT 4 OFFSET 2

逗号写法的两个数字顺序与关键字写法相反。

### 9. 深分页仍然机械增加 OFFSET

极深 OFFSET 可能产生明显性能成本。

### 10. 实时数据仍假设固定 OFFSET 页面不会移动

结果集变化可能导致重复或漏行。

## 分页查询可以按这个顺序检查

```text
1. 先明确完整候选集合：WHERE 是什么？
2. 明确稳定排序：业务排序键是什么？
3. 是否有唯一 tie-breaker？
4. pageSize 是多少？
5. pageIndex 是否从 1 开始？
6. OFFSET 是否按 pageSize × (pageIndex - 1) 计算？
7. 总行数 COUNT 是否使用相同过滤条件？
8. 越界页如何解释？
9. 数据规模是否已经进入深 OFFSET 区域？
10. 数据是否频繁变化，需要 cursor/keyset？
```

## 核心判断

Pagination 的核心不是记住：

```sql
LIMIT 20 OFFSET 40
```

而是建立下面这条完整逻辑：

```text
先定义候选行
→ 建立稳定排序
→ 计算页面窗口
→ 返回有限记录
→ 保持总数与过滤口径一致
→ 在深分页或实时数据中重新评估 OFFSET 策略
```

一句话总结：

> **Pagination 是对稳定结果集建立窗口契约；LIMIT 决定窗口大小，OFFSET 决定窗口起点，而可靠分页依赖稳定排序、正确口径与适合数据规模的分页策略。**

下一篇进入 Aggregation：不再逐行返回明细，而是开始使用 `COUNT`、`SUM`、`AVG`、`MIN` 与 `MAX` 把多行数据压缩成分析指标。
