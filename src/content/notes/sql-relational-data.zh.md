---
translationKey: sql-relational-data
locale: zh
slug: sql-relational-data
title: SQL 与关系数据
summary: 从表、记录、字段、数据类型与记录粒度开始，理解关系数据库如何把业务对象拆成结构清晰的数据表，并为后续主键、外键与 SQL 查询建立基础。
tags:
  - 关系模型
  - 数据表
  - 记录粒度
  - "NULL"
topics:
  - 数据管理
  - 数据建模
  - 数据理解
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 1
publishedAt: 2026-08-10
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-primary-key
---

## 关系数据库为什么不是一个“大表”？

业务数据通常同时包含客户、订单、产品、仓库、运输和服务事件等不同对象。如果把所有内容都塞进一张表，很多信息会被重复保存，字段含义也会逐渐变得混乱。

关系数据库更常见的做法，是把不同业务对象拆成多张结构清晰的表，再通过稳定的字段把这些表连接起来。

例如，一个简单的分析场景可以包含：

```text
customers
orders
products
shipments
```

它们不是四份互不相关的数据，而是同一个业务系统中的不同实体。

```text
客户
↓
产生订单
↓
订单包含产品
↓
订单经过仓库与运输流程
```

理解关系数据库的第一步，不是先写 `SELECT`，而是先看懂：**每一张表到底在表达什么。**

## 一行到底代表什么？

假设客户表如下：

| customer_id | customer_name | email | segment |
|---:|---|---|---|
| 1001 | North Retail | north@example.com | Retail |
| 1002 | Coast Foods | coast@example.com | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | Enterprise |

这里每一行代表一个客户。

因此这张表的记录粒度（observation granularity）可以写成：

> **One row = one customer**

如果另一张订单表是：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |

它的粒度则是：

> **One row = one order**

两张表都出现了 `customer_id`，但它们的行并不代表同一种业务对象。

这一点非常重要。后续无论做筛选、聚合、连接还是 KPI 计算，都必须先知道当前表的一行代表什么。

## 行、列与字段分别在表达什么？

关系表可以从两个方向理解。

### 行：一个具体业务实例

在 `customers` 中，一行可以代表一个具体客户。

在 `orders` 中，一行可以代表一张具体订单。

在 `shipments` 中，一行可能代表一次运输任务。

### 列：这个对象具有哪些属性

例如客户可能拥有：

```text
customer_name
email
segment
```

订单可能拥有：

```text
order_date
order_value
customer_id
```

所以一张关系表不是一个随意排列的二维表格，而是在表达：

```text
同一种业务对象
+
固定的一组属性
+
多条具体记录
```

## 字段名称只是开始，数据类型同样重要

数据库还需要知道每个字段可以保存什么类型的数据。

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT,
  segment TEXT
);
```

这里：

- `customer_id` 使用整数；
- `customer_name` 使用文本；
- `email` 使用文本；
- `segment` 使用文本。

订单表则可能包含：

```sql
CREATE TABLE orders (
  order_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  order_value REAL NOT NULL
);
```

不同数据库对日期、数字和文本类型的具体名称可能不同，但设计逻辑一致：**字段类型应该与它表达的数据含义一致。**

如果订单金额被保存成普通文本，后续求和、排序和比较就会变得不自然；如果日期没有稳定的日期表达方式，时间分析也容易出错。

## NULL 到底表示什么？

`NULL` 表示字段值不存在或当前未知。

它不是：

```text
0
```

也不是：

```text
''
```

空字符串仍然是一个字符串值，而 `NULL` 表示没有可用值。

例如：

| customer_id | customer_name | phone |
|---:|---|---|
| 1001 | North Retail | 021-440-810 |
| 1002 | Coast Foods | NULL |

这里 `Coast Foods` 的电话字段不是数字 0，也不是空白字符，而是数据库当前没有这个值。

因此，数据库设计时需要判断哪些字段必须存在。

```sql
customer_name TEXT NOT NULL
```

表示客户名称不能缺失。

而某些可选字段可以允许 `NULL`。

## 表结构和表中的数据是两件事

可以把关系表拆成两个层次理解。

### Schema：规定这张表长什么样

例如：

```text
customers
├── customer_id
├── customer_name
├── email
└── segment
```

它描述的是字段、数据类型和约束。

### Data：实际保存在表里的记录

例如：

```text
1001 | North Retail | north@example.com | Retail
1002 | Coast Foods  | coast@example.com | Wholesale
```

当业务记录不断增加时，数据会变化，但表结构通常不会因为每新增一行就重新设计。

这就是为什么数据库建模通常先定义 schema，再持续写入业务数据。

## 为什么同一个信息不应该到处重复？

假设把客户名称直接重复写进每一张订单：

| order_id | customer_name | order_date | order_value |
|---:|---|---|---:|
| 50001 | North Retail | 2026-07-03 | 420.00 |
| 50002 | North Retail | 2026-07-05 | 185.00 |
| 50003 | Coast Foods | 2026-07-06 | 760.00 |

如果 `North Retail` 将来修改名称，那么历史订单中的客户名称也可能需要逐行修改。

更稳定的思路是让客户信息保存在客户表，订单只保存与客户之间的连接字段。

```text
customers
1001 | North Retail

orders
50001 | 1001
50002 | 1001
```

这样“客户是谁”和“发生了哪些订单”由不同表分别负责。

关系数据库的价值之一，就是让每张表聚焦于自己的业务实体，而不是不断复制其他实体的完整信息。

## 多张表是如何组成一个业务模型的？

下面是一组很小的 Business Analytics 数据结构：

```text
customers
    │
    └── orders
          │
          └── order_items
                 │
                 └── products
```

从分析角度看，这几张表可以回答不同问题：

| 表 | 一行代表 | 可以回答的问题 |
|---|---|---|
| customers | 一个客户 | 客户属于哪个 segment？ |
| orders | 一张订单 | 哪天产生了多少订单金额？ |
| order_items | 一张订单中的一个产品明细 | 某订单买了哪些产品？ |
| products | 一个产品 | 产品属于哪个类别？ |

当每张表的粒度清楚以后，后续 SQL 才能判断应该从哪张表开始查询，以及不同表连接后会不会改变记录数量。

## SQL 查询为什么依赖正确的数据结构？

假设目标是计算每个客户的订单总额。

最终可能需要类似：

```sql
SELECT
  customer_id,
  SUM(order_value) AS total_value
FROM orders
GROUP BY customer_id;
```

这段查询之所以有意义，是因为前面已经知道：

```text
orders
One row = one order
```

如果一行其实代表订单明细，而不是整张订单，那么同样的求和逻辑可能产生完全不同的业务解释。

所以 SQL 分析不能只看语法。

更稳妥的顺序是：

```text
先理解业务对象
↓
确认一行代表什么
↓
确认字段含义和数据类型
↓
理解表之间的关系
↓
最后写查询
```

## 建表前可以先问这几个问题

面对一份新的业务数据，可以先检查：

1. **这张表保存的业务对象是什么？**
2. **一行代表什么？**
3. **哪些列是这个对象的属性？**
4. **哪些字段必须有值？**
5. **哪些字段可能为空？**
6. **哪些信息应该放在另一张表，而不是重复保存？**
7. **这张表以后需要和哪些表发生关系？**

这些问题解决以后，表结构通常已经清晰很多。

## 关系模型接下来还缺什么？

到这里，关系数据库利用多张表表达不同业务实体的基本思路已经清楚，但还没有解决一个关键问题：

> **如果一张表中有几千甚至几百万条记录，数据库怎样稳定地确认“这一行到底是谁”？**

例如客户表中：

```text
North Retail
Coast Foods
Alpine Labs
```

客户名称可能修改，也可能出现相同名称。

因此，关系模型还需要一种稳定机制，为每一条记录建立唯一身份。

这就是下一篇的主题：

```text
SQL 02 — Primary Key
```

主键解决“这条记录是谁”，之后外键再继续解决“这条记录与哪一条记录有关”。
