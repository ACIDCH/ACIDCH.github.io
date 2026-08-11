---
translationKey: sql-foreign-key
locale: zh
slug: sql-foreign-key
title: 外键
summary: 订单里的 customer_id 不是普通数字，它应该指向一个真实客户。这里用客户和订单说明外键、父表、子表和引用完整性，也解释不同数据库在约束写法上的差别。
tags:
  - 外键
  - 关系模型
  - 引用完整性
  - 数据库设计
topics:
  - 数据管理
  - 数据建模
  - 数据完整性
tools:
  - SQL
  - SQLite
series: SQL 与关系数据
seriesSlug: sql
order: 3
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-primary-key
  - sql-relationships
---

## 主键解决“是谁”，外键解决“和谁有关”

客户表里的 `customer_id` 能唯一找到一个客户。到了订单表，同一个字段承担了另一层作用：说明这张订单属于谁。

客户表：

| customer_id | customer_name | segment |
|---:|---|---|
| 1001 | North Retail | Retail |
| 1002 | Coast Foods | Wholesale |
| 1003 | Alpine Labs | Enterprise |

订单表：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

这里：

```text
customers.customer_id
→ Primary Key

orders.customer_id
→ Foreign Key
```

外键把一张表中的记录安全地指向另一张表。

## 外键不是因为列名相同才成立

两张表都叫 `customer_id`，并不会自动产生数据库关系。真正的约束需要明确写出来：

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

这段 SQL 做了两件事：

```sql
FOREIGN KEY (customer_id)
```

说明 `orders.customer_id` 是引用列；

```sql
REFERENCES customers (customer_id)
```

说明它引用的是 `customers.customer_id`。

列名相同只是良好的命名习惯。即使子表字段叫 `buyer_id`，也可以引用 `customers.customer_id`，只要约束明确写对。

<div data-learning-slot="foreign-key-lab"></div>

## 父表和子表只是引用方向

在这段关系中：

```text
customers
→ 被引用
→ Parent table

orders
→ 保存 customer_id
→ Child table
```

“父”和“子”并不表示业务重要性，也不是说客户一定比订单更高级。它只是描述引用方向。

一个 parent record 可以被很多 child records 引用，这也是后面一对多关系的基础。

## 什么叫引用完整性？

Referential integrity 要求外键引用必须有合法目标。

当前客户 ID 只有：

```text
1001
1002
1003
```

如果新订单写成：

```text
order_id = 50005
customer_id = 9999
```

而客户 9999 根本不存在，那么这条订单就成了孤儿记录。

外键约束的作用就是阻止这种引用进入数据库。

这比后续分析时才发现“有订单找不到客户”可靠得多，因为错误在写入时就会暴露。

## 外键约束如何阻止无效订单？

SQLite 中先开启外键检查：

```sql
PRAGMA foreign_keys = ON;
```

再插入不存在的客户：

```sql
INSERT INTO orders (
  order_id,
  customer_id,
  order_date,
  order_value
)
VALUES (
  50005,
  9999,
  '2026-07-10',
  250
);
```

如果外键已正确创建并启用，这条 INSERT 会失败。

这种失败是好事。数据库是在告诉使用者：订单引用了一个不存在的客户，数据关系已经不成立。

## 外键列通常可以重复

`orders.customer_id` 是外键，但客户 1001 可以出现两次：

```text
50001 → 1001
50002 → 1001
```

这完全正常，因为一个客户可以有多张订单。

因此：

```text
Foreign Key
≠ UNIQUE
```

如果外键同时设置 `UNIQUE`，关系才会被进一步限制成“一个父记录最多对应一个子记录”的结构之一。

普通外键本身只保证引用合法，并不规定能引用多少次。

## 删除父表记录时会发生什么

假设客户 1001 仍然有订单。如果直接删除这个客户，订单就会失去引用目标。

数据库通常需要一个明确策略。

### RESTRICT / NO ACTION

如果还有子记录，就拒绝删除父记录。

这是最保守、也最容易理解的选择。

### CASCADE

删除父记录时，相关子记录一起删除：

```sql
FOREIGN KEY (customer_id)
  REFERENCES customers (customer_id)
  ON DELETE CASCADE
```

这种行为很强，必须确认业务上真的希望“删除客户就把历史订单一起删掉”。很多交易系统不会这样设计。

### SET NULL

如果外键列允许 `NULL`，可以在父记录删除后把引用改为 `NULL`。

是否合理取决于业务是否允许“订单存在，但客户未知”。

外键动作没有统一最佳答案，应该按数据生命周期决定。

## 更新主键也需要考虑引用关系

如果被引用的主键发生变化，子表怎么办？某些数据库支持：

```sql
ON UPDATE CASCADE
```

让外键跟着更新。

但从设计上看，主键本来就应该尽量稳定。如果一个键经常修改，先检查它是否真的适合承担记录身份，通常比依赖大量级联更新更重要。

## 外键也可以后加，但语法取决于数据库

在一些数据库中，可以先建表，再用 `ALTER TABLE` 添加外键。

例如常见思路：

```sql
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id);
```

给约束命名有助于后续维护和排错。

### SQLite 为什么不同？

SQLite 的 `ALTER TABLE` 能力和 MySQL、PostgreSQL 并不完全一样。很多复杂约束修改需要通过创建新表、迁移数据、重命名表等方式完成。

因此，不能把某个数据库的 DDL 语法直接复制到所有数据库里。

当前学习实验使用 SQLite，所以表关系通常在 `CREATE TABLE` 时直接定义。

## 逻辑外键与数据库约束不是同一件事

真实数据仓库和分析平台里，经常会出现“逻辑上这是外键”，但数据库没有真正创建 `FOREIGN KEY` constraint 的情况。

例如事实表中的：

```text
customer_id
product_id
```

在数据模型上显然引用维度表，却可能因为 ETL、分区、性能或平台限制，没有物理外键。

这时关系仍然存在，但引用完整性要靠数据管道和质量检查保证。

所以应该区分：

```text
logical relationship
→ 数据模型上应该怎样关联

physical foreign-key constraint
→ 数据库是否真正强制执行
```

两者相关，但并不完全等价。

## 外键值和主键值的数据类型要能对应

如果 parent key 是整数：

```sql
customers.customer_id INTEGER
```

child foreign key 也应该使用兼容的类型。

如果一边保存整数 1001，另一边保存文本 `'1001'`，有些数据库可能进行隐式转换，有些场景则会导致索引、比较和约束行为变得混乱。

键字段的类型、长度和编码最好从设计阶段就保持一致。

## 外键会直接影响后面的 JOIN

有了：

```text
orders.customer_id
→ customers.customer_id
```

后面就可以写：

```sql
SELECT
  o.order_id,
  c.customer_name,
  o.order_value
FROM orders AS o
JOIN customers AS c
  ON o.customer_id = c.customer_id;
```

JOIN 语法本身并不会强制要求数据库有外键，但外键为这段连接提供了清楚的数据模型依据。

如果连接字段并不是真正的业务关系，即使 SQL 能运行，也可能产生错误的结果。

## 外键最常见的几种问题

### 引用不存在的 ID

这是最直接的引用完整性错误。

### 删除父记录时没有考虑历史数据

级联删除可能带走不应该消失的交易记录。

### 误以为同名字段自动有关联

没有明确模型关系时，不能只凭字段名猜 JOIN。

### 子表外键类型和父表主键类型不一致

这会给约束和查询留下隐患。

### 数据仓库没有物理外键，就以为关系不存在

逻辑关系仍然需要通过 ETL 测试或数据质量规则维护。

## 检查一段外键设计时，可以问这些问题

1. 子表字段到底引用哪张表的哪一列？
2. 被引用列是否唯一并适合作为键？
3. 子表是否允许 `NULL`？
4. 外键能不能重复？业务关系是 1:N 还是 1:1？
5. 删除或更新 parent record 时应该怎么办？
6. 键字段类型是否兼容？
7. 数据库是否真的启用了约束？
8. 如果只有逻辑外键，完整性由谁检查？

外键的核心并不复杂：**子表里出现的引用值，必须能找到一个合理的目标。** 下一篇会继续处理关系数量，也就是一对多、多对多和一对一到底应该怎样表示。