---
translationKey: sql-foreign-key
locale: zh
slug: sql-foreign-key
title: 外键：如何让两张业务表保持可靠的引用关系
summary: 从客户与订单的引用关系出发，理解外键如何连接父表与子表、保护引用完整性，并识别无效引用、逻辑外键、命名约束与不同数据库 DDL 之间的区别。
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
  - sql-relationships
---

## 主键解决“是谁”，外键解决“和谁有关”

主键为一条记录建立稳定身份，但真实业务数据很少只存在于一张表中。

统一数据集中的客户表：

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

在 `customers` 中：

```text
customer_id
→ 客户记录的 Primary Key
```

在 `orders` 中：

```text
customer_id
→ 这张订单属于哪个客户
```

第二个 `customer_id` 承担外键角色：

```text
orders.customer_id · FK
        │
        └────────────→ customers.customer_id · PK
```

因此，主键关注记录身份，外键关注记录之间的引用关系。

## 外键不是因为列名相同才成立

两张表都有一个叫 `customer_id` 的字段，并不会自动产生数据库约束。

关系真正来自：

```text
FOREIGN KEY
+
REFERENCES
```

例如：

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

其中：

```sql
FOREIGN KEY (customer_id)
```

声明 `orders.customer_id` 是引用列；

```sql
REFERENCES customers (customer_id)
```

声明目标是 `customers.customer_id`。

列名相同只是本系列的命名习惯，不是数据库判断外键关系的依据。

## 父表与子表怎样理解？

这组关系可以表示为：

```text
customers
→ 被引用
→ Parent Table

orders
→ 保存引用
→ Child Table
```

例如：

```text
orders.customer_id = 1002
```

指向：

```text
customers.customer_id = 1002
```

也就是 `Coast Foods`。

订单不必重复保存完整客户资料，只要保留稳定的客户 ID，就可以在需要时通过 JOIN 取回客户属性。

## 什么叫引用完整性？

假设准备插入：

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

此时 `9999` 找不到父表目标：

```text
orders.customer_id = 9999
        │
        └──────X────→ customers.customer_id
                       no match
```

如果数据库启用了外键检查，这次写入应该被拒绝。

外键约束保护的就是 **Referential Integrity（引用完整性）**：子表中的引用必须满足数据库声明的关系规则。

<div data-learning-slot="foreign-key-lab"></div>

## 外键约束如何阻止无效订单？

当前浏览器实验使用 SQLite/sql.js，表结构中直接声明外键：

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_value NUMERIC NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

并且运行：

```sql
PRAGMA foreign_keys = ON;
```

这是一个非常重要的 SQLite 细节：**不能只看到表结构里写了 `FOREIGN KEY` 就假设当前连接一定正在执行外键检查。** 本系列的 sql.js 初始化脚本会显式启用它。

合法引用：

```sql
INSERT INTO orders (
  order_id,
  customer_id,
  order_date,
  order_value
)
VALUES (
  50010,
  1001,
  '2026-08-10',
  250.00
);
```

无效引用：

```sql
INSERT INTO orders (
  order_id,
  customer_id,
  order_date,
  order_value
)
VALUES (
  50999,
  9999,
  '2026-08-10',
  99.00
);
```

第二条会在当前实验环境中触发外键约束错误。

<div data-learning-slot="sql-playground"></div>

## 外键也可以后加，但语法取决于数据库

外键不一定只能在首次 `CREATE TABLE` 时声明。

在支持相应 `ALTER TABLE` 语法的数据库中，可以给约束命名。例如常见的 MySQL 风格写法是：

```sql
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id);
```

这里：

```text
fk_orders_customer
```

是约束名称。给约束命名的好处是以后检查、迁移或删除时更容易明确操作对象。

但这段语法不能不加说明地复制到所有数据库。

### SQLite 为什么不同？

SQLite 的 `ALTER TABLE` 支持范围比 MySQL/PostgreSQL 受限，不能用一个通用：

```sql
ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ...
```

直接给已有表添加外键约束。

需要修改这类表级约束时，SQLite 常见做法是创建新表、复制数据、替换旧表，并在迁移过程中重新检查 schema 与引用完整性。

因此，本系列浏览器实验直接在 `CREATE TABLE` 阶段声明外键，而不是假装所有数据库的 ALTER 语法完全相同。

## 为什么必须先有父表记录？

外键关系意味着子表记录依赖合法目标。

```text
先有 customers.customer_id = 1001
↓
再插入 orders.customer_id = 1001
```

如果客户尚不存在就先插入订单，启用外键检查时无法满足引用完整性。

这会影响：

- 初始化数据库；
- 批量导入；
- 系统迁移；
- 测试数据构造；
- DELETE / UPDATE 的执行顺序。

外键不是一条孤立语法，而是在建立记录之间的生命周期依赖。

## 外键列可以重复吗？

可以。

统一数据集中，客户 `1001` 有两张订单：

| order_id | customer_id |
|---:|---:|
| 50001 | 1001 |
| 50002 | 1001 |

`orders.customer_id = 1001` 出现两次并没有违反外键规则。

原因是外键只要求每个非空引用值能够找到合法目标，并不要求这个值在子表中唯一。

这正是一对多关系能够成立的基础。

## 外键可以为空吗？

是否允许 `NULL` 取决于字段约束和业务语义。

```sql
customer_id INTEGER NOT NULL
```

表示每张订单都必须引用客户。

如果写成：

```sql
customer_id INTEGER
```

则字段本身允许 `NULL`。多数关系数据库的普通外键约束不会要求 `NULL` 必须匹配父表中的某一行，因为 `NULL` 表示没有已知引用值。

因此必须分别判断两个问题：

```text
是否允许没有引用？
→ NULL / NOT NULL

非空引用是否合法？
→ FOREIGN KEY
```

对于本系列的订单数据，业务规则设定为每张订单必须属于一个客户，所以使用 `NOT NULL`。

## 逻辑外键与数据库约束不是同一件事

有些系统保留：

```text
orders.customer_id
```

并在应用逻辑或数据管道中把它视为对客户表的引用，但数据库 schema 并没有声明 `FOREIGN KEY`。

这种字段仍然具有“逻辑外键”的业务含义，但数据库本身不会自动阻止：

```text
customer_id = 9999
```

进入表中。

可以这样区分：

| 方式 | 数据库自动检查引用 | 主要责任位置 |
|---|---|---|
| 声明 `FOREIGN KEY` | 是（且当前连接启用相应检查时） | 数据库 + 应用 |
| 只有逻辑引用字段 | 否 | 应用 / 数据管道 / 数据质量测试 |

不能简单地说“所有系统都必须使用数据库外键”，也不能说“高性能系统就一定不使用外键”。是否使用数据库级约束需要结合写入吞吐、分库架构、迁移策略、数据治理和故障模式判断。

学习关系模型时，显式外键最容易把引用规则展示清楚；真实系统设计则需要在完整架构上下文中权衡。

## 删除外键约束不等于删除字段

外键包含两个层次：

```text
customer_id 这一列
+
这列上的 FOREIGN KEY constraint
```

在支持命名约束删除的数据库中，可能使用类似：

```sql
ALTER TABLE orders
DROP CONSTRAINT fk_orders_customer;
```

某些数据库使用的具体关键字会不同。

概念保持一致：

```text
删除 constraint
≠
删除 customer_id column
```

约束消失后，字段仍然存在，只是数据库不再通过这条约束自动保证引用合法。

SQLite 修改已有外键结构时同样需要遵循它自己的 ALTER TABLE / table rebuild 规则。

## 外键为什么会直接影响分析质量？

假设没有数据库约束，也没有数据质量检查，订单中混入：

| order_id | customer_id | order_value |
|---:|---:|---:|
| 50001 | 1001 | 420.00 |
| 50999 | 9999 | 99.00 |

客户表不存在 `9999`。

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

普通 `INNER JOIN` 不会为 9999 产生匹配行。

于是可能出现：

```text
orders 原表金额总计
≠
INNER JOIN customers 后的金额总计
```

这会继续影响：

- 客户收入；
- segment KPI；
- 客户价值分析；
- 事实表与维度表连接；
- 下游报表与模型训练数据。

因此，引用完整性既是数据库设计问题，也是分析数据质量问题。

## 检查外键关系时可以问什么？

面对两张需要连接的表，可以依次检查：

1. **子表中的字段引用哪张表、哪一列？**
2. **目标列是否具有稳定且唯一的记录身份？**
3. **每一个非空引用值是否都能找到目标？**
4. **引用字段是否允许 `NULL`？**
5. **父表数据是否需要先写入？**
6. **数据库真的声明并启用了约束，还是只有逻辑引用？**
7. **当前数据库支持怎样的 ADD / DROP constraint 语法？**
8. **出现孤立引用时，JOIN 与 KPI 会受到什么影响？**

这套检查把“字段看起来能连上”提升为“关系在结构、运行时和数据上都可靠”。

## 本篇的核心判断

外键可以归结为一句话：

> **外键不是让两个字段名称看起来一样，而是明确一条记录可以怎样引用另一张表中的记录。**

关系模型中的两个问题因此分开：

```text
Primary Key
→ 这条记录是谁？

Foreign Key
→ 这条记录和谁有关？
```

当身份和引用都清楚以后，才进入下一层：一条记录究竟可以对应多少条另一侧记录。

## 下一步：关系到底是一对多还是多对多？

SQL 04 将继续回答：

```text
一个客户可以有多少张订单？
一张订单可以有多少个产品？
一个产品可以出现在多少张订单中？
什么时候需要中间表？
```

也就是：

```text
One-to-Many
Many-to-Many
One-to-One
```
