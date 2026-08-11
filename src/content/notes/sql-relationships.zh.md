---
translationKey: sql-relationships
locale: zh
slug: sql-relationships
title: 表关系：一对多、多对多与一对一
summary: 一对多、多对多和一对一是关系数据库里最常见的三种结构。这里用客户、订单和产品数据说明外键应该放在哪里、什么时候需要中间表，以及 JOIN 后为什么会出现更多行。
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
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-foreign-key
  - sql-select
---

## 两张表有关联，还要知道它们怎么关联

外键能说明一条记录引用了另一条记录，但只知道“有关联”还不够。建表之前，还得弄清楚两个很实际的问题：

```text
A 的一条记录，最多能对应多少条 B？
B 的一条记录，最多能对应多少条 A？
```

答案决定了表之间的 **Relationship Cardinality（关系基数）**。

关系数据库里最常见的是三种情况：

```text
One-to-Many   1:N
Many-to-Many  N:M
One-to-One    1:1
```

它们并不是三条 SQL 语句，而是三种业务关系。数据库只是把这种关系写进表结构里。

<div data-learning-slot="relationship-cardinality-lab"></div>

## 一对多：一个客户可以有多张订单

先看最常见的一种关系。客户表里，每个客户只有一行：

| customer_id | customer_name |
|---:|---|
| 1001 | North Retail |
| 1002 | Coast Foods |
| 1003 | Alpine Labs |

订单表里，同一个客户却可以出现多次：

| order_id | customer_id | order_value |
|---:|---:|---:|
| 50001 | 1001 | 420.00 |
| 50002 | 1001 | 185.00 |
| 50003 | 1002 | 760.00 |
| 50004 | 1003 | 510.00 |

客户 1001 有两张订单：

```text
customer 1001
    │
    ├── order 50001
    └── order 50002
```

所以这段关系是：

```text
customers 1 → N orders
```

这里有一个很容易踩的坑：客户 1002 在当前样本里只有一张订单，并不代表关系就是 1:1。关系基数看的是**业务允许发生什么**，不是当前这几行数据刚好长什么样。

## 一对多的外键通常放在“多”的一边

如果一张订单只能属于一个客户，那么订单表最适合保存 `customer_id`：

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

结构可以直接读成：

```text
customers · 1
      │
      │ customer_id
      ▼
orders · N
```

`orders.customer_id` 可以重复，所以同一个客户能对应多张订单。反过来说，“多张订单属于一个客户”就是 Many-to-One，它和 One-to-Many 只是同一段关系从两个方向看。

判断 1:N 时，不妨把问题说成人话：

```text
一个客户最多能有多少张订单？
→ 多张

一张订单最多能属于多少个客户？
→ 一个
```

类似的结构在业务数据里非常常见，例如：

```text
warehouse 1:N shipments
category 1:N products
customer 1:N service_events
```

具体是不是 1:N，最后还是由业务规则决定。

## 多对多：订单和产品为什么需要第三张表

订单和产品的关系更复杂。一张订单可以包含多个产品，同一个产品也可以出现在多张订单里。

订单 50001 包含：

```text
product 301 · Forecast Kit
product 305 · Sensor Pack
```

而产品 301 又出现在：

```text
order 50001
order 50003
```

所以订单和产品之间是：

```text
orders N ↔ M products
```

如果只在 `orders` 里加一个 `product_id`，一张订单就只能直接指向一个产品；如果把 `order_id` 放进 `products`，同一个产品又只能指向一张订单。两种做法都装不下真实的业务关系。

更常见的做法是加一张中间表。

## 中间表把 N:M 拆成两个 1:N

这里使用 `order_items`：

| order_id | product_id | quantity | unit_price | line_value |
|---:|---:|---:|---:|---:|
| 50001 | 301 | 2 | 150.00 | 300.00 |
| 50001 | 305 | 1 | 120.00 | 120.00 |
| 50002 | 305 | 1 | 185.00 | 185.00 |
| 50003 | 301 | 4 | 190.00 | 760.00 |
| 50004 | 305 | 3 | 170.00 | 510.00 |

这张表的一行不是“一张订单”，也不是“一个产品”，而是：

> **某个产品在某张订单中的一条明细。**

结构就变成：

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

于是原来的 N:M 被拆成两个比较容易管理的 1:N。

这种表常见的名字有：

```text
bridge table
junction table
association table
```

叫法不同，作用基本一样：专门保存两类实体之间的关系。

## 为什么中间表常用联合主键

当前数据规则是：同一张订单里的同一个产品只保留一条明细。因此这两个字段的组合必须唯一：

```text
(order_id, product_id)
```

SQL 可以写成：

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

这样既允许同一张订单出现多个产品，也允许同一个产品出现在多张订单中，但不会出现完全相同的 `(order_id, product_id)` 组合。

当然，并不是所有中间表都一定要用联合主键。如果业务上允许同一产品在一张订单里分成多条记录，就需要换一种主键设计。关键仍然是先弄清楚“一行到底代表什么”。

## 中间表还能保存关系本身的信息

`quantity` 和 `unit_price` 很适合放在 `order_items`，因为它们既不是订单整体的属性，也不是产品主数据的固定属性，而是“这个产品出现在这张订单里”时才产生的信息。

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

对应的明细金额是：

```text
line_value = 2 × 150 = 300
```

订单 50001 还有另一条 120 的明细，所以：

```text
300 + 120 = 420
```

正好与 `orders.order_value = 420.00` 对齐。

这种核对很重要。中间表一旦成为分析数据源，明细合计和订单总额是否一致就应该能被检查，而不是默认它们一定一致。

## 一对一：有些信息可以单独放，但只能有一份

一对一关系表示：

```text
A 的一条记录最多对应一条 B
B 的一条记录最多对应一条 A
```

例如客户扩展资料：

| customer_id | timezone | preferred_channel |
|---:|---|---|
| 1001 | Pacific/Auckland | Email |
| 1002 | Pacific/Auckland | Portal |
| 1003 | Pacific/Auckland | Email |

如果每个客户最多只有一份 profile，那么：

```text
customers 1 ↔ 1 customer_profiles
```

## 普通外键本身不能保证一对一

只给 `customer_profiles.customer_id` 加外键还不够，因为普通外键允许重复。要真正限制成 1:1，还需要唯一性约束。

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

这里的 `UNIQUE` 保证同一个客户不会出现两份 profile。

当前数据模型采用更直接的共享主键：

```sql
CREATE TABLE customer_profiles (
  customer_id INTEGER PRIMARY KEY,
  timezone TEXT NOT NULL,
  preferred_channel TEXT NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

`customer_id` 同时是 PK 和 FK，因此在 `customer_profiles` 中天然不会重复。

## 一对一并不意味着一定要拆表

如果两组字段总是一起存在、一起查询，硬拆成两张表反而会增加复杂度。1:1 更适合下面这些情况：

- 扩展字段很少使用，或者只有部分记录才有；
- 核心字段高频访问，扩展字段低频访问；
- 两部分数据需要不同的访问权限；
- 两部分数据的生命周期不同；
- 主表需要保持相对简洁。

所以“一对一”不是更高级、更规范的默认答案。拆不拆表，要看是否真的有业务理由。

## JOIN 后行数变多，很多时候是正常的

表关系会直接影响查询结果的粒度。

客户 1001 有两张订单。如果把客户表和订单表连接起来，结果自然会出现两行：

```text
1001 | North Retail | 50001
1001 | North Retail | 50002
```

这里 `customer_id` 重复并不是查询错了，而是 1:N 被展开后的正常结果。

真正要检查的是：

```text
这些新增行符合原本的业务关系吗？
还是 JOIN 条件写错，造成了额外的笛卡尔放大？
```

这两个问题不能混在一起。

## 多对多更容易造成重复计算

订单表原本是一行一张订单。和 `order_items` 连接以后，粒度变成一行一条订单明细。

```text
orders
One row = one order

orders + order_items
One row = one product line within one order
```

订单 50001 原来只有一行，因为它有两条明细，JOIN 后就会变成两行。

如果把订单级的 `order_value = 420` 带到两条明细上，再直接求和：

```text
420 + 420 = 840
```

金额就被重复计算了。

怎么处理，要看分析问题本身：

- 需要订单总额，就保持订单粒度；
- 需要产品明细，就使用 `quantity × unit_price`；
- 需要从明细重新算订单金额，就按 `order_id` 聚合 `line_value`。

很多 JOIN 错误并不是语法错误，而是**查询跑通了，粒度却已经变了**。

## 用业务规则判断关系，比看表名可靠

| 业务描述 | 关系 | 常见实现 |
|---|---|---|
| 一个客户有多张订单，每张订单属于一个客户 | 1:N | FK 放在 orders |
| 一张订单含多个产品，一个产品也会出现在多张订单 | N:M | 用 order_items 中间表 |
| 一个客户最多只有一份扩展资料 | 1:1 | FK + UNIQUE，或共享 PK |

建模时先把业务规则说清楚，再决定表结构，通常比先画出几张表再猜它们是什么关系更稳妥。

## 几个常见错误

### 把多对多塞进一个字符串

```text
product_ids = "301,305,309"
```

看起来省了一张表，后面却会让筛选、JOIN、索引和约束都变麻烦。

### 看到外键就以为是一对一

普通外键值可以重复。1:1 还需要 `UNIQUE` 或共享主键之类的唯一性保证。

### 忽略中间表的粒度

桥接表的一行代表一次关系，不等于任意一侧实体的完整记录。

### JOIN 后有重复值就直接去重

1:N 和 N:M 本来就会扩展行数。先确认关系和粒度，再决定是否真的需要去重。

### 根据眼前几条数据猜关系

当前只有一条关联，不代表未来只允许一条。基数应该来自业务规则。

## 建表前可以快速检查这几件事

1. A 的一条记录最多能对应多少条 B？
2. B 的一条记录最多能对应多少条 A？
3. 1:N 的外键是否放在 N 侧？
4. N:M 是否需要中间表？
5. 1:1 是否真的有唯一性约束？
6. 中间表是否还需要保存数量、价格、状态等关系属性？
7. JOIN 以后结果的粒度会变成什么？

把这几个问题回答清楚，表关系通常就不会差得太远。

## 小结

三种关系可以先记住最实用的版本：

```text
1:N
→ 外键通常放在 N 侧

N:M
→ 用中间表拆成两个 1:N

1:1
→ 外键 + UNIQUE，或共享主键
```

真正决定结构的是业务允许的关系数量。字段叫什么、当前样本有几行，都只是表象。

接下来进入 `SELECT`。表怎么连已经清楚之后，才真正开始讨论怎样把这些数据读出来。