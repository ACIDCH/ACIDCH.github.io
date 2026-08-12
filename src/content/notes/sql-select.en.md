---
translationKey: sql-select
locale: en
slug: sql-select
title: SELECT Queries
summary: Once the table structure is clear, the next step is to read its data. Starting with the simplest SELECT and FROM statements, this note explains result sets, the asterisk wildcard and read-only queries.
tags:
  - SELECT
  - Basic query
  - result set
  - SQL query
topics:
  - Data query
  - Data understanding
  - SQL Basics
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
seriesSlug: sql
order: 5
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-relationships
  - sql-where
---

## From organising data to reading data

The previous notes focused on table structure: what a row represents, how to choose a primary key, how foreign keys connect records and how tables relate to one another. The next step is to query the database directly.

The simplest query is:

```sql
SELECT *
FROM customers;
```

Its meaning is very straightforward: read all current columns and all records from the `customers` table.

## Reading SELECT * FROM customers

Take this statement apart:

```text
SELECT
→ 说明要读取什么

*
→ 当前选择所有列

FROM
→ 说明数据从哪里来

customers
→ 数据来源表
```

The customer table now has three records:

| customer_id | customer_name | email              | phone       | segment    |
| ----------: | ------------- | ------------------ | ----------- | ---------- |
|        1001 | North Retail  | north@example.com  | 021-440-810 | Retail     |
|        1002 | Coast Foods   | coast@example.com  | 021-440-811 | Wholesale  |
|        1003 | Alpine Labs   | alpine@example.com | 021-440-812 | Enterprise |

So this query will return 3 rows and 5 columns.

The basic reading order is simple: **SELECT decides what to read, and FROM decides where to get it.**

## What the asterisk * means

`*` represents all columns of the current data source.

For `customers` this is:

```text
customer_id
customer_name
email
phone
segment
```

`SELECT *` is handy when exploring data because you can quickly see what a table looks like first.

However, formal analysis or long-term interfaces are usually more appropriate to explicitly write out the required columns. The reason is not that the asterisk "cannot be used", but that when new fields are added to the table in the future, the output structure of `SELECT *` will also change accordingly.

Column selection is expanded specifically in SQL 07.

## What happens without WHERE

For example:

```sql
SELECT *
FROM orders;
```

There are no filter conditions, so all records in the current order table are returned:

| order_id | customer_id | order_date | order_value |
| -------: | ----------: | ---------- | ----------: |
|    50001 |        1001 | 2026-07-03 |      420.00 |
|    50002 |        1001 | 2026-07-05 |      185.00 |
|    50003 |        1002 | 2026-07-06 |      760.00 |
|    50004 |        1003 | 2026-07-09 |      510.00 |

The point is not to memorise the "4 rows" result, but to understand that **SELECT itself does not filter rows.** If the question concerns only certain orders, add WHERE.

## A query result is also a two-dimensional table

After the database executes SELECT, it returns a result set.

It still looks like a table: there are column names and rows of records. But this result set is not equal to the original table itself.

For example:

```sql
SELECT *
FROM customers;
```

What is obtained is the result of a query of the current status of `customers`. The program, report, or analysis tool can continue to use the results, but the query does not create a permanent new table.

Even if you do filtering, sorting, and calculating columns later, you will still get the query results instead of automatically modifying the original data.

## Does SELECT modify the source table?

A normal SELECT is a read operation.

```sql
SELECT * FROM orders;
```

The order will not be deleted and the amount will not be changed.

What actually modifies the data is:

```sql
INSERT
UPDATE
DELETE
```

This distinction is important. When learning SQL, you can boldly try SELECT, WHERE and ORDER BY on read-only data; once you enter UPDATE or DELETE, you need to confirm the conditions more strictly.

## SELECT does not always require FROM

Some databases allow SELECT to evaluate expressions directly:

```sql
SELECT 1;
```

or:

```sql
SELECT 2 + 3 AS result;
```

SQLite can be run directly:

```sql
SELECT 1 AS execution_ok;
```

The result is one row and one column:

```text
execution_ok
1
```

This type of query does not read the business table, but just asks the database to calculate an expression.

### Is SELECT 1 a "connection check"?

`SELECT 1` itself is just a very lightweight query.

In application systems, it is often used for database connection or health check, because if the database connection is normal, executing this statement is usually very fast. But it has no special "check connection" syntax meaning.

So a more accurate understanding is: the application uses a very simple SELECT to confirm whether the database can respond normally.

## SELECT can return expressions as well as source fields

Even without going into full Projection for now, you can see a basic capability of SELECT: the result column can come from a calculation.

```sql
SELECT
  order_id,
  order_value,
  order_value * 1.10 AS scenario_value
FROM orders;
```

`scenario_value` does not need to be stored in the order table in advance, it can be calculated at query time.

The result set of SQL is therefore not just a "copy of the original table", but the data can be reorganized as needed.

## When SELECT * is appropriate

More suitable for:

- Looking at a small table for the first time;
- debug and explore;
- Temporarily verify whether the data is loaded successfully;
- The entire table structure is quickly demonstrated in the teaching example.

Not very suitable for:

- Long-term production interface;
- Only two or three columns are needed but the entire wide table is returned;
- Code that has a strict dependence on column order;
- Reports that require stable schema.

Long-term queries are often written more clearly by explicitly naming the columns:

```sql
SELECT
  customer_id,
  customer_name,
  segment
FROM customers;
```

## Start a SQL query with the smallest question

When you first start writing queries, you don't have to cram in WHERE, JOIN, GROUP BY, and ORDER BY all at once.

The easier to debug sequence is:

```text
先确认 FROM 的表对不对
↓
再确认 SELECT 的列对不对
↓
再加 WHERE
↓
再加排序、聚合或连接
```

If the final query result is incorrect, you can go back layer by layer and quickly find out which step changed the result.

<div data-learning-slot="sql-playground"></div>

## Common beginner mistakes

### Wrong table name

```sql
SELECT * FROM customer;
```

If the actual table is called `customers`, the database will directly report an error.

### Treat string as field name

```sql
SELECT "customer_name";
```

Different databases have different semantics for double quotes. When you want to read a field, the safest thing is to write the correct column name directly; if you want to write a string constant, use single quotes.

### Thought SELECT * would automatically sort

Without `ORDER BY`, the database does not commit to return order. The row order currently seen cannot be regarded as a permanent rule.

### Treat the result set as a permanent table

SELECT returns the results of a query. To actually create a table or view, additional DDL is required.

## Keep the basic query skeleton in mind

The most basic structure is only:

```sql
SELECT ...
FROM ...;
```

It answers two questions: what data is needed and where to get it.

The next note adds WHERE to control **which rows** enter the result. The orders table can then be filtered precisely by value, customer, date or other conditions instead of simply being read in full.
