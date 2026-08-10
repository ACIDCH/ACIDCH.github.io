---
translationKey: sql-foreign-key
locale: zh
slug: sql-foreign-key
title: 外键：如何让两张业务表保持可靠的引用关系
summary: 从客户与订单的引用关系出发，理解外键如何连接父表与子表、保护引用完整性，并识别无效引用、逻辑外键与数据库约束之间的区别。
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
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-primary-key
---

## 主键解决“是谁”，外键解决“和谁有关”

主键为一条记录建立稳定身份，但真实业务数据很少只存在于一张表中。

例如，客户表保存客户：

| customer_id | customer_name | segment |
|---:|---|---|
| 1001 | North Retail | Retail |
| 1002 | Coast Foods | Wholesale |
| 1003 | Alpine Labs | Enterprise |

订单表保存订单：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |

在 `customers` 中：

```text
customer_id
→ 客户记录的主键
```

在 `orders` 中：

```text
customer_id
→ 这张订单属于哪个客户
```

第二个 `customer_id` 承担的就是外键角色。

```text
orders.customer_id
        │
        └────────────→ customers.customer_id
              FK                    PK
```

因此，主键关注记录身份，外键关注记录之间的引用关系。

## 外键不是因为列名相同才成立

两张表都有一个叫 `customer_id` 的字段，并不会自动产生数据库关系。

下面两个字段即使名称相同：

```text
customers.customer_id
orders.customer_id
```

数据库仍然需要明确知道：

```text
orders.customer_id
REFERENCES
customers.customer_id
```

关系的关键不在列名，而在约束定义。

例如建表时可以写：

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

其中：

```sql
FOREIGN KEY (customer_id)
```

指定 `orders.customer_id` 是外键字段。

而：

```sql
REFERENCES customers (customer_id)
```

指定这个值必须引用 `customers.customer_id` 中已经存在的记录。

## 父表与子表怎样理解？

在这组关系中：

```text
customers
→ 被引用
→ 父表 Parent Table

orders
→ 保存引用
→ 子表 Child Table
```

父表提供可以被引用的稳定身份，子表保存指向这些身份的值。

例如：

```text
orders.customer_id = 1002
```

意味着这张订单指向：

```text
customers.customer_id = 1002
```

也就是 `Coast Foods`。

这种设计避免在每张订单中重复保存完整客户资料，同时保留订单与客户之间的连接。

## 什么叫引用完整性？

假设订单表准备插入一条新记录：

```text
order_id = 50999
customer_id = 9999
order_value = 99.00
```

但客户表中只有：

```text
1001
1002
1003
```

此时 `customer_id = 9999` 找不到对应客户。

这条订单就形成了一个无效引用：

```text
orders.customer_id = 9999
        │
        └──────X────→ customers.customer_id
                    不存在 9999
```

如果数据库启用了外键约束，这次插入应被拒绝。

外键约束保护的就是这种 **Referential Integrity（引用完整性）**：子表中的引用值必须能够在被引用表中找到合法目标。

<div data-learning-slot="foreign-key-lab"></div>

## 外键约束如何阻止无效订单？

下面的表结构启用了外键：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_value REAL NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

如果客户 `1001` 已经存在：

```sql
INSERT INTO orders (
  order_id,
  customer_id,
  order_value
)
VALUES (
  50010,
  1001,
  250.00
);
```

引用有效，因此可以插入。

如果客户 `9999` 不存在：

```sql
INSERT INTO orders (
  order_id,
  customer_id,
  order_value
)
VALUES (
  50011,
  9999,
  250.00
);
```

启用外键约束后，数据库会拒绝这条记录。

这种错误比后续分析阶段才发现“订单没有客户”更容易定位，因为问题在数据写入时就被阻止。

<div data-learning-slot="sql-playground"></div>

## 为什么必须先有父表记录？

外键关系意味着子表记录依赖一个已经存在的引用目标。

例如：

```text
先有 customers.customer_id = 1001
↓
再插入 orders.customer_id = 1001
```

如果顺序反过来，在客户尚不存在时先插入订单，外键检查就无法通过。

这种依赖关系说明数据库写入顺序并不是完全随意的。

在数据导入、系统迁移或批量初始化时，通常需要先建立被引用的数据，再写入依赖这些数据的记录。

## 外键列可以重复吗？

可以。

外键与主键承担不同职责。

客户 `1001` 可以拥有多张订单：

| order_id | customer_id |
|---:|---:|
| 50001 | 1001 |
| 50002 | 1001 |
| 50008 | 1001 |

这里：

```text
orders.customer_id = 1001
```

出现多次并没有违反外键规则。

原因是外键只要求：

> 每一个非空引用值都能够找到合法目标。

它并不要求这个值在子表中唯一。

这也是一对多关系能够成立的基础之一。关系的基数与更多结构形式会在下一篇单独展开。

## 外键可以为空吗？

是否允许为空取决于字段定义和业务规则。

例如：

```sql
customer_id INTEGER NOT NULL
```

表示每张订单都必须属于一个客户。

如果字段允许 `NULL`：

```sql
customer_id INTEGER
```

则可能出现“当前没有客户引用”的记录。

是否应该允许这种情况，需要由业务语义决定，而不能只从 SQL 语法判断。

对于订单这类通常必须有客户归属的记录，`NOT NULL` 往往更清楚。

## 逻辑外键与数据库外键约束不是同一件事

有些系统会保存类似：

```text
orders.customer_id
```

并在程序逻辑中把它当成对 `customers.customer_id` 的引用，但数据库本身并没有声明 `FOREIGN KEY` 约束。

这种字段仍然具有“逻辑外键”的含义，但数据库无法自动阻止：

```text
customer_id = 9999
```

这样的孤立引用进入表中。

两种做法可以这样区分：

| 方式 | 数据库是否检查引用 | 主要责任位置 |
|---|---|---|
| 声明 FOREIGN KEY | 是 | 数据库约束 + 应用逻辑 |
| 仅保留逻辑引用字段 | 否 | 应用逻辑 / 数据管道 |

在学习数据模型和强调数据完整性的场景中，显式外键约束更容易展示关系规则，也更容易在错误发生时及时暴露问题。

## 删除外键约束不等于删除字段

外键包含两个层次：

```text
customer_id 这一列
+
这列上的 FOREIGN KEY 约束
```

删除约束时，字段本身仍然可以保留。

例如某些数据库中可以通过类似：

```sql
ALTER TABLE orders
DROP CONSTRAINT fk_orders_customer;
```

移除约束。

具体语法会因数据库系统而不同，但概念保持一致：

```text
删除约束
≠
删除列
```

约束消失后，`customer_id` 仍然可以继续保存数据，只是数据库不再自动保证它一定能找到合法客户。

## 外键为什么会直接影响分析质量？

假设订单表存在孤立引用：

| order_id | customer_id | order_value |
|---:|---:|---:|
| 50001 | 1001 | 420.00 |
| 50002 | 9999 | 185.00 |

而客户表中不存在 `9999`。

执行：

```sql
SELECT
  o.order_id,
  c.customer_name,
  o.order_value
FROM orders AS o
JOIN customers AS c
  ON o.customer_id = c.customer_id;
```

使用普通 `INNER JOIN` 时，无法匹配的订单可能不会出现在结果中。

于是就可能出现：

```text
订单表金额总计
≠
连接客户表后的金额总计
```

这会进一步影响：

- 客户收入汇总；
- 客户分群 KPI；
- segment 级销售分析；
- 客户留存或价值分析；
- 数据仓库事实表与维度表连接。

因此，外键不仅是数据库结构问题，也是一项重要的数据质量控制机制。

## 检查外键关系时可以问什么？

面对两张需要连接的业务表，可以依次检查：

1. **子表中的字段到底在引用哪张表？**
2. **被引用字段是否具有稳定且唯一的记录身份？**
3. **每一个引用值是否都能找到目标记录？**
4. **外键字段是否允许 `NULL`？**
5. **父表记录是否需要先于子表写入？**
6. **数据库是否真正声明了外键约束，还是只有逻辑引用？**
7. **出现孤立引用时，会怎样影响后续 JOIN 和 KPI？**

这套检查可以把“字段看起来能连上”提升为“关系在结构和数据上都可靠”。

## 本篇的核心判断

外键可以归结为一句话：

> **外键不是为了让两个字段名称看起来一致，而是为了明确一条记录引用另一条记录的规则。**

关系模型中的两个基本问题因此可以分开：

```text
Primary Key
→ 这条记录是谁？

Foreign Key
→ 这条记录和谁有关？
```

当身份和引用都清楚以后，多张业务表才具备稳定组合的基础。

## 下一步：关系到底是一对多还是多对多？

外键已经建立了表之间的引用，但还需要继续判断：

```text
一个客户可以有多少张订单？
一个产品可以出现在多少张订单中？
两个实体之间是否需要中间表？
```

下一篇 SQL 04 将进入：

```text
One-to-Many
Many-to-Many
One-to-One
```

也就是关系模型中的基数与关联结构。
