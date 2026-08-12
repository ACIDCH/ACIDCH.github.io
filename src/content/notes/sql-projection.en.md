---
translationKey: sql-projection
locale: en
slug: sql-projection
title: Column Selection and Expressions
summary: A query rarely needs to return an entire table unchanged. This note starts with selecting specific columns, then adds aliases and calculated expressions to shape a result that is useful for analysis and reporting.
tags:
  - Projection
  - SELECT
  - column alias
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
order: 7
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-where
  - sql-order-by
---

## From filtering rows to selecting columns

WHERE determines which rows to keep. The next thing to solve is another thing: which columns are needed in the result.

For example, the customer table has:

```text
customer_id
customer_name
email
phone
segment
```

If the report only requires the customer ID, name, and segment, there is no need to return the email address and phone number together.

```sql
SELECT
  customer_id,
  customer_name,
  segment
FROM customers;
```

This is projection in SQL: controlling the column structure of the result set.

<div data-learning-slot="projection-columns-lab"></div>

## Projection controls the columns in a result set

The original table has the 5 column, which does not mean that every query must return the 5 column.

The following query:

```sql
SELECT
  order_id,
  order_value
FROM orders;
```

Only returns:

| order_id | order_value |
| -------: | ----------: |
|    50001 |      420.00 |
|    50002 |      185.00 |
|    50003 |      760.00 |
|    50004 |      510.00 |

The orders table itself has not been modified, except that this query selects two columns.

Projection means: **select from the source table only the fields needed for the current task.**

## Omitting a column does not delete it

The following query does not contain `email`:

```sql
SELECT
  customer_id,
  customer_name
FROM customers;
```

But `email` remains in the original table.

This is the difference between reading and modifying. SELECT only defines the result set and does not delete unselected columns from the database structure.

Really deleting a field is a DDL operation and requires something like `ALTER TABLE`. The risks and semantics are completely different.

## The SELECT list determines result-column order

The order of fields in the original table is not important, as long as the query clearly states the required order:

```sql
SELECT
  segment,
  customer_name,
  customer_id
FROM customers;
```

The result will be:

```text
segment
customer_name
customer_id
```

return.

This is useful when exporting files, APIs or reports, as the output structure can be different from the original table.

However, long-term interfaces are better off treating column ordering as an explicit contract, rather than relying on whatever `SELECT *` happens to currently return.

## A column alias changes the result-field name

Database field names may not be suitable for direct display.

For example:

```sql
SELECT
  customer_id AS customer_key,
  customer_name AS name
FROM customers;
```

The resulting column names will become:

```text
customer_key
name
```

The column names in the original table are still `customer_id` and `customer_name`.

Alias ​​only changes the display name or reference name in the result set this time, and does not rename the database field.

Aliases are especially important for calculated columns, otherwise the result may be an unreadable expression as the column name.

## Combining projection with WHERE

Selecting columns and filtering rows are two separate things, so they can be used together:

```sql
SELECT
  order_id,
  order_value
FROM orders
WHERE order_value >= 500;
```

The results only retain orders with an amount of at least 500 and only display two columns.

The logic can be divided into:

```text
WHERE
→ 哪些行留下

SELECT
→ 留下的行要显示哪些列
```

Although SQL is written with SELECT first, it is not necessary to treat all statements as one-time processing from left to right when understanding the query.

## Expressions can also form result columns

The SELECT list can not only write original fields, but also calculations.

For example, suppose you need to look at an 10% upscaling scenario:

```sql
SELECT
  order_id,
  order_value,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders;
```

`scenario_value` is not stored in the `orders` table, but is calculated at query time.

This type of computed column is suitable for:

- ratio;
- Amount conversion;
- situational value;
- date difference;
- text splicing;
- CASE classification.

SQL queries can therefore undertake some lightweight data shaping without having to modify the source table first each time.

## Give expressions clear aliases

Although the following will work:

```sql
SELECT order_value * 1.10
FROM orders;
```

But the resulting column names are not suitable for long-term use.

A better way to write it:

```sql
SELECT
  order_value * 1.10 AS scenario_value
FROM orders;
```

A good alias should say what the result is, rather than repeating the formula itself.

Stable, clear aliases also reduce downstream changes if subsequent BI tools or code reference this field.

## The same field can appear multiple times in the results

For example, display the original amount and the converted amount at the same time:

```sql
SELECT
  order_value AS base_value,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders;
```

Both columns come from the same original field, but have different business meanings.

Projection is not about using each source field only once; it is about organising the result structure required by the analysis.

## Why SELECT asterisk is a poor long-term interface

`SELECT *` is very convenient during the exploration phase, but long-term use can cause several problems.

### The output will change according to the table structure

After a new column is added to the database, `SELECT *` will automatically return one more column. Downstream programs that assume a fixed schema may suddenly go wrong.

### Transfer unwanted data

Only 3 columns are needed in the wide table, but retrieving all 50 columns will increase I/O and network transmission.

### Permissions and privacy are harder to control

If the table later adds sensitive fields, the old `SELECT *` query may bring out the new fields without noticing.

So formal inquiries are better suited to explicit lists.

## Projection does not control ordering

Even if the SELECT list is written:

```sql
SELECT
  order_value,
  order_id
FROM orders;
```

Just changing the column order does not mean that the order records will be sorted by `order_value`.

Arrangement of rows requires `ORDER BY`:

```sql
ORDER BY order_value DESC
```

To separate the two "sequences":

```text
SELECT 列表顺序
→ 决定列怎么排

ORDER BY
→ 决定行怎么排
```

These two conceptual names are related to order, but control completely different directions.

## DISTINCT affects results, but is more than column selection

Query:

```sql
SELECT DISTINCT segment
FROM customers;
```

Only distinct segment values ​​are returned.

Here SELECT first selects `segment`, `DISTINCT` and then removes duplicate rows.

Therefore, `DISTINCT` will change the number of rows, not just the columns. When using it, you should clearly understand why it is needed, rather than just adding it habitually when you see it being repeated.

If the duplicates come from a one-to-many JOIN, a direct DISTINCT may just mask the granularity issue.

## Design the result structure for its next use

The same table can return completely different projections for different purposes.

Reports may require:

```text
order_id
order_date
order_value
```

Machine learning feature tables may require:

```text
customer_id
segment
scenario_value
```

The API may only require:

```text
customer_key
name
```

SQL does not need to expose the physical structure of the database to every user as is. Query results can be reorganized according to tasks.

## Common questions when writing a SELECT list

- Misspelled column name;
- There is no table alias added to the field with the same name after JOIN between the two tables;
- Computed expressions have no alias;
- Mistaking column order for row order;
- Use `SELECT *` as the long-term interface;
- Use DISTINCT to mask duplicate problems that should be checked.

## A practical result-structure checklist

1. First confirm which fields are actually required for the current task;
2. Explicitly write column names in SELECT;
3. Add clear aliases to calculated columns and unintuitive fields;
4. WHERE is responsible for row filtering, do not confuse it;
5. Use ORDER BY alone when sorting is required;
6. When you see duplicates, check the granularity before deciding whether to use DISTINCT;
7. Long-lived interfaces avoid dependencies on `SELECT *`.

Projection reshapes "what the database stores" into "what the current task needs". The next note turns to result order: once the columns are selected, how should the rows be arranged under clear, repeatable rules?
