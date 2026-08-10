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
---

## 一张表为什么需要“记录身份”？

在关系数据库中，一张表通常保存同一种业务对象，而每一行代表其中一个具体实例。

例如，一张客户表可以是：

| customer_id | customer_name | email | segment |
|---:|---|---|---|
| 1001 | North Retail | north@example.com | Retail |
| 1002 | Coast Foods | coast@example.com | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | Enterprise |

这里最重要的问题并不是“哪一列看起来最特别”，而是：

> **当客户名称、邮箱、联系方式甚至业务状态发生变化以后，数据库还能不能确定这仍然是同一个客户？**

这就是主键（Primary Key）要解决的问题。

主键不是普通的描述字段。它承担的是一条记录在关系表中的稳定身份。

## 主键首先必须解决唯一性

如果数据库中出现两条完全无法区分的客户记录，后续更新、删除、连接和分析都会产生歧义。

因此，主键最基本的职责是：

- 每一条记录都有一个主键值；
- 不同记录不能拥有相同主键；
- 主键不能是 `NULL`；
- 已经用于标识记录的主键应尽量保持稳定。

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  segment TEXT NOT NULL
);
```

这里的 `customer_id` 不负责描述客户是谁、来自哪里或属于什么市场分组。它只负责一件事情：

```text
1001 → North Retail 这一条客户记录
1002 → Coast Foods 这一条客户记录
1003 → Alpine Labs 这一条客户记录
```

只要 `customer_id` 不变，其他业务字段就可以在业务过程中正常更新。

## “当前唯一”并不等于“适合作为主键”

实际建模时，一个很容易出现的误区是：

> 只要某个字段现在没有重复，就可以把它当主键。

例如客户邮箱：

| email | 当前是否唯一 |
|---|---|
| north@example.com | 是 |
| coast@example.com | 是 |
| alpine@example.com | 是 |

从当前数据来看，邮箱似乎可以唯一识别客户。

但如果 `Coast Foods` 将邮箱修改为：

```text
accounts@coast.example
```

客户本身并没有变，只是一个业务属性发生了变化。

如果邮箱本身就是主键，那么这次普通的联系方式更新就同时变成了“记录身份发生变化”。这会让数据库设计变得脆弱。

类似的问题还可能出现在手机号、用户名、会员编号、产品编码或其他由业务流程定义、未来可能变化的字段。

因此，一个字段“可以唯一”只是主键候选条件之一，还必须继续判断它是否足够稳定。

<div data-learning-slot="primary-key-lab"></div>

## 业务字段与记录身份应该分开

一个更稳定的设计是把两种职责分开：

```text
customer_id
↓
负责记录身份

email
↓
负责业务联系信息
```

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  segment TEXT NOT NULL
);
```

这里有两个不同的约束：

```sql
customer_id INTEGER PRIMARY KEY
```

表示 `customer_id` 是记录身份。

而：

```sql
email TEXT NOT NULL UNIQUE
```

表示邮箱在业务规则上不能重复。

`UNIQUE` 可以表达某个业务字段“当前必须唯一”，而 `PRIMARY KEY` 表达的是“数据库通过什么长期定位这条记录”。

## 主键为什么会影响表之间的关系？

假设还有一张订单表：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |

订单通过 `customer_id` 指向客户。

```text
customers
customer_id
    │
    │
    ▼
orders
customer_id
```

如果客户修改邮箱，订单仍然可以继续引用：

```text
customer_id = 1002
```

关系完全不受影响。

这就是稳定主键的重要价值：业务属性可以变化，但记录之间的身份关系不需要跟着重写。

## 重复主键会发生什么？

如果已经存在：

```text
customer_id = 1001
```

再次插入相同的主键：

```sql
INSERT INTO customers (
  customer_id,
  customer_name,
  email,
  segment
)
VALUES (
  1001,
  'Duplicate Customer',
  'duplicate@example.com',
  'Retail'
);
```

数据库应拒绝这次插入，因为它破坏了主键唯一性。

在学习环境中，这种“故意制造错误”的实验很重要。它可以把抽象规则：

```text
Primary Key must be unique
```

转化为可以直接观察的数据库行为：

```text
重复主键
↓
违反约束
↓
INSERT 失败
```

<div data-learning-slot="sql-playground"></div>

## 自增整数：最容易理解的主键方案

常规业务数据库中，一个常见方案是使用数据库生成的整数标识。

例如在 MySQL 中：

```sql
CREATE TABLE customers (
  customer_id BIGINT NOT NULL AUTO_INCREMENT,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  PRIMARY KEY (customer_id)
);
```

插入数据时不需要手动决定新的 `customer_id`：

```sql
INSERT INTO customers (
  customer_name,
  email
)
VALUES (
  'Harbour Foods',
  'hello@harbour.example'
);
```

数据库负责生成新的主键值。

它的优势主要来自结构简单：值短、容易阅读、容易在表之间连接，也不需要业务人员设计编号规则。

## 为什么经常看到 BIGINT？

整数类型本身有容量范围。

如果一张业务表会持续增长很多年，使用更大的整数类型可以减少未来因为标识空间不足而迁移主键类型的风险。

因此，大型或长期增长的业务表中经常可以看到：

```sql
BIGINT
```

而不是只考虑当前只有几百或几千条记录。

这里的思维方式不是预测“这张表一定会非常大”，而是：

> **主键属于基础结构，一旦被其他表广泛引用，后期修改的成本通常比一开始选择合理类型更高。**

## UUID：当记录需要在不同系统中独立生成

另一类常见主键是 UUID。

形式通常类似：

```text
8f55d96b-8acc-4636-8cb8-76bf8abc2f57
```

它与连续整数不同，不依赖一个中央数据库逐个分配编号，因此在多个系统、多个服务或离线环境独立创建记录时很有价值。

概念上可以这样理解：

```text
自增整数
适合：一个数据库集中生成 ID

UUID
适合：不同节点可以独立生成 ID
```

但 UUID 也会带来更长的键值、更大的存储与索引体积，以及更不直观的人工阅读体验。

所以选择主键时仍然应该从系统场景出发，而不是因为某一种方案“看起来更高级”就默认使用。

## 自增整数、BIGINT 与 UUID 怎么选？

| 方案 | 主要优势 | 主要代价 | 常见场景 |
|---|---|---|---|
| INTEGER 自增 | 简单、紧凑、易读 | 容量比 BIGINT 小 | 小型或中等规模表 |
| BIGINT 自增 | 简单且容量更大 | 比普通整数占用更多空间 | 长期增长的业务表 |
| UUID | 可跨系统独立生成 | 更长、更不易人工阅读 | 分布式或跨系统记录 |

对学习数据库和大多数普通业务模型而言，关键并不是记住一个“标准答案”，而是理解选择逻辑：

```text
唯一
+
稳定
+
非空
+
尽量脱离业务含义
+
适合系统生成方式
```

## 联合主键：一条记录也可以由多个字段共同确定

并不是所有表都必须只有一个主键字段。

例如订单明细表：

| order_id | product_id | quantity |
|---:|---:|---:|
| 50001 | 301 | 2 |
| 50001 | 305 | 1 |
| 50002 | 301 | 4 |

如果业务规则规定同一张订单中的同一个产品只允许出现一次，那么可以定义：

```sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

此时 `order_id` 可以重复，`product_id` 也可以重复，但是 `(order_id, product_id)` 这个组合不能重复。

```text
(50001, 301)  ✓
(50001, 305)  ✓
(50002, 301)  ✓
(50001, 301)  ✗ 重复
```

这就是联合主键（Composite Primary Key）。

## 联合主键什么时候会增加复杂度？

联合主键能够准确表达“多个字段共同唯一”的业务规则，但也会让后续引用变长。

如果另一张表需要引用 `(order_id, product_id)`，就可能同时保存两个外键字段。随着关系增多，连接条件也会变得更长。

因此，联合主键不应该因为“可以使用”就大量使用。更重要的问题是：

> 这个组合是否天然就是这条记录的身份？

在订单明细、桥接表、关联表这样的结构中，联合主键往往非常自然。

## 主键、UNIQUE 与普通字段不要混淆

| 类型 | 主要作用 | 示例 |
|---|---|---|
| Primary Key | 定义记录身份 | `customer_id` |
| UNIQUE | 保证业务字段不重复 | `email` |
| 普通字段 | 保存业务属性 | `segment` |

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  segment TEXT NOT NULL
);
```

这张表的逻辑非常清楚：

```text
customer_id
→ 这条记录是谁？

email
→ 业务上是否允许重复？

segment
→ 这条记录有什么属性？
```

## 一个候选字段是否适合做主键，可以这样检查

在真正建表之前，可以依次问：

1. **它是否唯一？** 如果不同记录可能出现相同值，就不能单独承担记录身份。
2. **它是否允许为空？** 主键不能依赖一个可能不存在的值。
3. **它是否稳定？** 如果字段会因为普通业务更新频繁改变，就不适合作为长期身份。
4. **它是否带有强业务含义？** 如果业务规则一改变，这个字段是否也可能跟着改变？
5. **它是否会被很多其他表引用？** 引用越广泛，稳定性越重要。
6. **它是否适合当前系统生成？** 集中式数据库、自增整数和跨系统 UUID 的生成方式不同。

最终目标不是寻找“最聪明的 ID”，而是找到一个足够简单、稳定并且可维护的记录身份。

## 在 Business Analytics 中，主键为什么同样重要？

主键看起来像数据库设计问题，但它会直接影响分析结果。

例如，在客户与订单分析中经常需要：

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

如果客户表中的身份定义本身不稳定，连接就可能出现：

- 同一客户被拆成多个身份；
- 不同客户被错误合并；
- 历史订单无法继续匹配；
- 聚合结果被重复计算；
- 客户级 KPI 失真。

因此，在开始写复杂 SQL 之前，先确认：

```text
一行代表什么？
↓
主键是什么？
↓
记录身份是否稳定？
```

通常比直接写 `JOIN` 更重要。

## 常见错误

### 用名称做主键

`customer_name` 可能重复，也可能修改。

### 用邮箱或手机号直接做主键

它们可能当前唯一，但属于业务属性。

### 认为 ID 越复杂越专业

复杂并不会自动带来更好的数据模型。

### 为所有表机械添加单列 ID

有些桥接表天然由两个外键共同唯一，联合主键反而更能表达实际约束。

### 只关注“能不能插入”，不关注后续关系

主键一旦成为其他表的引用目标，它就成为整个关系模型的一部分。

## 本篇的核心判断

主键可以归结为一句话：

> **主键不是用来描述一条记录，而是用来稳定地识别一条记录。**

一个可靠的主键通常应该满足：

```text
Unique
+
Not NULL
+
Stable
+
Minimal business meaning
```

然后再根据系统场景选择 `INTEGER / BIGINT`、`UUID` 或 `Composite Key`。

## 下一步：从“身份”进入“关系”

这一篇解决的是：

```text
怎样唯一确定一条记录？
```

下一篇 SQL 03 将继续解决：

```text
一条记录怎样引用另一张表中的记录？
```

也就是 **Foreign Key — 外键**。

主键先定义“谁是谁”，外键再定义“谁和谁有关”。这两步确定以后，关系数据库的表结构才真正开始连接起来。
