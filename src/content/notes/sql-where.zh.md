---
translationKey: sql-where
locale: zh
slug: sql-where
title: WHERE：把业务条件翻译成可验证的记录筛选
summary: 从订单金额与客户属性出发，理解 WHERE 如何通过比较运算、AND、OR、NOT、括号、LIKE、BETWEEN、IN 与 NULL 判断筛选记录，并避免范围条件、优先级和空值判断中的常见错误。
tags:
  - WHERE
  - 条件查询
  - 布尔逻辑
  - 数据筛选
topics:
  - 数据查询
  - 数据理解
  - SQL 基础
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 6
publishedAt: 2026-08-10
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-select
---

## 从“读取整张表”进入“只保留需要的记录”

SQL 05 的基础查询：

```sql
SELECT *
FROM orders;
```

会读取当前订单表中的全部记录。

但真实分析更常见的问题是：

```text
哪些订单金额至少为 500？
哪些客户属于 Retail？
哪些订单同时满足多个条件？
哪些客户名称符合某个文本模式？
哪些记录的字段缺失？
```

这些问题都需要把业务条件翻译成：

```sql
WHERE <condition>
```

最基本的结构是：

```sql
SELECT *
FROM <table>
WHERE <condition>;
```

`WHERE` 决定哪些输入行能够进入结果集。

## WHERE 改变的是结果集的“行”

统一数据集中的 `orders` 有四行：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

执行：

```sql
SELECT *
FROM orders
WHERE order_value >= 500;
```

逐行判断：

```text
50001 · 420 >= 500  → false
50002 · 185 >= 500  → false
50003 · 760 >= 500  → true
50004 · 510 >= 500  → true
```

因此结果是：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

结果仍然保持：

```text
One row = one order
```

只是从 4 rows 缩小为 2 rows。

<div data-learning-slot="where-filter-lab"></div>

## 比较运算符是条件表达式的基础

常见比较条件包括：

| 运算符 | 含义 | 示例 |
|---|---|---|
| `=` | 等于 | `customer_id = 1001` |
| `<>` | 不等于 | `segment <> 'Wholesale'` |
| `>` | 大于 | `order_value > 500` |
| `>=` | 大于或等于 | `order_value >= 500` |
| `<` | 小于 | `order_value < 500` |
| `<=` | 小于或等于 | `order_value <= 500` |

例如：

```sql
SELECT *
FROM orders
WHERE customer_id = 1001;
```

会返回：

```text
50001
50002
```

因为两张订单都属于客户 1001。

### `<>` 和 `!=` 有什么区别？

标准 SQL 常用：

```sql
<>
```

表示“不等于”。

SQLite、MySQL、PostgreSQL 等系统通常也接受：

```sql
!=
```

但为了让示例更接近标准 SQL，本系列统一优先使用 `<>`。

## 文本值为什么要使用单引号？

数值条件：

```sql
WHERE order_value >= 500
```

字符串条件则写成：

```sql
WHERE segment = 'Retail'
```

这里：

```text
segment
→ column name

'Retail'
→ string literal
```

把文本值写成：

```sql
WHERE segment = Retail
```

数据库通常会把 `Retail` 当成标识符，而不是字符串值。

因此，字符串 literal 应使用单引号。

## AND：所有条件都必须成立

假设需要找出：

> 金额至少为 400，并且客户不是 1002 的订单。

可以写成：

```sql
SELECT *
FROM orders
WHERE order_value >= 400
  AND customer_id <> 1002;
```

逐行检查：

```text
50001 · 420 · customer 1001 → true  AND true  → keep
50002 · 185 · customer 1001 → false AND true  → remove
50003 · 760 · customer 1002 → true  AND false → remove
50004 · 510 · customer 1003 → true  AND true  → keep
```

结果：

```text
50001
50004
```

`AND` 会让条件变得更严格。

## OR：任意一个条件成立即可

如果问题改成：

> 客户 1001 的订单，或者金额至少为 700 的订单。

可以写成：

```sql
SELECT *
FROM orders
WHERE customer_id = 1001
   OR order_value >= 700;
```

结果：

```text
50001
50002
50003
```

`50003` 虽然不属于客户 1001，但满足：

```text
order_value = 760 >= 700
```

因此仍然进入结果集。

与 `AND` 相比，`OR` 通常会扩大符合条件的记录集合。

## NOT：对一个条件取反

例如，需要排除 Wholesale 客户：

```sql
SELECT *
FROM customers
WHERE NOT segment = 'Wholesale';
```

当前结果是：

```text
North Retail
Alpine Labs
```

这个例子也可以写成：

```sql
SELECT *
FROM customers
WHERE segment <> 'Wholesale';
```

对于简单“不等于”条件，`<>` 通常更直接；`NOT` 更有价值的地方是在复杂条件或 `NOT IN`、`NOT LIKE` 等结构中表达否定逻辑。

## NOT、AND、OR 有优先级

当多个逻辑运算符出现在同一个 `WHERE` 中，不能只按从左到右阅读。

常见优先级是：

```text
NOT
↓
AND
↓
OR
```

例如：

```sql
WHERE customer_id = 1001
   OR order_value >= 500
  AND customer_id = 1003
```

数据库会先处理：

```sql
order_value >= 500
AND customer_id = 1003
```

再与：

```sql
customer_id = 1001
```

执行 OR。

当前结果是：

```text
50001
50002
50004
```

## 括号比记忆优先级更可靠

如果真正的业务规则是：

> 先找出“客户 1001 或金额至少为 500”的订单，再要求这些订单必须属于客户 1003。

必须明确写成：

```sql
SELECT *
FROM orders
WHERE (
        customer_id = 1001
        OR order_value >= 500
      )
  AND customer_id = 1003;
```

结果只剩：

```text
50004
```

括号不仅可以改变运算优先级，也能让业务逻辑更容易被复查。

复杂 `WHERE` 的推荐原则不是“尽量少写括号”，而是：

> **让逻辑结构一眼可以读懂。**

## 范围条件为什么经常写错？

假设需要：

> `order_value` 在 400 到 600 之间，包含边界。

正确写法之一是：

```sql
WHERE order_value >= 400
  AND order_value <= 600
```

当前结果：

```text
50001 · 420
50004 · 510
```

### 为什么这里不能使用 OR？

错误条件：

```sql
WHERE order_value >= 400
   OR order_value <= 600
```

几乎所有数值都会满足至少一个条件。

例如：

```text
760 >= 400 → true
185 <= 600 → true
```

所以这个 OR 无法表达“落在两个边界之间”。

区间条件需要同时满足下界与上界，因此应使用 `AND`。

## BETWEEN：更直接地表达闭区间

同一个范围也可以写成：

```sql
SELECT *
FROM orders
WHERE order_value BETWEEN 400 AND 600;
```

`BETWEEN` 在这里包含两端边界，相当于：

```sql
order_value >= 400
AND order_value <= 600
```

因此 `420` 与 `510` 会被保留。

需要特别记住：

```text
BETWEEN lower AND upper
→ inclusive boundaries
```

## 为什么不能写 400 <= order_value <= 600？

数学中可以写：

```text
400 ≤ x ≤ 600
```

但 SQL 不应该直接照搬成：

```sql
WHERE 400 <= order_value <= 600
```

SQL 会按数据库自己的表达式规则逐步计算，而不是把它理解成数学中的链式不等式。

可靠写法是：

```sql
WHERE order_value >= 400
  AND order_value <= 600
```

或者：

```sql
WHERE order_value BETWEEN 400 AND 600
```

## IN：一个字段允许落在多个离散值中

如果只需要 Retail 和 Enterprise 客户：

```sql
SELECT *
FROM customers
WHERE segment IN ('Retail', 'Enterprise');
```

当前结果：

```text
North Retail
Alpine Labs
```

它等价于：

```sql
WHERE segment = 'Retail'
   OR segment = 'Enterprise'
```

当候选值较多时，`IN (...)` 更紧凑，也更容易维护。

## LIKE：按文本模式筛选

精确相等：

```sql
WHERE customer_name = 'Coast Foods'
```

要求整个值匹配。

如果需要按模式查找，可以使用 `LIKE`。

例如：

```sql
SELECT *
FROM customers
WHERE customer_name LIKE 'Coast%';
```

`%` 表示零个或多个字符，因此当前匹配：

```text
Coast Foods
```

常见模式：

| 条件 | 含义 |
|---|---|
| `LIKE 'Coast%'` | 以 Coast 开头 |
| `LIKE '%Retail'` | 以 Retail 结尾 |
| `LIKE '%o%'` | 中间任意位置包含 o |
| `LIKE '_oast Foods'` | `_` 匹配一个字符 |

需要注意：`LIKE` 的大小写行为、字符排序与 collation 规则会随数据库与配置变化。不能把某个数据库当前的文本匹配行为当作所有 SQL 系统的统一规则。

## NULL 不能用 = NULL 判断

SQL 01 已经区分：

```text
NULL
≠
0
≠
''
```

筛选空值时也需要使用专门语法：

```sql
WHERE phone IS NULL
```

以及：

```sql
WHERE phone IS NOT NULL
```

不应写成：

```sql
WHERE phone = NULL
```

原因是 `NULL` 表示未知或不存在的值。SQL 中与 `NULL` 的普通相等比较不会得到普通的 true，而会进入 unknown 语义。

当前 canonical customers 数据没有缺失 phone，因此：

```sql
SELECT *
FROM customers
WHERE phone IS NULL;
```

会返回：

```text
0 rows
```

这个空结果不是错误，而是在回答：

> 当前数据中没有满足 `phone IS NULL` 的记录。

## WHERE 中存在三值逻辑

普通条件容易被理解成：

```text
TRUE / FALSE
```

但 SQL 对 NULL 的判断还可能得到：

```text
UNKNOWN
```

`WHERE` 最终只保留条件结果为 TRUE 的行。

因此，如果某字段可能为 NULL，下面的写法需要特别谨慎：

```sql
WHERE phone <> '021-440-810'
```

它并不会自动把 NULL 当成“肯定不等于这个号码”。

如果业务规则明确要求同时保留 NULL，需要显式表达：

```sql
WHERE phone <> '021-440-810'
   OR phone IS NULL
```

这也是数据分析中非常常见的筛选陷阱。

## WHERE 和 ORDER BY 解决的不是同一个问题

下面两个问题完全不同：

```text
哪些订单进入结果集？
→ WHERE

结果应该按什么顺序展示？
→ ORDER BY
```

例如：

```sql
SELECT *
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC;
```

执行逻辑可以先这样理解：

```text
FROM orders
↓
WHERE 保留符合条件的行
↓
ORDER BY 决定结果顺序
```

SQL 08 会专门讨论排序。

仅仅使用 `WHERE` 并不会保证结果按金额、ID 或日期自动排序。

## 在浏览器里实际运行这些条件

下面的 SQLite 实验仍然使用 SQL 01–05 的同一份 canonical dataset。

预设包括：

```text
order_value >= 500
AND
OR
括号优先级
BETWEEN
IN
LIKE
IS NULL
```

可以直接修改 SQL，再观察：

```text
输入条件
↓
返回多少 rows
↓
具体保留哪些记录
```

<div data-learning-slot="sql-playground"></div>

## WHERE 不等于“查询一定很快”

从逻辑上看，`WHERE` 会减少最终返回的记录。

但不能简单推导成：

> 写了 WHERE，数据库就一定只读取满足条件的几行。

数据库实际如何访问数据，取决于：

- 表规模；
- 索引；
- 查询优化器；
- 条件选择性；
- 统计信息；
- 数据库实现。

在没有合适索引时，数据库可能仍然需要扫描大量记录才能找出最终符合条件的行。

因此应区分：

```text
WHERE
→ 定义“结果应该保留哪些记录”

Index / query plan
→ 影响“数据库怎样找到这些记录”
```

索引会在 SQL 17 单独讨论。

## Business Analytics 中的 WHERE 通常来自业务规则

分析任务中的筛选条件往往不是技术条件，而是业务口径。

例如：

```text
只分析金额至少 500 的订单
→ order_value >= 500

只分析 Retail / Enterprise 客户
→ segment IN ('Retail', 'Enterprise')

排除 Wholesale
→ segment <> 'Wholesale'

检查缺失联系方式
→ phone IS NULL

识别 Coast 开头的客户名称
→ customer_name LIKE 'Coast%'
```

因此，写 `WHERE` 前最重要的问题是：

> **业务规则到底是什么？边界是否包含？多个条件是同时成立还是满足任意一个？NULL 应该保留还是排除？**

SQL 只是把这个规则形式化。

## 常见错误

### 用 OR 表示区间

```sql
WHERE order_value >= 400
   OR order_value <= 600
```

这不是“400 到 600”。

### 直接写链式不等式

```sql
WHERE 400 <= order_value <= 600
```

不要把数学写法直接照搬为 SQL。

### 忘记字符串单引号

```sql
WHERE segment = Retail
```

应该写成：

```sql
WHERE segment = 'Retail'
```

### 把 = NULL 当作空值判断

```sql
WHERE phone = NULL
```

应该使用：

```sql
WHERE phone IS NULL
```

### 混合 AND 与 OR 却不检查优先级

```sql
A OR B AND C
```

并不等于：

```sql
(A OR B) AND C
```

### 认为 WHERE 会自动排序

筛选与排序是两个不同操作。

### 认为 0 rows 就一定是查询失败

没有符合条件的记录时，空结果集本身就是一个有效结果。

## 条件查询可以按这个顺序检查

面对一个新的筛选任务，可以依次问：

1. **要从哪张表开始？**
2. **一行代表什么？**
3. **筛选字段是什么类型？**
4. **边界使用 `>` 还是 `>=`？**
5. **多个条件需要 AND 还是 OR？**
6. **是否应该用括号明确优先级？**
7. **离散候选值是否适合 IN？**
8. **连续区间是否适合 BETWEEN？**
9. **文本是否需要 LIKE？**
10. **NULL 应该保留、排除还是单独检查？**
11. **结果顺序是否还需要 ORDER BY？**
12. **返回行数是否符合业务预期？**

## 本篇的核心判断

`WHERE` 的本质不是“在 SQL 后面加一个条件”，而是：

> **把业务筛选规则转换成数据库可以逐行判断的逻辑表达式。**

核心结构可以压缩成：

```text
comparison
+
AND / OR / NOT
+
parentheses
+
BETWEEN / IN / LIKE
+
IS NULL / IS NOT NULL
```

最后始终检查：

```text
哪些行被保留？
哪些行被排除？
为什么？
```

## 下一步：不只筛选行，还要选择列

到 SQL 06 为止：

```text
SELECT *
→ 读取所有列

WHERE
→ 只保留满足条件的行
```

下一篇 SQL 07 将进入：

```text
Projection
```

也就是：

```text
只返回需要的列
+
为表达式和结果字段建立清晰名称
```
