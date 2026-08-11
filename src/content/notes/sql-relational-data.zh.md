---
translationKey: sql-relational-data
locale: zh
slug: sql-relational-data
title: SQL 与关系数据
summary: SQL 先从理解数据怎么组织开始。这篇用客户、订单和产品数据说明表、行、列、粒度、NULL 和 Schema，再把关系数据库里最基本的结构串起来。
tags:
  - 关系模型
  - 数据表
  - 记录粒度
  - "NULL"
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
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-primary-key
---

## 为什么需要数据库？

数据量很小时，一份 CSV 或 Excel 就能解决不少问题。客户名单可以是一张表，订单也可以放在另一个工作簿里。

例如：

```text
customer_id,customer_name,segment
1001,North Retail,Retail
1002,Coast Foods,Wholesale
1003,Alpine Labs,Enterprise
```

问题通常出现在数据开始被多人、多个程序长期使用以后。文件之间缺少统一约束，更新容易冲突，关系也只能靠人为记住。客户改了名称，订单文件可能没有同步；某个订单引用了不存在的客户，CSV 本身也不会阻止。

数据库把这些事情集中管理：数据怎样保存、怎样查询、哪些字段必须存在、表之间能不能随便引用，都可以被明确规定。

```text
Application
    │
    │ SQL / database interface
    ▼
Database Management System
    │
    ▼
Persistent data
```

应用负责业务逻辑，数据库负责长期保存和管理数据。SQL 则是操作关系数据库最常见的语言之一。

## 数据不只有一种组织模型

关系数据库今天很常见，但它并不是唯一的数据组织方式。理解几种早期模型，会更容易看出关系模型解决了什么问题。

### 层次模型 Hierarchical Model

层次模型像一棵树，一个节点通常沿固定的父子关系向下展开。

它很适合严格的层级结构，例如组织树或目录。但如果一个对象同时需要和多个上级发生关系，树形结构就会变得别扭。

### 网状模型 Network Model

网状模型允许节点之间建立更多连接，比纯树形结构灵活。

代价是访问数据往往需要理解具体连接路径。应用程序和数据的物理连接方式联系得比较紧，结构一改，访问逻辑也容易跟着变。

### 关系模型 Relational Model

关系模型把不同业务实体拆成二维表，再用键把表连接起来。

```text
customers
orders
products
order_items
```

查询时不需要沿固定路径逐节点寻找，而是描述“需要什么结果”。这也是 SQL 特别适合关系模型的原因。

<div data-learning-slot="relational-model-explorer"></div>

## 关系数据库为什么不是一个“大表”？

把客户、订单、产品全部塞进一张宽表，看起来省事，实际上很容易重复。

例如同一个客户有两张订单：

```text
50001 | North Retail | north@example.com | Retail | 420
50002 | North Retail | north@example.com | Retail | 185
```

客户名称、邮箱和 segment 被重复保存两遍。订单越多，重复越多。

更常见的关系设计是：

```text
customers
→ 保存客户本身

orders
→ 保存订单，并保存 customer_id

products
→ 保存产品本身

order_items
→ 保存订单和产品之间的明细关系
```

这样每张表只负责一种主要业务对象，更新和约束都更清楚。

## 整个 SQL 系列使用同一份业务数据

后续笔记都沿用同一套示例数据，不会每篇重新换一批 ID。

核心表包括：

```text
customers
orders
products
order_items
customer_profiles
```

关键记录：

```text
customers.customer_id = 1001 / 1002 / 1003
orders.order_id       = 50001 / 50002 / 50003 / 50004
products.product_id   = 301 / 305
```

这样主键、外键、SELECT、WHERE、ORDER BY 和分页都可以在同一批数据上继续往前走。

<div data-learning-slot="sql-dataset-explorer"></div>

## 一行到底代表什么？

读一张表之前，先确认一行代表什么，比先看列名更重要。这就是记录粒度。

客户表：

| customer_id | customer_name | email | segment |
|---:|---|---|---|
| 1001 | North Retail | north@example.com | Retail |
| 1002 | Coast Foods | coast@example.com | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | Enterprise |

这里：

> **One row = one customer**

订单表：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

这里：

> **One row = one order**

两张表都出现 `customer_id`，但行的含义完全不同。后面做 JOIN 或聚合时，很多“重复”问题其实都来自没有先看清粒度。

## Record、Row、Column 与 Field 怎样对应？

一行通常叫 record 或 row，代表一条具体记录。

一列叫 column，也常被称为 field，表示同一种属性。

例如客户表中的：

```text
customer_id
customer_name
email
phone
segment
```

每个字段有自己的含义和数据类型，而所有客户记录共享同一套列结构。

## 数据类型不是装饰，而是字段语义的一部分

字段不只是有名字，还要说明它能保存什么类型的值。

| 类型家族 | 常见声明 | 适合表达 |
|---|---|---|
| 整数 | `INT`, `INTEGER`, `BIGINT` | ID、数量、计数 |
| 精确小数 | `DECIMAL(p,s)`, `NUMERIC(p,s)` | 金额、精确比例 |
| 浮点数 | `REAL`, `FLOAT`, `DOUBLE` | 允许近似的连续数值 |
| 文本 | `VARCHAR(n)`, `TEXT` | 名称、描述、标签 |
| 布尔 | `BOOLEAN` | true / false 状态 |
| 日期时间 | `DATE`, `DATETIME`, `TIMESTAMP` | 日期与时间 |
| 半结构化数据 | `JSON` | JSON 文档 |

不同数据库的类型语义并不完全相同。MySQL、PostgreSQL 和 SQLite 对数字、日期和自增主键都有自己的实现细节。

金额尤其需要谨慎。支持固定精度小数的数据库通常会使用类似：

```sql
order_value DECIMAL(12, 2)
```

当前浏览器实验运行在 SQLite/sql.js 上，示例使用 `NUMERIC` affinity。SQLite 的 NUMERIC affinity 并不等于 MySQL 的固定精度 `DECIMAL(12,2)`，生产中的金额设计仍应按具体数据库选择精确方案。

## NULL 到底表示什么？

`NULL` 表示值未知、缺失或当前不适用。

它不是：

```text
0
```

也不是：

```text
''
```

0 是一个确定数值，空字符串也是一个确定字符串；`NULL` 则表示没有可用值。

如果客户电话未知，可以用 `NULL`。如果客户名称在业务上必须存在，就可以写：

```sql
customer_name TEXT NOT NULL
```

`NOT NULL` 的判断标准应该是业务是否允许缺失，而不是机械地给所有字段都加上。

## Schema 和 Data 是两件事

### Schema：结构规则

Schema 说明表有哪些列、数据类型是什么，以及有哪些约束。

```text
customers
├── customer_id
├── customer_name
├── email
├── phone
└── segment
```

还可能包含：

```text
PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
```

### Data：实际记录

Data 是当前真正存进去的值：

```text
1001 | North Retail | north@example.com | 021-440-810 | Retail
1002 | Coast Foods  | coast@example.com | 021-440-811 | Wholesale
```

记录可以不断增加或更新，但这并不意味着表结构每次都要重新设计。

## 为什么同一个信息不应该到处重复？

如果订单表直接保存客户名称：

| order_id | customer_name | order_value |
|---:|---|---:|
| 50001 | North Retail | 420.00 |
| 50002 | North Retail | 185.00 |

客户更名以后，两条历史订单都可能需要同步修改。

如果订单只保存：

```text
customer_id = 1001
```

客户名称只在 `customers` 表维护一次，结构就更稳定。

后面的主键、外键和表关系，都是在继续解决“怎样让这种拆分可靠工作”。

## SQL 是什么？

SQL 是 Structured Query Language。它不只用来读取数据，也能定义结构和修改记录。

### DDL — Data Definition Language

DDL 主要处理结构，例如：

```sql
CREATE TABLE
ALTER TABLE
DROP TABLE
```

### DML — Data Manipulation Language

DML 主要处理记录变化：

```sql
INSERT
UPDATE
DELETE
```

### DQL — Data Query Language

DQL 关注查询，最核心的语句是：

```sql
SELECT
```

后面的 SQL 05 会正式进入查询。

## 标准 SQL 和数据库方言不要混淆

SQL 有共同的核心语法，但各数据库都有自己的扩展。

例如：

```text
MySQL
→ AUTO_INCREMENT

PostgreSQL
→ identity / sequence

SQLite
→ type affinity / PRAGMA
```

所以看到某段 SQL 时，最好分清它是标准概念，还是某个数据库特有的写法。

当前互动实验统一使用 SQLite/sql.js。遇到 MySQL 或 PostgreSQL 特有语法时，会单独说明，而不是假装所有数据库完全一致。

## SQL 关键字为什么统一大写？

下面两种写法通常都能运行：

```sql
select * from customers;
```

```sql
SELECT * FROM customers;
```

把 SQL 关键字写成大写主要是可读性习惯，能更快区分语法和表名、字段名，并不是语法要求。

真正需要保持一致的是团队风格，而不是大写本身。

## 常见关系数据库有哪些？

常见关系数据库包括：

```text
PostgreSQL
MySQL
Microsoft SQL Server
Oracle Database
SQLite
```

它们都建立在关系模型和 SQL 基础上，但定位不同。SQLite 适合嵌入式和本地轻量场景；PostgreSQL、MySQL、SQL Server 等更常见于服务端系统。

学习 SQL 时，先把关系模型、键、查询和数据粒度掌握清楚，比一开始记住所有数据库方言更重要。

## 这一篇真正需要留下的几个概念

关系数据库的基础可以压缩成几件事：

```text
表
→ 保存同一类业务记录

行
→ 一条具体记录

列
→ 一种属性

粒度
→ 一行到底代表什么

Schema
→ 结构和约束

Data
→ 当前实际值

SQL
→ 定义、查询和修改关系数据
```

下一步进入主键。数据库既然把业务对象拆成一行一行的记录，就需要一种稳定的方法回答：**这一行到底是哪一个对象？**