---
translationKey: sql-where
locale: en
slug: sql-where
title: Filtering with WHERE
summary: SELECT determines which fields to return; WHERE determines which records qualify. Using order values and customer segments, this note covers comparisons, AND, OR, BETWEEN, IN, LIKE and NULL conditions.
tags:
  - WHERE
  - Conditional filtering
  - SQL query
  - Boolean logic
topics:
  - Data query
  - Data understanding
  - SQL Basics
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
seriesSlug: sql
order: 6
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-select
  - sql-projection
---

## WHERE controls the rows in a result set

`SELECT * FROM orders` will read out all current orders. If you only care about orders with an amount of at least 500, you need to add conditions after the query:

```sql
SELECT *
FROM orders
WHERE order_value >= 500;
```

The current data will remain:

```text
50003 | 760
50004 | 510
```

WHERE has one central role: **it determines which records enter the result set.**

<div data-learning-slot="where-filter-lab"></div>

## Comparison operators form the basis of conditions

The most common comparisons include:

```text
=    等于
<>   不等于
>    大于
>=   大于等于
<    小于
<=   小于等于
```

For example:

```sql
SELECT *
FROM orders
WHERE customer_id = 1001;
```

Returns two orders for customer 1001.

Another example:

```sql
SELECT *
FROM orders
WHERE order_value < 500;
```

Two orders, 420 and 185, will be returned.

After the conditions are written correctly, SQL will judge whether each row is true or false, and only keep records that meet the conditions.

## AND: all conditions must be true

If you require an amount of at least 400 and the customer is 1001:

```sql
SELECT *
FROM orders
WHERE order_value >= 400
  AND customer_id = 1001;
```

Only orders that meet both conditions will be retained.

AND can be understood as the intersection of sets:

```text
条件 A 成立
并且
条件 B 也成立
```

The more conditions there are, the narrower the result is usually.

## OR: at least one condition must be true

If you need Retail or Enterprise customers:

```sql
SELECT *
FROM customers
WHERE segment = 'Retail'
   OR segment = 'Enterprise';
```

If any condition here is true, the record will be left.

OR often widens the result, so pay special attention to parentheses and logical precedence when multiple ORs are mixed together.

## NOT: negate a condition

If you want to exclude Retail:

```sql
SELECT *
FROM customers
WHERE NOT segment = 'Retail';
```

It can also be written as:

```sql
WHERE segment <> 'Retail'
```

For complex conditions, the value of NOT is more obvious:

```sql
WHERE NOT (order_value BETWEEN 400 AND 600)
```

Indicates that orders not within this range are retained.

## NOT, AND and OR have precedence rules

The following query can easily be misread:

```sql
WHERE segment = 'Retail'
   OR segment = 'Enterprise'
  AND customer_id > 1001
```

SQL usually evaluates `NOT` first, then `AND`, and finally `OR`. So the actual logic is not simply left to right.

A safer way to write it is to add parentheses proactively:

```sql
WHERE (segment = 'Retail' OR segment = 'Enterprise')
  AND customer_id > 1001;
```

Whenever both AND and OR appear in a condition, it's worth making the grouping clear. In this way, not only the database is clearer, but people do not need to guess when reading it.

## BETWEEN: express a closed interval directly

To filter orders between 400 and 600, you can write:

```sql
SELECT *
FROM orders
WHERE order_value BETWEEN 400 AND 600;
```

This is equivalent to:

```sql
WHERE order_value >= 400
  AND order_value <= 600
```

So `BETWEEN 400 AND 600` includes both ends.

The current data will be returned:

```text
50001 | 420
50004 | 510
```

Whether the interval boundary is included often affects the number of results, so it is best not to rely on intuition.

## IN: match one of several discrete values

If you need multiple segments, instead of writing many ORs in a row:

```sql
WHERE segment = 'Retail'
   OR segment = 'Enterprise'
```

You can write directly:

```sql
WHERE segment IN ('Retail', 'Enterprise');
```

`IN` is good for a clear set of discrete values, especially when filtering on product ID, region, status, or category.

Reverse exclusion can be used:

```sql
WHERE segment NOT IN ('Retail', 'Enterprise');
```

However, as long as the field may appear NULL, you must remember that three-value logic will affect the result of `NOT IN`, and it cannot be simply regarded as "inverse selection" in all scenarios.

## LIKE: filter by a text pattern

Commonly used for text filtering is `LIKE`.

For example, the customer name starts with `North`:

```sql
SELECT *
FROM customers
WHERE customer_name LIKE 'North%';
```

`%` represents a sequence of characters of any length.

Another example:

```sql
WHERE customer_name LIKE '%Retail%'
```

Indicates that the text contains `Retail`.

The underscore `_` usually represents a single arbitrary character:

```sql
LIKE 'A_1'
```

Case sensitivity, collation and pattern-matching details vary across database systems, so production queries must be checked against the system in use.

## Do not test NULL with = NULL

This is one of the easiest pitfalls when learning SQL.

Wrong writing:

```sql
WHERE phone = NULL
```

Correct way to write:

```sql
WHERE phone IS NULL
```

in turn:

```sql
WHERE phone IS NOT NULL
```

The reason is that NULL is not a normal value. It represents unknown or missing, so "whether a value is equal to unknown" does not get the normal TRUE/FALSE.

## WHERE uses three-valued logic

SQL conditions are not only TRUE and FALSE, but also UNKNOWN.

For example:

```sql
NULL = 100
```

Not FALSE, but UNKNOWN.

WHERE only retains records whose judgment result is TRUE. Neither FALSE nor UNKNOWN enters the result.

This affects many expressions with NULL, for example:

```sql
WHERE amount > 100
```

If amount is NULL, this record will not be left because the result is not TRUE.

After understanding three-valued logic, many "why is there a missing line" questions will no longer seem mysterious.

## Quote strings, not numbers

Numeric conditions are usually written directly:

```sql
WHERE order_value >= 500
```

Use single quotes for text:

```sql
WHERE segment = 'Retail'
```

Write all numbers as strings, or forget to add quotation marks to the text. Some databases will try to convert implicitly, and some will report an error directly. Even if it works, it's not worth relying on unclear type conversions.

## Date filtering depends on the storage representation

The current SQLite example uses ISO formatted text:

```text
2026-07-03
2026-07-05
```

Because the format is `YYYY-MM-DD`, lexicographic comparison also maintains date order.

For example:

```sql
SELECT *
FROM orders
WHERE order_date >= '2026-07-05';
```

Production databases are more likely to use specialised DATE / TIMESTAMP types. Date functions, time zones and boundary behaviour must be handled for the specific database system.

## WHERE does not define result order

Query:

```sql
SELECT *
FROM orders
WHERE order_value >= 400;
```

It is only responsible for filtering records and does not guarantee the return order.

If you want to order from high to low by amount later, you need:

```sql
ORDER BY order_value DESC
```

Understanding filtering and sorting separately can avoid treating the accidental row order you are currently seeing as a SQL guarantee.

## Verify complex conditions one block at a time

Assume the final condition is:

```sql
WHERE order_value BETWEEN 400 AND 600
  AND customer_id IN (1001, 1003)
```

If the results are not as expected, you can run it separately first:

```sql
WHERE order_value BETWEEN 400 AND 600
```

Run again:

```sql
WHERE customer_id IN (1001, 1003)
```

Finally put it together.

This is faster than guessing which bracket is wrong in a long query.

## Common WHERE mistakes

- AND / OR are not bracketed as expected;
- Write `NULL` as `= NULL`;
- Mistaking both ends of `BETWEEN` as not included;
- Text forgets single quotes;
- Rely on database implicit type conversion;
- The filter conditions do not match the business definition;
- Think of WHERE as a sorting tool.

## A practical filtering checklist

1. First write the most basic SELECT and FROM;
2. Add WHERE conditions one at a time;
3. Check comparison symbols and boundaries;
4. Add parentheses when mixing AND / OR;
5. NULL uses `IS NULL` / `IS NOT NULL`;
6. Confirm data types for dates, text, and numbers;
7. Check whether the number of result rows meets business expectations.

WHERE ultimately makes one decision for each row: keep it or exclude it. As conditions become more complex, clarify the business rule first and then express it in SQL. The next note turns from row filtering to choosing which columns appear in the result.
