---
translationKey: sql-primary-key
locale: zh
slug: sql-primary-key
title: 主键：如何为每一条业务记录建立稳定身份
summary: 从唯一性、稳定性与业务字段变化出发，理解主键为什么是关系表的记录身份，并比较自增整数、BIGINT、UUID 与联合主键在实际数据模型中的作用。
tags:
  - 主键
  - 关系模型
  - 数据完整性
  - 数据库设计
topics:
  - 数据管理
  - 数据建模
  - 数据理解
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 2
publishedAt: 2026-08-10
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-relational-data
  - sql-foreign-key
---

## 一张表为什么需要“记录身份”？

在关系数据库中，一张表通常保存同一种业务对象，而每一行代表其中一个具体实例。

例如，统一 SQL 数据集中的客户表是：

| customer_id | customer_name | email | phone | segment |
|---:|---|---|---|---|
| 1001 | North Retail | north@example.com | 021-440-810 | Retail |
| 1002 | Coast Foods | coast@example.com | 021-440-811 | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | 021-440-812 | Enterprise |

最重要的问题并不是“哪一列看起来最特别”，而是：

> **当客户名称、邮箱、联系方式甚至业务状态发生变化以后，数据库还能不能确定这仍然是同一个客户？**

这就是主键（Primary Key）要解决的问题。

主键不是普通描述字段。它承担的是一条记录在关系表中的稳定身份。

## 主键首先必须解决唯一性

如果数据库中出现两条无法区分的客户记录，后续更新、删除、连接和分析都会产生歧义。

主键最基本的要求是：

- 每一条记录都有一个主键值；
- 不同记录不能拥有相同主键；
- 主键不能为 `NULL`；
- 已经用于标识记录的主键应尽量保持稳定。

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  segment TEXT NOT NULL
);
```

这里的 `customer_id` 不负责描述客户来自哪里或属于什么市场分组，只负责稳定定位记录：

```text
1001 → North Retail
1002 → Coast Foods
1003 → Alpine Labs
```

只要 `customer_id` 不变，其他业务字段就可以正常更新。

## “当前唯一”并不等于“适合作为主键”

一个常见误区是：

> 只要某个字段现在没有重复，就可以把它当主键。

例如当前三个邮箱确实都不重复：

| email | 当前是否唯一 |
|---|---|
| north@example.com | 是 |
| coast@example.com | 是 |
| alpine@example.com | 是 |

但如果 `Coast Foods` 将邮箱修改为：

```text
accounts@coast.example
```

客户本身没有变，只是业务属性变化。

如果邮箱本身就是主键，这次普通联系方式更新就同时变成了“记录身份变化”。手机号、用户名、会员编号或产品编码也可能出现类似问题。

因此，“当前唯一”只是候选条件之一，还需要继续判断字段是否稳定、是否允许为空、是否承担过多业务含义。

<div data-learning-slot="primary-key-lab"></div>

## 业务字段与记录身份应该分开

更稳定的设计是把两个职责分开：

```text
customer_id
→ 记录身份

email
→ 业务联系信息
```

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  segment TEXT NOT NULL
);
```

这里：

```sql
customer_id INTEGER PRIMARY KEY
```

表达“数据库通过什么字段定位这条记录”。

而：

```sql
email TEXT NOT NULL UNIQUE
```

表达“邮箱在当前业务规则下不能重复”。

`PRIMARY KEY` 与 `UNIQUE` 都涉及唯一性，但语义不同：主键承担记录身份，唯一约束保护某个候选字段或业务规则。

## 主键为什么会影响表之间的关系？

统一数据集中的订单表包含：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

订单通过 `customer_id` 指向客户：

```text
customers.customer_id · PK
          │
          ▼
orders.customer_id · FK
```

如果客户 1002 修改邮箱，订单仍然引用：

```text
customer_id = 1002
```

关系不需要跟着重写。

这就是稳定主键的重要价值：业务属性可以变化，记录之间的身份关系仍然保持稳定。

## 重复主键会发生什么？

如果已经存在：

```text
customer_id = 1001
```

再次插入同一个主键：

```sql
INSERT INTO customers (
  customer_id,
  customer_name,
  email,
  phone,
  segment
)
VALUES (
  1001,
  'Duplicate Customer',
  'duplicate@example.com',
  '021-999-999',
  'Retail'
);
```

数据库应拒绝这次插入，因为它破坏了主键唯一性。

互动实验会把抽象规则：

```text
Primary Key must be unique
```

转化成数据库行为：

```text
重复主键
↓
违反约束
↓
INSERT 失败
```

<div data-learning-slot="sql-playground"></div>

## 自增整数：常见但不是唯一方案

很多业务数据库会让数据库自动生成整数主键。

例如在 **MySQL** 中可以写：

```sql
CREATE TABLE customers (
  customer_id BIGINT NOT NULL AUTO_INCREMENT,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  PRIMARY KEY (customer_id)
);
```

这里的 `AUTO_INCREMENT` 是 MySQL 方言，不应该把它当成所有 SQL 数据库都使用的统一语法。

在 PostgreSQL、SQL Server 和 SQLite 中，自动生成整数 ID 的具体机制和语法都不同。因此，真正可迁移的知识点不是背诵 `AUTO_INCREMENT`，而是理解：

> **由数据库生成、与业务含义分离的整数，可以成为稳定且易于连接的 surrogate key。**

## INTEGER 和 BIGINT 的容量差别有多大？

以 MySQL 的有符号整数为例：

| 类型 | 有符号范围 |
|---|---|
| `INT` | -2,147,483,648 到 2,147,483,647 |
| `BIGINT` | -9,223,372,036,854,775,808 到 9,223,372,036,854,775,807 |

因此，长期高速增长的业务表有时会直接采用 `BIGINT`，减少未来因为 ID 空间不足而迁移主键类型的风险。

但这不是“所有表都应该使用 BIGINT”的规则。字段宽度、索引大小、访问模式和数据库实现都应该一起考虑。

## SQLite 的 INTEGER PRIMARY KEY 有什么特殊之处？

本系列互动实验使用 SQLite/sql.js。

SQLite 中声明：

```sql
customer_id INTEGER PRIMARY KEY
```

时，这个字段与 SQLite 内部的 rowid 机制有特殊联系。这与 MySQL 的：

```sql
BIGINT AUTO_INCREMENT
```

并不是完全相同的实现。

因此，本系列会在概念层比较“自动生成整数主键”，但所有特定语法都会标明数据库方言。

## UUID：适合分布式生成，但不是一种单一算法

另一类常见主键是 UUID。

形式通常类似：

```text
8f55d96b-8acc-4636-8cb8-76bf8abc2f57
```

UUID 有不同版本和生成策略，例如基于随机数、时间排序或其他规则的版本。不能把 UUID 简化成“永远由某一种固定算法生成”。

相较于单一数据库集中分配的自增整数，UUID 的优势之一是不同节点可以在没有共享自增序列的情况下独立生成极低碰撞概率的标识。

代价则包括：

- 键值更长；
- 索引与存储占用通常更大；
- 人工阅读不如短整数直观；
- 某些随机 UUID 写入模式可能不利于 B-tree 索引局部性。

因此，选择 UUID 应该基于系统架构和生成需求，而不是因为它“看起来更高级”。

## 自增整数、BIGINT 与 UUID 怎么选？

| 方案 | 主要优势 | 主要代价 | 常见场景 |
|---|---|---|---|
| INTEGER 自增 | 简单、紧凑、易读 | 容量相对较小 | 小型或中等规模表 |
| BIGINT 自增 | 仍然简单且容量很大 | 键和索引占用更大 | 长期增长业务表 |
| UUID | 可在不同节点独立生成 | 更长、索引成本通常更高 | 分布式或跨系统记录 |

真正的检查框架是：

```text
唯一
+
非空
+
稳定
+
尽量脱离业务含义
+
适合系统生成方式
```

## 联合主键：多个字段也可以共同确定身份

并不是所有表都必须使用单列主键。

统一数据集中的 `order_items` 是：

| order_id | product_id | quantity | unit_price |
|---:|---:|---:|---:|
| 50001 | 301 | 2 | 150.00 |
| 50001 | 305 | 1 | 120.00 |
| 50002 | 305 | 1 | 185.00 |
| 50003 | 301 | 4 | 190.00 |
| 50004 | 305 | 3 | 170.00 |

如果业务规则规定“同一张订单中的同一个产品只出现一行”，那么：

```sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

此时单独的 `order_id` 可以重复，单独的 `product_id` 也可以重复，但组合：

```text
(order_id, product_id)
```

不能重复。

例如：

```text
(50001, 301)  ✓
(50001, 305)  ✓
(50002, 305)  ✓
(50001, 301)  ✗ duplicate
```

这就是联合主键（Composite Primary Key）。

## 联合主键什么时候会增加复杂度？

联合主键能够准确表达多个字段共同唯一的规则，但如果另一张表需要引用它，就可能需要同时携带多个外键字段，JOIN 条件和索引设计也会更长。

因此，问题不应该是“联合主键是不是高级”，而应该是：

> **这个字段组合是否天然就是这条记录的身份？**

在订单明细、桥接表和关联表中，联合主键往往很自然；在其他实体表中，单独的 surrogate key 可能更便于长期引用。

## Primary Key、UNIQUE 与普通字段不要混淆

| 类型 | 主要作用 | 统一数据集示例 |
|---|---|---|
| Primary Key | 定义记录身份 | `customers.customer_id` |
| UNIQUE | 保证候选字段不重复 | `customers.email` |
| 普通字段 | 保存业务属性 | `customers.segment` |

三者解决的是不同问题。

## 一个候选字段是否适合做主键，可以这样检查

在真正建表之前，可以依次问：

1. **是否唯一？** 不同记录可能出现相同值，就不能单独承担身份。
2. **是否非空？** 主键不能依赖一个可能不存在的值。
3. **是否稳定？** 普通业务更新会频繁改变，就不适合作为长期身份。
4. **是否带有强业务含义？** 业务规则变化会不会迫使主键一起变化？
5. **是否会被很多其他表引用？** 引用越广泛，稳定性越重要。
6. **是否适合当前系统生成？** 单体数据库、自增序列和分布式 UUID 的生成方式不同。
7. **键宽度是否合理？** 很宽的键会传播到索引和外键中。

最终目标不是寻找“最聪明的 ID”，而是找到足够简单、稳定并可维护的记录身份。

## 在 Business Analytics 中，主键为什么同样重要？

主键看起来像数据库设计问题，但会直接影响分析结果。

例如客户与订单分析常需要：

```sql
SELECT
  c.customer_id,
  c.customer_name,
  SUM(o.order_value) AS total_value
FROM customers AS c
JOIN orders AS o
  ON c.customer_id = o.customer_id
GROUP BY
  c.customer_id,
  c.customer_name;
```

如果客户身份本身不稳定，可能出现：

- 同一客户被拆成多个身份；
- 不同客户被错误合并；
- 历史订单无法继续匹配；
- 聚合结果重复或遗漏；
- 客户级 KPI 失真。

因此，在复杂 SQL 之前先确认：

```text
一行代表什么？
↓
主键是什么？
↓
身份是否稳定？
```

通常比直接开始 JOIN 更重要。

## 常见错误

### 用名称做主键

`customer_name` 可能重复，也可能修改。

### 用邮箱或手机号直接做主键

它们可能当前唯一，但属于业务属性。

### 把数据库方言当成通用 SQL

`AUTO_INCREMENT` 是 MySQL 语法；其他数据库可能使用 identity、sequence 或不同机制。

### 认为 ID 越复杂越专业

复杂不会自动带来更好的数据模型。

### 为所有表机械添加单列 ID

有些桥接表天然由两个外键共同唯一，联合主键反而更直接表达实际约束。

### 只关注“能不能插入”，不关注后续关系

主键一旦成为其他表的引用目标，就成为整个关系模型的一部分。

## 本篇的核心判断

主键可以归结为一句话：

> **主键不是用来描述一条记录，而是用来稳定地识别一条记录。**

可靠主键通常需要：

```text
Unique
+
Not NULL
+
Stable
+
Minimal business meaning
```

然后再根据数据库和系统架构选择整数、BIGINT、UUID 或 Composite Key。

## 下一步：从“身份”进入“关系”

这一篇解决：

```text
怎样唯一确定一条记录？
```

下一篇 SQL 03 将继续解决：

```text
一条记录怎样引用另一张表中的记录？
```
