---
translationKey: sql-where
locale: zh
slug: sql-where
title: WHERE 筛选
summary: SELECT 决定看哪些数据，WHERE 决定哪些记录能留下。这里用订单金额和客户类型练习比较条件、AND、OR、BETWEEN、IN、LIKE 和 NULL 判断。
tags:
  - WHERE
  - 条件筛选
  - SQL 查询
  - 布尔逻辑
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
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-select
  - sql-projection
---

## WHERE 改变的是结果集的“行”

`SELECT * FROM orders` 会把当前订单全部读出来。如果只关心金额至少 500 的订单，就需要在查询后面加条件：

```sql
SELECT *
FROM orders
WHERE order_value >= 500;
```

当前数据里会留下：

```text
50003 | 760
50004 | 510
```

WHERE 的作用可以先记成一句话：**它决定哪些记录能进入结果集。**

<div data-learning-slot="where-filter-lab"></div>

## 比较运算符是条件表达式的基础

最常见的比较包括：

```text
=    等于
<>   不等于
>    大于
>=   大于等于
<    小于
<=   小于等于
```

例如：

```sql
SELECT *
FROM orders
WHERE customer_id = 1001;
```

返回客户 1001 的两张订单。

再例如：

```sql
SELECT *
FROM orders
WHERE order_value < 500;
```

会返回 420 和 185 两张订单。

条件写对以后，SQL 对每一行判断真假，只把满足条件的记录留下。

## AND：所有条件都必须成立

如果既要求金额至少 400，又要求客户是 1001：

```sql
SELECT *
FROM orders
WHERE order_value >= 400
  AND customer_id = 1001;
```

只有同时满足两个条件的订单才会保留。

可以把 AND 理解成集合交集：

```text
条件 A 成立
并且
条件 B 也成立
```

条件越多，结果通常越窄。

## OR：任意一个条件成立即可

如果需要 Retail 或 Enterprise 客户：

```sql
SELECT *
FROM customers
WHERE segment = 'Retail'
   OR segment = 'Enterprise';
```

这里任意一个条件为真，记录就会留下。

OR 经常让结果变宽，所以多个 OR 混在一起时尤其要注意括号和逻辑优先级。

## NOT：对一个条件取反

如果想排除 Retail：

```sql
SELECT *
FROM customers
WHERE NOT segment = 'Retail';
```

也可以写成：

```sql
WHERE segment <> 'Retail'
```

对于复杂条件，NOT 的价值更明显：

```sql
WHERE NOT (order_value BETWEEN 400 AND 600)
```

表示保留不在这个区间内的订单。

## NOT、AND、OR 有优先级

下面这条查询很容易被误读：

```sql
WHERE segment = 'Retail'
   OR segment = 'Enterprise'
  AND customer_id > 1001
```

SQL 通常先计算 `NOT`，再计算 `AND`，最后计算 `OR`。所以实际逻辑不是简单地从左到右。

更安全的写法是主动加括号：

```sql
WHERE (segment = 'Retail' OR segment = 'Enterprise')
  AND customer_id > 1001;
```

只要条件中同时出现 AND 和 OR，就值得把分组写清楚。这样不仅数据库更明确，人读起来也不需要猜。

## BETWEEN：更直接地表达闭区间

要筛选 400 到 600 之间的订单，可以写：

```sql
SELECT *
FROM orders
WHERE order_value BETWEEN 400 AND 600;
```

这等价于：

```sql
WHERE order_value >= 400
  AND order_value <= 600
```

所以 `BETWEEN 400 AND 600` 包含两端。

当前数据会返回：

```text
50001 | 420
50004 | 510
```

区间边界是否包含，经常会影响结果数量，最好不要靠直觉猜。

## IN：一个字段允许落在多个离散值中

如果需要多个 segment，与其连续写很多 OR：

```sql
WHERE segment = 'Retail'
   OR segment = 'Enterprise'
```

可以直接写：

```sql
WHERE segment IN ('Retail', 'Enterprise');
```

`IN` 很适合一组明确的离散取值，尤其是筛选产品 ID、地区、状态或分类。

反向排除可以使用：

```sql
WHERE segment NOT IN ('Retail', 'Enterprise');
```

不过只要字段可能出现 NULL，就要记得三值逻辑会影响 `NOT IN` 的结果，不能把它简单当成所有场景下的“反选”。

## LIKE：按文本模式筛选

文本筛选常用 `LIKE`。

例如客户名称以 `North` 开头：

```sql
SELECT *
FROM customers
WHERE customer_name LIKE 'North%';
```

`%` 表示任意长度的字符序列。

再例如：

```sql
WHERE customer_name LIKE '%Retail%'
```

表示文本中包含 `Retail`。

下划线 `_` 通常表示单个任意字符：

```sql
LIKE 'A_1'
```

不同数据库对大小写敏感、排序规则和 pattern matching 的细节可能不同，所以正式系统中需要看具体数据库行为。

## NULL 不能用 = NULL 判断

这是 SQL 初学时最容易踩的坑之一。

错误写法：

```sql
WHERE phone = NULL
```

正确写法：

```sql
WHERE phone IS NULL
```

反过来：

```sql
WHERE phone IS NOT NULL
```

原因是 NULL 不是普通值。它代表未知或缺失，所以“某个值是否等于未知”并不会得到普通的 TRUE/FALSE。

## WHERE 中存在三值逻辑

SQL 条件不只有 TRUE 和 FALSE，还可能得到 UNKNOWN。

例如：

```sql
NULL = 100
```

不是 FALSE，而是 UNKNOWN。

WHERE 只保留判断结果为 TRUE 的记录。FALSE 和 UNKNOWN 都不会进入结果。

这会影响很多带 NULL 的表达式，例如：

```sql
WHERE amount > 100
```

如果 amount 是 NULL，这条记录不会留下，因为结果不是 TRUE。

理解三值逻辑以后，很多“为什么少了一行”的问题就不会显得神秘。

## 字符串和数字的引号不要混

数字条件通常直接写：

```sql
WHERE order_value >= 500
```

文本则用单引号：

```sql
WHERE segment = 'Retail'
```

把数字全部写成字符串，或者把文本忘记加引号，有些数据库会尝试隐式转换，有些会直接报错。即使能够运行，也不值得依赖不清楚的类型转换。

## 日期筛选要先看数据库怎样存日期

当前 SQLite 示例用 ISO 格式文本：

```text
2026-07-03
2026-07-05
```

因为格式是 `YYYY-MM-DD`，按字典顺序比较也能保持日期顺序。

例如：

```sql
SELECT *
FROM orders
WHERE order_date >= '2026-07-05';
```

不过生产数据库更可能使用专门的 DATE / TIMESTAMP 类型。日期函数、时区和边界行为都应按具体数据库处理。

## WHERE 不会自动改变排序

查询：

```sql
SELECT *
FROM orders
WHERE order_value >= 400;
```

只负责筛选记录，不保证返回顺序。

如果后面要按金额从高到低，就需要：

```sql
ORDER BY order_value DESC
```

把筛选和排序分开理解，可以避免把当前看到的偶然行序当成 SQL 保证。

## 条件写复杂时，先分块验证

假设最终条件是：

```sql
WHERE order_value BETWEEN 400 AND 600
  AND customer_id IN (1001, 1003)
```

如果结果不符合预期，可以先单独运行：

```sql
WHERE order_value BETWEEN 400 AND 600
```

再运行：

```sql
WHERE customer_id IN (1001, 1003)
```

最后合起来。

这种做法比在一条很长的查询里反复猜哪一个括号错了更快。

## WHERE 最容易出现的几种错误

- AND / OR 没有按预期加括号；
- 把 `NULL` 写成 `= NULL`；
- 把 `BETWEEN` 的两端误以为不包含；
- 文本忘记单引号；
- 依赖数据库隐式类型转换；
- 筛选条件和业务口径不一致；
- 把 WHERE 当成排序工具。

## 一套简单的筛选检查顺序

1. 先写最基础的 SELECT 和 FROM；
2. 一次加一个 WHERE 条件；
3. 检查比较符号和边界；
4. AND / OR 混用时加括号；
5. NULL 使用 `IS NULL` / `IS NOT NULL`；
6. 对日期、文本和数字确认数据类型；
7. 核对结果行数是否符合业务预期。

WHERE 最终做的事情很单纯：判断每一行是否应该留下。条件写得越复杂，越值得把业务规则先说清楚，再翻成 SQL。下一篇会转向另一个方向：不是删掉哪些行，而是决定**结果里到底要显示哪些列。**