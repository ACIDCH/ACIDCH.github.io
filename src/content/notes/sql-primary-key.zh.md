---
translationKey: sql-primary-key
locale: zh
slug: sql-primary-key
title: 主键
summary: 主键用来唯一标识一条记录。客户名称、邮箱等业务字段会变化，所以数据库通常会用更稳定的 ID 来做主键；后面再比较自增整数、UUID、自然键和联合主键。
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
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-relational-data
  - sql-foreign-key
---

## 主键到底解决什么问题？

客户名称、邮箱、手机号都能帮助辨认客户，但它们都有可能变化。数据库需要一个更稳定的字段，确保名称改了、联系方式换了以后，仍然知道这是同一条客户记录。

当前客户表：

| customer_id | customer_name | email | phone | segment |
|---:|---|---|---|---|
| 1001 | North Retail | north@example.com | 021-440-810 | Retail |
| 1002 | Coast Foods | coast@example.com | 021-440-811 | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | 021-440-812 | Enterprise |

这里的 `customer_id` 就是主键，用来唯一标识客户记录。

Primary Key 不是“最重要的业务字段”，它只负责让数据库准确找到某一条记录。

## 主键必须唯一，而且不能为空

一个主键至少要满足两件事：

```text
不能重复
不能为 NULL
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

`customer_id` 是主键。即使 `email` 也设置了 `UNIQUE`，两者职责仍然不同：邮箱是业务属性，客户 ID 用来标识记录。

如果数据库允许两条客户记录都叫 1001，后面 UPDATE、DELETE、JOIN 都会出现歧义，所以唯一性不是可选装饰。

## “现在唯一”不等于适合当主键

某个字段当前没有重复，只能说明它现在满足唯一性，还不能说明它适合长期做主键。

例如邮箱：

```text
north@example.com
coast@example.com
alpine@example.com
```

当前确实都不同。但客户换邮箱是一件很普通的业务变化。如果邮箱就是主键，更新联系方式就同时变成了更新记录标识。

类似问题也会出现在手机号、用户名、产品名称和某些业务编码上。

所以选择主键时，除了唯一性，还要看：

- 是否稳定；
- 是否容易变化；
- 是否允许为空；
- 是否过度承载业务含义；
- 是否适合被其他表长期引用。

<div data-learning-slot="primary-key-lab"></div>

## 主键和 UNIQUE 解决的问题不完全一样

一张表可以有多个 `UNIQUE` 字段或组合，但通常只有一个 Primary Key。

例如：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  customer_name TEXT NOT NULL
);
```

这里：

```text
customer_id
→ 唯一标识这条记录

email
→ 业务上不允许重复
```

`UNIQUE` 很适合保护业务规则，但不必因此把每个唯一字段都当成主键。

## 自增整数：常见但不是唯一方案

很多数据库会用整数 ID 做 surrogate key。

典型形式是：

```text
1001
1002
1003
...
```

优点很明显：短、稳定、索引友好、JOIN 时容易处理，也不会因为业务字段变化而跟着变化。

`AUTO_INCREMENT` 是 MySQL 方言，常见写法是：

```sql
customer_id BIGINT AUTO_INCREMENT PRIMARY KEY
```

PostgreSQL 更常见 identity column：

```sql
customer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

不同数据库语法不一样，但共同思想是让数据库产生一个稳定的代理 ID。

## SQLite 的 INTEGER PRIMARY KEY 有什么特殊之处？

SQLite 中：

```sql
customer_id INTEGER PRIMARY KEY
```

具有特殊语义，它会成为 rowid 的别名。

插入时如果没有提供具体 ID，SQLite 可以自动生成整数值：

```sql
INSERT INTO customers (customer_name, email, segment)
VALUES ('Harbour Works', 'harbour@example.com', 'Retail');
```

需要注意，SQLite 的 `INTEGER PRIMARY KEY` 和 MySQL 的 `AUTO_INCREMENT` 不是同一种实现。学习跨数据库 SQL 时，最好把“主键概念”和“具体数据库如何生成 ID”分开理解。

## UUID：适合分布式生成，但不是一种单一算法

UUID 常用于不方便依赖单个数据库自增序列的场景，例如多个服务或设备需要独立生成 ID。

它的形式通常比整数长：

```text
550e8400-e29b-41d4-a716-446655440000
```

优势是生成空间大、跨系统碰撞概率低，也更适合分布式环境。

代价包括：

- 存储更大；
- 索引更重；
- 人工阅读不如整数方便；
- 某些随机 UUID 对 B-tree 写入局部性不友好。

而且“UUID”是一个家族，不同版本的生成方式和排序特征并不一样。不能把所有 UUID 都简单理解成完全随机字符串。

## 自然键什么时候也可以做主键

Natural key 指业务本身已经存在、而且具有稳定唯一性的字段。

例如某些标准代码、国家定义的永久编号、系统内严格受控且不可变化的组合，都可能成为候选主键。

关键不是“代理键永远更好”，而是评估自然键是否真的满足：

```text
唯一
非空
稳定
长度合理
长期语义清楚
```

如果业务编号未来可能重新编码，用它做主键就要格外谨慎。

## 联合主键：多个字段也可以共同确定一条记录

有些记录的唯一性天然来自多个字段的组合。

`order_items` 是典型例子。当前规则规定：同一张订单中的同一个产品只出现一条明细。

因此：

```text
(order_id, product_id)
```

共同决定一条记录。

SQL 可以写成：

```sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

这里 `order_id` 单独会重复，`product_id` 单独也会重复，但两者组合不能重复。

联合主键特别适合桥接表，不过字段很多时也会让后续外键变长，所以仍然要按数据模型权衡。

## 主键不要被当成业务顺序

看到整数主键，很容易把它当成时间顺序：

```text
ID 大
→ 一定更晚
```

这并不可靠。

不同数据库、迁移过程、批量导入或分布式 ID 都可能打破这种假设。真正需要按时间排序时，应该使用明确的日期时间字段，例如：

```sql
ORDER BY created_at
```

主键负责标识记录，不应该被偷偷当成没有定义过的业务时间字段。

## 主键一旦被引用，随意修改的代价会很高

订单表中的：

```text
orders.customer_id
```

会引用客户主键。

如果主键经常变化，所有引用它的外键都要考虑同步更新。数据库可以提供 `ON UPDATE CASCADE` 等机制，但从设计角度看，一个稳定主键通常更简单。

这也是为什么客户名称这类经常修改的字段不适合做主键。

## 运行一个最小的主键实验

可以在 SQLite playground 中尝试：

```sql
CREATE TABLE demo_customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL
);

INSERT INTO demo_customers VALUES (1, 'North');
INSERT INTO demo_customers VALUES (1, 'Coast');
```

第二条 INSERT 会因为主键重复失败。

<div data-learning-slot="sql-playground"></div>

这种约束的价值很直接：错误数据不是等分析时才发现，而是在写入数据库时就被阻止。

## 建表前可以这样检查主键

1. 每条记录是否都有唯一标识？
2. 候选字段会不会随着普通业务更新而改变？
3. 是否允许 `NULL`？
4. 这个键未来会不会被很多表引用？
5. 自然键是否真的稳定，还是只是当前恰好唯一？
6. 是否需要联合主键？
7. 具体数据库生成 ID 的语法是什么？

主键解决的是一个很基础的问题：怎样长期、准确地标识一条记录。下一篇继续看外键，也就是另一张表怎样安全地引用这个主键。