---
translationKey: sql-relationships
locale: zh
slug: sql-relationships
title: 表关系：一对多、多对多与一对一应该怎样建模
summary: 从客户、订单、产品与扩展资料的业务结构出发，理解一对多、多对多和一对一关系的区别，以及外键、中间表和唯一约束如何共同表达关系基数。
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
---

## “两张表有关联”还不够

外键说明一条记录引用另一条记录，但它还没有完整回答关系中最重要的数量问题：

```text
一条记录最多能对应多少条另一侧记录？
```

例如：

```text
一个客户可以有多少张订单？
一张订单可以包含多少个产品？
一个产品可以出现在哪些订单中？
一个客户可以有多少条扩展资料？
```

这些问题描述的就是 **Relationship Cardinality（关系基数）**。

关系数据库中常见的三类结构是：

```text
One-to-Many   1:N
Many-to-Many  N:M
One-to-One    1:1
```

它们不是三种不同的 SQL 语法，而是三种不同的业务结构。

<div data-learning-slot="relationship-cardinality-lab"></div>

## 一对多：一个客户可以有多张订单

客户与订单是最典型的一对多关系。

客户表：

| customer_id | customer_name |
|---:|---|
| 1001 | North Retail |
| 1002 | Coast Foods |

订单表：

| order_id | customer_id | order_value |
|---:|---:|---:|
| 50001 | 1001 | 420.00 |
| 50002 | 1001 | 185.00 |
| 50003 | 1002 | 760.00 |

从 `customers` 看向 `orders`：

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

一个客户可以对应多张订单。

但每一张订单只保存一个 `customer_id`，因此一张订单只引用一个客户。

## 一对多的外键放在哪一边？

在一对多关系中，外键通常放在“多”的一方。

例如：

```sql
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_value REAL NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

这里：

```text
customers
1
│
│ customer_id
▼
N
orders
```

`orders.customer_id` 可以重复，因为同一个客户可以出现在多张订单中。

如果把关系方向反过来看：

```text
many orders → one customer
```

它也可以称为 **Many-to-One（多对一）**。

一对多和多对一描述的是同一组关系，只是观察方向不同。

## 怎样判断一个关系是不是一对多？

可以用两个问题检查：

```text
A 的一条记录可以对应多少条 B？
B 的一条记录可以对应多少条 A？
```

对客户与订单来说：

```text
一个 customer → 多个 orders
一个 order → 一个 customer
```

因此关系是：

```text
1:N
```

类似结构还包括：

```text
warehouse → shipments
product category → products
customer → service_events
```

关键不是表名，而是实际业务规则。

## 多对多：订单和产品为什么不能只加一个外键？

订单与产品之间的关系更加复杂。

一张订单可以购买多个产品：

```text
order 50001
├── product 301
└── product 305
```

与此同时，同一个产品也可以出现在多张订单中：

```text
product 301
├── order 50001
└── order 50002
```

因此：

```text
orders N ↔ M products
```

这是多对多关系。

如果只在 `orders` 中增加一个 `product_id`：

```text
orders.product_id
```

那么每张订单只能直接保存一个产品。

如果只在 `products` 中增加一个 `order_id`，同样无法表达一个产品出现在多张订单中的情况。

因此，N:M 关系通常需要第三张表。

## 中间表把多对多拆成两个一对多

订单与产品之间可以建立：

```text
order_items
```

例如：

| order_id | product_id | quantity |
|---:|---:|---:|
| 50001 | 301 | 2 |
| 50001 | 305 | 1 |
| 50002 | 301 | 4 |

关系结构变成：

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

也就是：

```text
orders 1:N order_items
+
products 1:N order_items
```

两个一对多关系组合起来，就表达了订单与产品之间的多对多关系。

中间表常被称为：

```text
bridge table
junction table
association table
```

名称不同，但核心作用相同：保存两侧实体之间的配对关系。

## 中间表为什么经常使用联合主键？

如果业务规定同一张订单中的同一个产品只允许出现一次，那么下面的组合必须唯一：

```text
(order_id, product_id)
```

因此可以定义：

```sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id)
    REFERENCES orders (order_id),
  FOREIGN KEY (product_id)
    REFERENCES products (product_id)
);
```

这里的联合主键同时表达：

```text
同一个 order_id 可以重复
同一个 product_id 可以重复
但同一个配对不能重复
```

这也是联合主键在桥接表中非常自然的使用场景。

## 中间表还可以保存“关系本身的属性”

中间表不一定只有两个外键。

例如 `order_items` 还可以保存：

```text
quantity
unit_price
discount
```

这些字段既不属于订单本身，也不属于产品本身，而属于：

> 某个产品出现在某张订单中的这一次关系。

例如：

```text
order 50001
+
product 301
+
quantity = 2
```

这说明中间表不仅解决“谁和谁有关”，也可以保存这段关系本身的业务信息。

## 一对一：一条记录最多对应另一条记录

一对一关系表示：

```text
A 的一条记录最多对应一条 B
B 的一条记录最多对应一条 A
```

例如，把客户的低频扩展资料单独放在：

```text
customer_profiles
```

客户表：

| customer_id | customer_name |
|---:|---|
| 1001 | North Retail |
| 1002 | Coast Foods |

扩展资料表：

| customer_id | timezone | preferred_channel |
|---:|---|---|
| 1001 | Pacific/Auckland | Email |
| 1002 | Pacific/Auckland | Portal |

如果每个客户最多只有一条 profile，那么关系就是：

```text
customers 1 ↔ 1 customer_profiles
```

## 只有外键为什么还不能保证一对一？

如果 `customer_profiles.customer_id` 只是普通外键：

```sql
customer_id INTEGER NOT NULL
```

那么同一个 `customer_id` 仍然可能出现多次。

这实际上会变成：

```text
customers 1:N customer_profiles
```

要限制成一对一，还需要保证引用列唯一。

例如：

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

或者让 `customer_id` 本身同时承担主键和外键：

```sql
CREATE TABLE customer_profiles (
  customer_id INTEGER PRIMARY KEY,
  timezone TEXT,
  preferred_channel TEXT,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

此时一个客户 ID 在 profile 表中最多出现一次。

## 为什么不把一对一的两张表直接合并？

如果两组字段总是一起存在、一起读取，那么合并成一张表通常更简单。

但一对一拆分仍然可能有合理场景，例如：

- 扩展字段是可选的；
- 核心字段经常访问，扩展字段很少访问；
- 某些字段需要不同的访问控制；
- 两部分数据具有不同的生命周期；
- 为了让核心表保持更聚焦的业务职责。

因此，一对一不是必须使用的结构，而是一种需要明确理由的建模选择。

## 关系基数会直接影响 JOIN 后有多少行

关系设计不仅影响建表，也会影响分析结果。

假设 `customers` 中：

```text
customer 1001
```

在 `orders` 中对应三张订单：

```text
50001
50002
50008
```

当客户表连接订单表后，客户 `1001` 会出现三次：

```text
1001 | 50001
1001 | 50002
1001 | 50008
```

这不是重复数据错误，而是一对多关系在查询结果中的自然展开。

如果没有先理解基数，就可能把这种行数增加错误地当作“JOIN 产生重复”。

## 多对多连接为什么更容易放大记录数？

多对多关系通过中间表连接时，结果粒度通常会变成：

```text
One row = one relationship record
```

例如订单与产品连接以后：

```text
One row = one product within one order
```

因此，一张包含三个产品的订单会展开成三行。

如果此时直接把订单总金额重复放在每个产品行上再求和，就可能产生重复计算。

所以分析前应该先明确：

```text
连接前的粒度是什么？
↓
关系是 1:1、1:N 还是 N:M？
↓
连接后的粒度会变成什么？
↓
哪些指标可以直接聚合？
```

这一步对于数据仓库、销售分析和供应链明细分析尤其重要。

## 从业务语言判断关系类型

可以把常见描述转换成关系结构：

| 业务描述 | 关系 |
|---|---|
| 一个客户可以有多张订单，每张订单属于一个客户 | 1:N |
| 一张订单包含多个产品，一个产品出现在多张订单中 | N:M |
| 一个客户最多有一条扩展资料 | 1:1 |

判断时不要先从 SQL 开始，而是先把业务规则写成自然语言。

然后再决定：

```text
外键放在哪里？
是否允许重复？
是否需要 UNIQUE？
是否需要中间表？
中间表是否需要联合主键？
```

## 常见建模错误

### 把多对多强行塞进一个字段

例如：

```text
product_ids = "301,305,309"
```

把多个 ID 塞进一个字符串会破坏关系表的正常结构，也让筛选、约束和连接变得困难。

### 看到外键就认为是一对一

外键值默认可以重复。要表达一对一，还需要唯一性约束。

### 忽略中间表的记录粒度

桥接表的一行通常代表“一次关系”，而不是任意一侧的完整实体。

### JOIN 行数增加就认为数据重复

一对多和多对多本来就会扩展行数。真正需要检查的是连接后的粒度是否符合分析目标。

### 根据当前样本判断关系

当前数据中“每个客户碰巧只有一张订单”并不代表业务规则是一对一。

关系基数应该来自业务约束，而不是当前样本恰好呈现出的数量。

## 关系设计可以按这个顺序检查

面对两个业务实体时，可以依次确认：

1. **A 的一条记录最多可以对应多少条 B？**
2. **B 的一条记录最多可以对应多少条 A？**
3. **外键应该放在“多”的一方吗？**
4. **两侧都可能对应多条记录时，是否需要中间表？**
5. **一对一关系是否需要 `UNIQUE` 或共享主键？**
6. **中间表是否还需要保存数量、价格或状态等关系属性？**
7. **JOIN 后的记录粒度会发生什么变化？**

这套检查能够把“表之间有关系”进一步转化为可以实现和验证的数据结构。

## 本篇的核心判断

三类关系可以压缩成三个结构判断：

```text
1:N
→ 外键通常放在 N 侧

N:M
→ 用中间表拆成两个 1:N

1:1
→ 外键 + UNIQUE，或共享主键
```

真正决定结构的不是表名，而是业务规则允许一条记录与多少条另一侧记录发生关系。

## 下一步：开始真正查询数据

到 SQL 04 为止，关系模型的基础结构已经形成：

```text
SQL 01 · Table / Record / Granularity
↓
SQL 02 · Primary Key
↓
SQL 03 · Foreign Key
↓
SQL 04 · Relationship Cardinality
```

下一篇 SQL 05 将开始进入查询数据：

```text
SELECT
```

重点从“数据怎样组织”转向“怎样从表中取出需要的数据”。
