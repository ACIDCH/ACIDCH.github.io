---
translationKey: sql-relational-data
locale: zh
slug: sql-relational-data
title: SQL 与关系数据
summary: 从关系表、主键、外键与索引开始，理解关系数据库如何唯一标识记录、连接业务实体，并把稳定的数据结构转化为可复查的 SQL 查询。
tags:
  - 关系模型
  - 主键
  - 外键
  - 索引
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
relatedNotes: []
---

## 关系表到底在保存什么？

关系数据库最基本的结构不是“一个大文件”，而是一组彼此有关联的二维表。每一行是一条 **记录（record）**，每一列是一个 **字段（column）**。字段除了名称，还带有数据类型以及是否允许为空等约束。

以一个简单的客户表为例：

| customer_id | customer_name | email | segment |
|---:|---|---|---|
| 1001 | North Retail | north@example.com | Retail |
| 1002 | Coast Foods | coast@example.com | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | Enterprise |

这里每一行代表一个客户，而不是一次订单、一次访问或一个月的汇总。也就是说，在任何 SQL 分析开始之前，先要明确：**一行到底代表什么业务对象。** 这就是关系数据中的记录粒度。

如果另一张表记录订单：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |

此时，一行代表一张订单。`customers` 与 `orders` 保存的是两个不同粒度的业务实体。SQL 后续的筛选、聚合和连接是否正确，很大程度上取决于这一步有没有分清。

### 字段与 NULL

`NULL` 表示字段值不存在或未知，它不等于数字 `0`，也不等于空字符串 `''`。因此，设计字段时不应该把 `NULL` 当成普通数值处理。

对于关键字段，例如主键、订单金额、必须存在的客户名称，通常应明确设置 `NOT NULL`。这样既能减少歧义，也能让后续查询逻辑更加清晰。

## 主键：怎样唯一定位一条记录？

关系表最重要的约束之一，是必须能够 **唯一识别每一条记录**。承担这一职责的字段就是 **主键（Primary Key）**。

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  segment TEXT NOT NULL
);
```

`customer_id` 是这张表的主键。只要知道 `customer_id = 1002`，就能准确定位 `Coast Foods` 这一条记录。

### 为什么不直接拿邮箱或手机号做主键？

邮箱、手机号、会员编号等字段在某一时刻看起来也可能唯一，但它们带有明确的业务含义，也可能因为业务变化而被修改。

主键承担的是“稳定定位记录”的职责。因此，这套学习笔记采用一个简单原则：

> **主键优先使用与业务无关、稳定且唯一的标识。业务字段的唯一性，则交给 UNIQUE 等约束表达。**

例如：

```sql
customer_id INTEGER PRIMARY KEY
email       TEXT UNIQUE NOT NULL
```

这样即使客户更换邮箱，`customer_id` 仍然保持不变，其他表也不需要跟着修改引用关系。

<div data-learning-slot="primary-key-lab"></div>

### 自增整数与 UUID

常见主键方案包括：

| 方案 | 特点 | 更适合的场景 |
|---|---|---|
| 自增整数 | 简洁、紧凑、容易排序和连接 | 单一数据库中的常规业务表 |
| BIGINT 自增 | 与普通整数思路一致，但可容纳更大的记录范围 | 长期增长的大型业务表 |
| UUID / GUID | 可以在不同节点独立生成全局唯一标识 | 分布式或跨系统生成记录 |

重点不在于哪一种永远最好，而在于主键必须满足几个基本条件：**唯一、稳定、非空，并尽量不承载会变化的业务含义。**

### 联合主键

有些表需要由多个字段共同唯一标识一条记录。例如订单与产品之间的明细表：

| order_id | product_id | quantity |
|---:|---:|---:|
| 50001 | 301 | 2 |
| 50001 | 305 | 1 |
| 50002 | 301 | 4 |

如果规定同一订单中的同一产品只能出现一次，可以使用：

```sql
PRIMARY KEY (order_id, product_id)
```

这里 `order_id` 可以重复，`product_id` 也可以重复，但二者的组合不能重复。联合主键能够准确表达这种约束，不过它也会增加引用和连接的复杂度，因此没有必要时不应滥用。

## 外键：表之间怎样建立关系？

主键解决了“怎样唯一找到一条记录”，外键则解决“这条记录与另一张表中的哪条记录有关”。

在 `orders` 表中：

```sql
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  order_value REAL NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

`orders.customer_id` 是外键，它指向 `customers.customer_id`。

关系可以这样理解：

```text
customers
customer_id  PK
     │
     │ 1 : N
     ▼
orders
order_id     PK
customer_id  FK
```

一个客户可以有多张订单，而每张订单只属于一个客户，所以这是一个典型的 **一对多（one-to-many）** 关系。

### 外键约束在保护什么？

如果数据库启用了外键约束，那么下面这种订单就不应该被允许：

```text
order_id = 50099
customer_id = 9999
```

因为 `customers` 表中不存在 `customer_id = 9999`。外键约束的价值，就是防止“订单指向不存在客户”这类关系完整性错误进入数据库。

### 多对多关系

如果一个产品可以属于多个促销活动，一个促销活动也可以包含多个产品，那么不能只在其中一张表里放一个简单外键。更常见的做法是建立中间表：

```text
products
   1
   │
   N
promotion_products
   N
   │
   1
promotions
```

例如：

```sql
CREATE TABLE promotion_products (
  promotion_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  PRIMARY KEY (promotion_id, product_id)
);
```

两个一对多关系组合起来，就形成了多对多关系。

### 一对一关系

一对一关系表示一张表中的一条记录只对应另一张表中的一条记录。例如：

```text
customers
    1
    │
    1
customer_profiles
```

这种拆分常用于把高频访问的核心字段与低频访问的扩展字段分开，或者把可选信息放在独立表中。

## 索引：为什么有的查询更快？

当表只有几十条记录时，直接扫描整张表几乎感觉不到成本；当记录增长到几十万、几百万甚至更多时，查询速度开始取决于数据库能否快速定位需要的行。

索引可以理解为数据库为一列或多列建立的有序查找结构。它让数据库在合适的条件下不必逐行扫描整个表。

例如，经常按照订单日期和客户查询：

```sql
CREATE INDEX idx_orders_customer_date
ON orders (customer_id, order_date);
```

或者对必须唯一的业务字段建立唯一索引：

```sql
CREATE UNIQUE INDEX idx_customers_email
ON customers (email);
```

### 索引不是越多越好

索引提高读取效率，但每次 `INSERT`、`UPDATE`、`DELETE` 时，数据库还需要维护对应的索引结构。因此，索引会带来额外的写入成本和存储成本。

另一个重要判断是 **区分度**。如果某个字段只有很少几个重复值，例如 `status` 只有 `open / closed` 两种状态，那么单独对它建立索引未必有很高收益；如果字段值高度分散，索引通常更容易发挥作用。

主键本身通常会拥有主键索引，因此按主键定位记录通常非常高效。

## 从结构走向查询：主键和外键为什么重要？

当主键、外键和记录粒度定义清楚后，SQL 查询才能稳定地把多张表重新组合起来。

例如，查看每张订单对应的客户：

```sql
SELECT
  o.order_id,
  c.customer_name,
  o.order_date,
  o.order_value
FROM orders AS o
JOIN customers AS c
  ON o.customer_id = c.customer_id
ORDER BY o.order_id;
```

这里连接条件不是随便挑两个“看起来相似”的字段，而是沿着已经定义好的关系：

```text
orders.customer_id
        ↓
customers.customer_id
```

这也是关系模型的核心价值之一：先把业务实体和关系定义清楚，再让查询沿着这些关系组合数据。

<div data-learning-slot="sql-playground"></div>

## 关系模型中的三个核心角色

| 对象 | 主要职责 | 典型问题 |
|---|---|---|
| 主键 Primary Key | 唯一定位一条记录 | 这条记录是谁？ |
| 外键 Foreign Key | 建立表之间的引用关系 | 这条订单属于哪个客户？ |
| 索引 Index | 提高特定查询的定位效率 | 怎样更快找到需要的记录？ |

三者解决的是不同问题。主键首先保证身份，外键建立关系，索引优化访问路径。不能因为三者都与“字段”有关，就把它们视为同一种东西。

## 建表时可以按什么顺序思考？

一个稳定的关系表设计通常可以按下面的顺序检查：

1. **确定记录粒度**：一行到底代表客户、订单、订单明细，还是一次服务事件？
2. **确定主键**：什么字段可以稳定、唯一、非空地标识这条记录？
3. **识别业务唯一性**：哪些字段虽然不是主键，但业务上不能重复？
4. **建立外键关系**：这张表需要引用哪些上游实体？
5. **检查一对多、多对多和一对一**：关系是否需要中间表？
6. **最后再考虑索引**：哪些筛选、连接或排序模式值得优化？

这样的顺序能够避免一个常见问题：还没有确定“这张表究竟代表什么”，就直接开始写复杂查询。

## 下一步

关系模型解决的是数据结构问题。掌握主键、外键与索引以后，下一步可以进入真正的数据查询：

```text
SELECT
→ WHERE
→ ORDER BY
→ GROUP BY
→ JOIN
→ Subquery
→ Window Function
```

后续 SQL 学习笔记会继续沿用 `customers / orders / products / shipments` 这一组业务数据，让结构设计和分析查询保持在同一个业务语境中。