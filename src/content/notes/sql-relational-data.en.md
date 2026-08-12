---
translationKey: sql-relational-data
locale: en
slug: sql-relational-data
title: SQL and Relational Data
summary: SQL starts with understanding how data is organised. Using customer, order and product data, this note explains tables, rows, columns, grain, NULL and schemas, then connects them into the core structure of a relational database.
tags:
  - relational model
  - Data Tables
  - Record granularity
  - "NULL"
topics:
  - Data management
  - Data Modelling
  - Data understanding
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
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

## Why use a database?

When the amount of data is small, a CSV or Excel can solve many problems. The customer list can be a table, and the orders can also be placed in another workbook.

For example:

```text
customer_id,customer_name,segment
1001,North Retail,Retail
1002,Coast Foods,Wholesale
1003,Alpine Labs,Enterprise
```

Problems usually arise after the data begins to be used by multiple people and programs over a long period of time. There is a lack of unified constraints between files, updates are prone to conflicts, and relationships can only be remembered manually. If a customer changes their name, the order file may not be synchronized; if an order references a customer that does not exist, CSV itself will not prevent it.

A database manages these concerns centrally: how data is stored and queried, which fields are required, and which references between tables are valid.

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

The application is responsible for business logic, and the database is responsible for long-term storage and management of data. SQL is one of the most common languages ​​for operating relational databases.

## Data can be organised in more than one model

Relational databases are common, but they are not the only way to organise data. Earlier models help clarify the problems that the relational model solves.

### Hierarchical Model Hierarchical Model

A hierarchical model is like a tree, with a node usually unfolding downward along a fixed parent-child relationship.

It works well for strict hierarchies, such as organisational trees or directories. When an object must relate to several parents at once, however, the tree structure becomes awkward.

### Network Model Network Model

The mesh model allows more connections between nodes and is more flexible than a pure tree structure.

The trade-off is that accessing data often requires understanding the specific connection path. The physical connection between the application and the data is relatively tight. Once the structure is changed, the access logic is easy to change.

### Relational Model Relational Model

The relational model splits different business entities into two-dimensional tables, and then uses keys to connect the tables.

```text
customers
orders
products
order_items
```

When querying, you do not need to search node by node along a fixed path, but describe "what results are needed." This is why SQL is particularly suitable for relational models.

<div data-learning-slot="relational-model-explorer"></div>

## Why a relational database is not one big table

Stuffing customers, orders, and products into one wide table may seem like a hassle-free process, but in fact it’s easy to repeat.

For example, the same customer has two orders:

```text
50001 | North Retail | north@example.com | Retail | 420
50002 | North Retail | north@example.com | Retail | 185
```

The customer name, email address and segment are saved twice. The more orders there are, the more repetitions there are.

The more common relational designs are:

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

In this way, each table is only responsible for one main business object, and updates and constraints are clearer.

## One business dataset runs through the SQL series

Subsequent notes will use the same set of sample data, and a new batch of IDs will not be changed for each article.

Core tables include:

```text
customers
orders
products
order_items
customer_profiles
```

Key records:

```text
customers.customer_id = 1001 / 1002 / 1003
orders.order_id       = 50001 / 50002 / 50003 / 50004
products.product_id   = 301 / 305
```

In this way, primary keys, foreign keys, SELECT, WHERE, ORDER BY and paging can all continue to move forward on the same batch of data.

<div data-learning-slot="sql-dataset-explorer"></div>

## What exactly does one row represent?

Before reading a table, it is more important to confirm what a row represents than to look at the column names first. This is record granularity.

Customer table:

| customer_id | customer_name | email              | segment    |
| ----------: | ------------- | ------------------ | ---------- |
|        1001 | North Retail  | north@example.com  | Retail     |
|        1002 | Coast Foods   | coast@example.com  | Wholesale  |
|        1003 | Alpine Labs   | alpine@example.com | Enterprise |

here:

> **One row = one customer**

Orders table:

| order_id | customer_id | order_date | order_value |
| -------: | ----------: | ---------- | ----------: |
|    50001 |        1001 | 2026-07-03 |      420.00 |
|    50002 |        1001 | 2026-07-05 |      185.00 |
|    50003 |        1002 | 2026-07-06 |      760.00 |
|    50004 |        1003 | 2026-07-09 |      510.00 |

here:

> **One row = one order**

`customer_id` appears in both tables, but the rows have completely different meanings. When doing JOIN or aggregation later, many "duplication" problems actually come from not seeing the granularity first.

## How record, row, column and field relate

A row is usually called a record or row and represents a specific record.

A column is called column, also often called field, which represents the same attribute.

For example, in the customer table:

```text
customer_id
customer_name
email
phone
segment
```

Each field has its own meaning and data type, while all customer records share the same set of column structures.

## Data types are part of a field's meaning

A field not only has a name, but also describes what type of value it can hold.

| type family           | Common Statements               | suitable for expression                  |
| --------------------- | ------------------------------- | ---------------------------------------- |
| integer               | `INT`, `INTEGER`, `BIGINT`      | ID, quantity, count                      |
| Exact decimal         | `DECIMAL(p,s)`, `NUMERIC(p,s)`  | Amount, precise ratio                    |
| floating point number | `REAL`, `FLOAT`, `DOUBLE`       | Allows for approximate continuous values |
| text                  | `VARCHAR(n)`, `TEXT`            | name, description, label                 |
| Boolean               | `BOOLEAN`                       | true / false status                      |
| date time             | `DATE`, `DATETIME`, `TIMESTAMP` | date and time                            |
| semi-structured data  | `JSON`                          | JSON document                            |

The type semantics of different databases are not exactly the same. MySQL, PostgreSQL, and SQLite all have their own implementation details for numbers, dates, and auto-incrementing primary keys.

The amount needs to be especially cautious. Databases that support fixed-precision decimals will typically use something like:

```sql
order_value DECIMAL(12, 2)
```

The current browser experiment runs on SQLite/sql.js, and the examples use `NUMERIC` affinity. SQLite's NUMERIC affinity is not equal to MySQL's fixed precision `DECIMAL(12,2)`. The amount design in production should still choose the precise solution according to the specific database.

## What NULL means

`NULL` indicates that the value is unknown, missing, or not currently applicable.

It is not:

```text
0
```

Nor:

```text
''
```

0 is a certain value, and the empty string is also a certain string; `NULL` means that there is no available value.

If the customer's phone number is unknown, `NULL` can be used. If the customer name must exist for business purposes, you can write:

```sql
customer_name TEXT NOT NULL
```

The judgment standard for `NOT NULL` should be whether the business allows missing fields, rather than mechanically adding all fields.

## Schema and data are different things

### Schema: structural rules

Schema describes what columns a table has, what data types it has, and what constraints it has.

```text
customers
├── customer_id
├── customer_name
├── email
├── phone
└── segment
```

May also include:

```text
PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
```

### Data: actual record

Data is the currently stored value:

```text
1001 | North Retail | north@example.com | 021-440-810 | Retail
1002 | Coast Foods  | coast@example.com | 021-440-811 | Wholesale
```

Records can be continuously added or updated, but this does not mean that the table structure must be redesigned every time.

## Why the same fact should not be repeated everywhere

If the order table saves the customer name directly:

| order_id | customer_name | order_value |
| -------: | ------------- | ----------: |
|    50001 | North Retail  |      420.00 |
|    50002 | North Retail  |      185.00 |

After the customer's name is changed, both historical orders may need to be modified simultaneously.

If the order is only saved:

```text
customer_id = 1001
```

The customer name is only maintained once in the `customers` table, and the structure is more stable.

The subsequent primary keys, foreign keys and table relationships continue to solve the problem of "how to make this split work reliably".

## What SQL is

SQL is Structured Query Language. It is not only used to read data, but can also define structures and modify records.

### DDL — Data Definition Language

DDL mainly deals with structures such as:

```sql
CREATE TABLE
ALTER TABLE
DROP TABLE
```

### DML — Data Manipulation Language

DML mainly handles recording changes:

```sql
INSERT
UPDATE
DELETE
```

### DQL — Data Query Language

DQL focuses on queries. The core statements are:

```sql
SELECT
```

The subsequent SQL 05 will officially enter the query.

## Do not confuse standard SQL with database dialects

SQL has a common core syntax, but each database has its own extensions.

For example:

```text
MySQL
→ AUTO_INCREMENT

PostgreSQL
→ identity / sequence

SQLite
→ type affinity / PRAGMA
```

Therefore, when you see a certain piece of SQL, it is best to distinguish whether it is a standard concept or a writing method unique to a certain database.

Currently, interactive experiments uniformly use SQLite/sql.js. When encountering MySQL or PostgreSQL-specific syntax, it will be explained separately instead of pretending that all databases are completely consistent.

## Why SQL keywords are commonly capitalised

The following two ways of writing usually work:

```sql
select * from customers;
```

```sql
SELECT * FROM customers;
```

Writing SQL keywords in uppercase is mainly a readability habit, which can quickly distinguish syntax from table names and field names, and is not a grammatical requirement.

It’s the team style that really needs to be consistent, not the capitalization itself.

## Common relational database systems

Common relational databases include:

```text
PostgreSQL
MySQL
Microsoft SQL Server
Oracle Database
SQLite
```

They are both built on the relational model and SQL, but have different orientations. SQLite is suitable for embedded and local lightweight scenarios; PostgreSQL, MySQL, SQL Server, etc. are more common in server-side systems.

When learning SQL, it is more important to have a clear grasp of the relational model, keys, queries, and data granularity than to memorize all the database dialects at the beginning.

## The concepts to carry forward

The basics of relational databases can be condensed into a few things:

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

The next step is the primary key. Once a database represents business objects as rows, it needs a stable way to answer: **which object does this row represent?**
