---
translationKey: sql-relational-data
locale: zh
slug: sql-relational-data
title: SQL 与关系数据
summary: 从为什么需要数据库开始，理解层次、网状与关系模型，掌握表、记录、字段、粒度、数据类型、NULL、Schema、SQL 操作类别与数据库方言，并建立后续主键、外键与查询的完整基础。
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
updatedAt: 2026-08-10
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-primary-key
---

## 为什么需要数据库？

应用程序需要长期保存业务数据。最直接的方法当然可以是文件：CSV、JSON、Excel 工作簿甚至普通文本都能保存记录。

例如，一份客户 CSV 可能是：

```text
customer_id,customer_name,segment
1001,North Retail,Retail
1002,Coast Foods,Wholesale
1003,Alpine Labs,Enterprise
```

数据量很小时，这种方式足够简单。但随着业务系统增长，文件方案会逐渐暴露出几个问题：

- 每个程序都要自己处理读写、解析、校验与并发；
- 查找某一条记录往往需要自己编写扫描逻辑；
- 多份文件之间的关系缺少统一约束；
- 多个程序同时修改数据时更容易发生冲突；
- 数据结构、权限、恢复和一致性都需要重复实现。

数据库的价值就在于把“怎样可靠地保存和管理数据”交给专门的数据库系统。

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

应用负责业务逻辑，数据库负责组织、保存、查询和约束数据。SQL 则成为应用与关系数据库之间最重要的通用语言之一。

## 数据不只有一种组织模型

数据库发展过程中出现过多种数据模型。理解它们的区别，有助于看清关系模型为什么成为主流。

### 层次模型 Hierarchical Model

层次模型把记录组织成树形的父子结构。一条路径从上级节点逐层走向下级节点。

这种结构适合天然具有严格层级的数据，但当一个对象同时需要属于多个上级关系时，结构会变得不灵活。

### 网状模型 Network Model

网状模型允许一个节点连接多个其他节点，可以表达更复杂的关系。

它比树形结构灵活，但访问数据往往需要理解具体连接路径，应用与物理关系结构的耦合更强。

### 关系模型 Relational Model

关系模型把不同实体表示为结构化的二维表，再通过键建立表与表之间的关系。

```text
customers
orders
products
order_items
```

每张表保持固定的字段定义，而记录以行的形式不断增加。后续查询不需要沿某一条固定路径“走图”，而可以通过 SQL 描述需要什么结果。

<div data-learning-slot="relational-model-explorer"></div>

## 关系数据库为什么不是一个“大表”？

真实业务通常同时存在客户、订单、产品、仓库、运输和服务事件等不同对象。

如果把所有信息都放在一张超宽表里，会出现大量重复：

```text
订单 50001
→ North Retail
→ north@example.com
→ Retail

订单 50002
→ North Retail
→ north@example.com
→ Retail
```

客户名称、邮箱和 segment 会随着每一张订单重复保存。

关系数据库更常见的做法是让不同表承担不同职责：

```text
customers
→ 保存客户本身

orders
→ 保存订单本身，并保留 customer_id

products
→ 保存产品本身

order_items
→ 保存某个产品出现在某张订单中的关系
```

这让业务实体、记录粒度和后续约束都更清晰。

## 整个 SQL 系列使用同一份业务数据

为了避免每一篇笔记重新编造一套数字，SQL 01–20 使用同一个 synthetic Business Analytics 数据宇宙。

当前基础数据包括：

```text
customers
orders
products
order_items
customer_profiles
```

其中：

```text
customers.customer_id = 1001 / 1002 / 1003
orders.order_id       = 50001 / 50002 / 50003 / 50004
products.product_id   = 301 / 305
```

后续主键、外键、关系、SELECT、WHERE、JOIN 与聚合查询都围绕这些记录展开。

<div data-learning-slot="sql-dataset-explorer"></div>

## 一行到底代表什么？

关系表最重要的阅读习惯之一，是先确认 **记录粒度（observation granularity）**。

客户表：

| customer_id | customer_name | email | segment |
|---:|---|---|---|
| 1001 | North Retail | north@example.com | Retail |
| 1002 | Coast Foods | coast@example.com | Wholesale |
| 1003 | Alpine Labs | alpine@example.com | Enterprise |

它的粒度是：

> **One row = one customer**

订单表：

| order_id | customer_id | order_date | order_value |
|---:|---:|---|---:|
| 50001 | 1001 | 2026-07-03 | 420.00 |
| 50002 | 1001 | 2026-07-05 | 185.00 |
| 50003 | 1002 | 2026-07-06 | 760.00 |
| 50004 | 1003 | 2026-07-09 | 510.00 |

它的粒度是：

> **One row = one order**

两张表都出现 `customer_id`，但一行代表的业务对象完全不同。

后续筛选、聚合和 JOIN 是否正确，很大程度上取决于粒度是否先被确认。

## Record、Row、Column 与 Field 怎样对应？

关系表可以从两个方向理解。

### 行：Record / Row

一行是一条具体记录。

```text
customers 的一行
→ 一个具体客户

orders 的一行
→ 一张具体订单
```

### 列：Column / Field

一列描述同一种属性。

客户表可能包含：

```text
customer_id
customer_name
email
phone
segment
```

订单表可能包含：

```text
order_id
customer_id
order_date
order_value
```

同一张表中的所有记录共享同一组字段定义，这就是关系表能够稳定查询和约束的基础。

## 数据类型不是装饰，而是字段语义的一部分

数据库不仅要知道字段叫什么，还需要知道它允许保存什么类型的值。

常见关系数据库通常提供下面这些类型家族：

| 类型家族 | 常见声明 | 适合表达 |
|---|---|---|
| 整数 | `INT`, `INTEGER`, `BIGINT` | ID、数量、计数 |
| 精确小数 | `DECIMAL(p,s)`, `NUMERIC(p,s)` | 金额、精确比例 |
| 浮点数 | `REAL`, `FLOAT`, `DOUBLE` | 允许近似表示的连续数值 |
| 定长文本 | `CHAR(n)` | 固定长度编码 |
| 变长文本 | `VARCHAR(n)`, `TEXT` | 名称、描述、标签 |
| 布尔 | `BOOLEAN` | true / false 状态 |
| 日期时间 | `DATE`, `TIME`, `DATETIME`, `TIMESTAMP` | 业务日期与时间 |
| 半结构化数据 | `JSON` | 某些数据库中的 JSON 文档 |

具体类型名称、范围和存储方式会随数据库系统变化，因此不能把某一个数据库的实现细节直接当作所有 SQL 数据库的统一规则。

例如 MySQL 的有符号 `INT` 上限是 `2,147,483,647`，有符号 `BIGINT` 上限是 `9,223,372,036,854,775,807`；SQLite 则采用动态类型和 type affinity，`INTEGER`、`REAL`、`TEXT`、`BLOB`、`NULL` 等 storage class 的行为与 MySQL 并不完全相同。

### 金额为什么更适合精确类型？

财务或交易金额通常不应默认使用二进制浮点数作为长期精确值。

在支持固定精度小数的数据库中，更典型的设计是：

```sql
order_value DECIMAL(12, 2)
```

而本系列的浏览器实验使用 SQLite/sql.js。SQLite 没有与 MySQL `DECIMAL(12,2)` 完全相同的固定精度存储语义，因此实验表使用 `NUMERIC` affinity 来保持 SQL 结构可读；生产财务系统仍应根据实际数据库选择精确小数或整数最小货币单位等方案。

## NULL 到底表示什么？

`NULL` 表示字段值不存在、未知或当前不适用。

它不等于：

```text
0
```

也不等于：

```text
''
```

空字符串仍然是一个字符串值，数字 0 仍然是一个确定的数值，而 `NULL` 表示没有可用值。

例如：

| customer_id | customer_name | phone |
|---:|---|---|
| 1001 | North Retail | 021-440-810 |
| 1002 | Coast Foods | 021-440-811 |
| 1003 | Alpine Labs | 021-440-812 |

如果某个客户电话未知，可以是 `NULL`；但如果业务规则规定所有客户都必须有名称，那么：

```sql
customer_name TEXT NOT NULL
```

更能准确表达规则。

`NOT NULL` 不应该机械地加在所有字段上。更合理的判断是：**这个字段在业务上是否必须始终存在？**

## Schema 和 Data 是两件事

关系数据库可以分成两个层次理解。

### Schema：结构规则

Schema 描述表怎样定义：

```text
customers
├── customer_id
├── customer_name
├── email
├── phone
└── segment
```

还包括：

```text
数据类型
PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
其他约束
```

### Data：实际记录

Data 是表当前保存的值：

```text
1001 | North Retail | north@example.com | 021-440-810 | Retail
1002 | Coast Foods  | coast@example.com | 021-440-811 | Wholesale
```

记录可以每天增加、修改或删除，但不会因为新增一行就重新设计整张表的 schema。

## 为什么同一个信息不应该到处重复？

假设客户名称直接重复写入订单：

| order_id | customer_name | order_value |
|---:|---|---:|
| 50001 | North Retail | 420.00 |
| 50002 | North Retail | 185.00 |
| 50003 | Coast Foods | 760.00 |

如果 `North Retail` 更名，历史订单中的客户名称就可能需要一起更新。

更稳定的结构是：

```text
customers
1001 | North Retail

orders
50001 | 1001
50002 | 1001
```

订单只保存客户 ID，客户资料由客户表负责。

这种拆分思想会继续延伸到后面的主键、外键、关系基数和 JOIN。

## SQL 是什么？

SQL 是 Structured Query Language，用来操作关系数据库。

它不仅能“查询”，还覆盖结构定义、数据修改和数据库控制中的大量操作。

学习 SQL 时，可以先把常见操作分成三个核心类别。

### DDL — Data Definition Language

DDL 负责定义数据结构，例如：

```sql
CREATE TABLE
ALTER TABLE
DROP TABLE
```

它关注的是 schema。

### DML — Data Manipulation Language

DML 负责修改表中的记录，例如：

```sql
INSERT
UPDATE
DELETE
```

它关注的是 data 的写入和变化。

### DQL — Data Query Language

DQL 负责读取数据，最核心的语句是：

```sql
SELECT
```

后续 SQL 05 开始会进入完整的查询路径。

## 标准 SQL 和数据库方言不要混淆

SQL 有标准化的核心语法，但不同数据库系统会提供自己的扩展和实现细节。

例如：

```text
MySQL
→ AUTO_INCREMENT

PostgreSQL
→ identity / sequence / rich NUMERIC semantics

SQLite
→ dynamic typing / type affinity / PRAGMA
```

因此，本系列会遵循两条规则：

1. 能使用通用 SQL 概念时，优先讲通用概念；
2. 使用数据库特定语法时，明确标注数据库名称。

浏览器互动实验统一使用 SQLite/sql.js，所以某些 MySQL 语法不会直接在实验框中运行。

## SQL 关键字为什么统一大写？

SQL 关键字通常可以写成：

```sql
select * from customers;
```

也可以写成：

```sql
SELECT * FROM customers;
```

本系列统一采用第二种形式：

```text
SELECT
FROM
WHERE
GROUP BY
ORDER BY
JOIN
```

目的不是改变执行结果，而是让 SQL 结构更容易扫描。

需要注意的是，**关键字大小写规则和表名/列名大小写规则不是同一件事**。对象名称是否区分大小写会受到数据库、操作系统和引用方式影响，因此实际项目应遵循所用数据库和团队的命名规范。

## 常见关系数据库有哪些？

关系模型并不等于某一个数据库产品。

常见系统包括：

| 类型 | 代表系统 | 典型特点 |
|---|---|---|
| 商用关系数据库 | Oracle, SQL Server, IBM Db2 | 企业级功能与商业支持 |
| 开源服务端数据库 | PostgreSQL, MySQL | Web、分析与业务系统广泛使用 |
| 桌面数据库 | Microsoft Access | 桌面端、小规模业务应用 |
| 嵌入式数据库 | SQLite | 应用内嵌、移动端、桌面端、浏览器教学环境 |

这一系列不要求把所有数据库都学一遍。真正需要建立的是关系模型与 SQL 核心概念，再理解不同数据库的方言差异。

## 建表前可以先问这几个问题

面对一份新的业务数据，可以先检查：

1. **为什么需要把这组数据放进数据库，而不是孤立文件？**
2. **这张表保存的业务对象是什么？**
3. **一行代表什么？**
4. **哪些列是这个对象的属性？**
5. **每个字段应该使用什么数据类型？**
6. **哪些字段必须有值，哪些可以为 NULL？**
7. **哪些信息应该放在另一张表，而不是重复保存？**
8. **这张表以后需要与哪些表建立关系？**
9. **示例语法属于通用 SQL，还是某个数据库的方言？**

这些问题解决以后，后续主键、外键和查询语法才有稳定的结构基础。

## 关系模型接下来还缺什么？

关系表已经能够保存不同业务实体，但还没有回答：

> **数据库怎样稳定地确认“这一行到底是谁”？**

客户名称、邮箱和电话号码都可能变化，也可能发生重复。

因此，下一篇 SQL 02 将进入：

```text
Primary Key
```

主键解决记录身份；SQL 03 再用外键解决记录之间的引用关系。
