---
translationKey: sql-relationships
locale: zh
slug: sql-relationships
title: 表关系：一对多、多对多与一对一应该怎样建模
summary: 从客户、订单、产品与扩展资料的统一业务数据出发，理解一对多、多对多和一对一关系的区别，以及外键、中间表和唯一约束如何共同表达关系基数并影响 JOIN 粒度。
tags:
  - 一对多
  - 多对多
  - 一对一
  - 关系模型
topics:
  - 数据管理
  - 数据建模
  - 关系设计
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 4
publishedAt: 2026-08-10
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-foreign-key
  - sql-select
---

## “两张表有关联”还不够

外键说明一条记录引用另一条记录，但还没有完整回答一个数量问题：

```text
A 的一条记录，最多可以对应多少条 B？
B 的一条记录，最多可以对应多少条 A？
```

这就是 **Relationship Cardinality（关系基数）**。

关系数据库中最常见的三类结构是：

```text
One-to-Many   1:N
Many-to-Many  N:M
One-to-One    1:1
```

它们不是三种孤立 SQL 命令，而是三种业务规则。

<div data-learning-slot="relationship-cardinality-lab"></div>

## 一对多：一个客户可以有多张订单

统一数据集中：

| customer_id | customer_name |
|---:|---|
| 1001 | North Retail |
| 1002 | Coast Foods |
| 1003 | Alpine Labs |

订单表：

| order_id | customer_id | order_value |
|---:|---:|---:|
| 50001 | 1001 | 420.00 |
| 50002 | 1001 | 185.00 |
| 50003 | 1002 | 760.00 |
| 50004 | 1003 | 510.00 |

客户 1001 对应两张订单：

```text
customer 1001
    │
    ├── order 50001
    └── order 50002
```

因此：

```text
customers 1 → N orders
```

注意：当前样本中有的客户只有一张订单，并不意味着业务关系变成一对一。**基数来自业务允许的最大关系数量，而不是当前样本碰巧出现多少行。**

## 一对多的外键放在哪一边？

在一对多关系中，外键通常放在“多”的一方。

```sql
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  order_value NUMERIC NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

结构可以读成：

```text
customers · 1
      │
      │ customer_id
      ▼
orders · N
```

`orders.customer_id` 允许重复，因此客户 1001 可以出现在 50001 和 50002 两行。

如果反方向描述：

```text
many orders → one customer
```

也可以称为 Many-to-One。它与 One-to-Many 是同一段关系的两个观察方向。

## 怎样判断一个关系是不是一对多？

可以连续问两个问题：

```text
一个 customer 最多可以有多少个 orders？
→ 多个

一个 order 最多可以属于多少个 customers？
→ 一个
```

所以是：

```text
customer 1:N order
```

类似关系还可能包括：

```text
warehouse 1:N shipments
category 1:N products
customer 1:N service_events
```

是否真的是 1:N 必须以业务规则为准。

## 多对多：订单与产品为什么不能只加一个外键？

统一数据中，一张订单可以包含多个产品。

例如订单 50001：

```text
product 301 · Forecast Kit
product 305 · Sensor Pack
```

同时产品 301 也出现在多张订单：

```text
order 50001
order 50003
```

所以：

```text
orders N ↔ M products
```

如果只给 `orders` 增加一个 `product_id`，每张订单只能直接保存一个产品；反过来只给 `products` 增加一个 `order_id`，也无法表示同一个产品出现在多张订单。

N:M 通常需要第三张表。

## 中间表把多对多拆成两个一对多

本系列使用：

```text
order_items
```

统一数据是：

| order_id | product_id | quantity | unit_price | line_value |
|---:|---:|---:|---:|---:|
| 50001 | 301 | 2 | 150.00 | 300.00 |
| 50001 | 305 | 1 | 120.00 | 120.00 |
| 50002 | 305 | 1 | 185.00 | 185.00 |
| 50003 | 301 | 4 | 190.00 | 760.00 |
| 50004 | 305 | 3 | 170.00 | 510.00 |

这里每一行的粒度是：

> **One row = one product line within one order**

结构变成：

```text
orders
  1
  │
  N
order_items
  N
  │
  1
products
```

两个 1:N 组合起来表达订单与产品之间的 N:M。

中间表也常被称为：

```text
bridge table
junction table
association table
```

## 中间表为什么经常使用联合主键？

当前业务规则规定，同一张订单中的同一个产品只保留一行。

因此组合：

```text
(order_id, product_id)
```

必须唯一：

```sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id)
    REFERENCES orders (order_id),
  FOREIGN KEY (product_id)
    REFERENCES products (product_id)
);
```

这同时允许：

```text
order_id 重复
product_id 重复
```

但不允许：

```text
同一个 (order_id, product_id) 配对重复
```

## 中间表还可以保存“关系本身的属性”

`quantity` 和 `unit_price` 不属于订单整体，也不属于产品主数据本身，而属于：

> **某个产品出现在某张订单中的这一条关系记录。**

例如：

```text
order 50001
+
product 301
+
quantity 2
+
unit_price 150.00
```

于是：

```text
line_value = 2 × 150 = 300
```

订单 50001 的两条明细：

```text
300 + 120 = 420
```

与 `orders.order_value = 420.00` 对齐。

本系列会在自动测试中持续检查所有订单的明细合计是否与订单总额一致，避免静态教学表与互动数据漂移。

## 一对一：一条记录最多对应另一条记录

一对一关系表示：

```text
A 的一条记录最多对应一条 B
B 的一条记录最多对应一条 A
```

统一数据中使用：

```text
customer_profiles
```

| customer_id | timezone | preferred_channel |
|---:|---|---|
| 1001 | Pacific/Auckland | Email |
| 1002 | Pacific/Auckland | Portal |
| 1003 | Pacific/Auckland | Email |

如果每个客户最多只有一条 profile：

```text
customers 1 ↔ 1 customer_profiles
```

## 只有外键为什么还不能保证一对一？

如果只是：

```sql
customer_id INTEGER NOT NULL
```

再加普通外键，`customer_id` 在子表仍然可能重复。

要限制成 1:1，需要额外的唯一性规则。

一种写法是：

```sql
CREATE TABLE customer_profiles (
  profile_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL UNIQUE,
  timezone TEXT,
  preferred_channel TEXT,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

本系列 canonical schema 采用更直接的共享主键方式：

```sql
CREATE TABLE customer_profiles (
  customer_id INTEGER PRIMARY KEY,
  timezone TEXT NOT NULL,
  preferred_channel TEXT NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

`customer_id` 同时承担 PK 与 FK，因此在 profile 表中天然不能重复。

## 为什么不把一对一的两张表直接合并？

如果两组字段总是一起存在、一起读取，合并成一张表通常更简单。

拆成 1:1 的合理原因可能包括：

- 扩展字段是可选或稀疏的；
- 核心字段高频访问，扩展字段低频访问；
- 两部分需要不同访问权限；
- 生命周期不同；
- 希望核心实体保持更聚焦。

所以 1:1 不是“更规范”的默认答案，而是一种需要明确理由的设计选择。

## 关系基数会直接影响 JOIN 后有多少行

统一数据中客户 1001 对应：

```text
50001
50002
```

如果将客户 1001 与订单连接，结果自然出现两行：

```text
1001 | North Retail | 50001
1001 | North Retail | 50002
```

这不是错误重复，而是一对多关系的自然展开。

因此，看到 JOIN 后行数增加时，应先问：

```text
这是符合基数的自然展开？
还是连接条件错误造成的意外笛卡尔放大？
```

不能只凭“出现重复的 customer_id”就判定查询错误。

## 多对多连接为什么更容易放大记录数？

订单与 `order_items` 连接后，结果粒度会从：

```text
One row = one order
```

变成：

```text
One row = one product line within one order
```

订单 50001 原本一行，连接两条明细后会变成两行。

如果把订单级 `order_value = 420` 重复到这两行，再直接求和：

```text
420 + 420 = 840
```

就会产生重复计算。

正确做法取决于分析问题：

- 需要订单级金额，就保持订单粒度；
- 需要产品明细，就使用 `quantity × unit_price` 的明细值；
- 需要从明细重新汇总订单，就按 `order_id` 聚合 line value。

因此，关系基数与记录粒度是分析 SQL 中最重要的质量控制之一。

## 从业务语言判断关系类型

| 业务描述 | 关系 | 典型实现 |
|---|---|---|
| 一个客户有多张订单，每张订单属于一个客户 | 1:N | FK 在 orders |
| 一张订单含多个产品，一个产品出现在多张订单 | N:M | order_items 中间表 |
| 一个客户最多有一条扩展资料 | 1:1 | FK + UNIQUE 或共享 PK |

先写业务规则，再决定 SQL 结构，通常比先画表再猜关系更可靠。

## 常见建模错误

### 把多对多塞进一个字符串

```text
product_ids = "301,305,309"
```

这会让约束、JOIN、索引和单个产品筛选都变得困难。

### 看到外键就认为是一对一

普通外键值可以重复。1:1 还需要唯一性。

### 忽略中间表粒度

桥接表的一行代表一次关系，不是任意一侧实体的完整记录。

### JOIN 行数增加就认为“重复”

1:N 与 N:M 本来就会扩展行数。需要检查的是扩展是否符合业务基数。

### 根据当前样本判断基数

客户 1002 当前只有一张订单，不代表业务规则是 1:1。

### 静态示例与运行数据使用不同 ID

这会让讲解和互动结果互相矛盾。因此本系列把客户、订单、产品、明细和 profile 统一到同一数据源，并为关系完整性建立自动测试。

## 关系设计可以按这个顺序检查

1. **A 一条记录最多对应多少条 B？**
2. **B 一条记录最多对应多少条 A？**
3. **1:N 的外键是否放在 N 侧？**
4. **N:M 是否需要 bridge table？**
5. **1:1 是否真正有 UNIQUE / shared PK 保证？**
6. **中间表是否需要保存数量、价格或状态等关系属性？**
7. **JOIN 后粒度会怎样变化？**
8. **静态示例与可运行数据是否来自同一来源？**

## 本篇的核心判断

三类关系可以压缩成：

```text
1:N
→ 外键通常放在 N 侧

N:M
→ 用中间表拆成两个 1:N

1:1
→ 外键 + UNIQUE，或 shared primary key
```

真正决定结构的是业务允许的关系数量，而不是字段名或当前样本数量。

## 下一步：开始真正查询数据

到 SQL 04 为止，结构基础已经形成：

```text
SQL 01 · Relational Database
↓
SQL 02 · Primary Key
↓
SQL 03 · Foreign Key
↓
SQL 04 · Relationship Cardinality
```

SQL 05 将进入：

```text
SELECT
```

学习重点从“数据怎样组织”转向“怎样从表中读取结果集”。
