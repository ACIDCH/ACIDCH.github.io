---
translationKey: sql-order-by
locale: en
slug: sql-order-by
title: Sorting with ORDER BY
summary: Returning the correct records does not guarantee a reliable order. This note covers ascending, descending and multi-column sorting, explains why stable ordering needs a tie-breaker, and connects that requirement to pagination.
tags:
  - ORDER BY
  - Sorting
  - SQL Queries
  - Stable Ordering
topics:
  - Data Queries
  - Data Understanding
  - SQL Basics
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
seriesSlug: sql
order: 8
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-projection
  - sql-pagination
---

## From result structure to result order

SELECT determines which columns are returned, and WHERE determines which rows remain. Even if both steps are correct, the database still makes no promise about the order in which the rows will appear.

If the order of results makes sense for reporting, Top-N, or pagination, write `ORDER BY` explicitly.

```sql
SELECT
  customer_id,
  customer_name
FROM customers
ORDER BY customer_id ASC;
```

Sorting is not to make the table look neat, but to actually write the rules into the query when order is required.

<div data-learning-slot="order-by-lab"></div>

## ORDER BY controls the sequence of result rows

Current orders table:

| order_id | customer_id | order_date | order_value |
| -------: | ----------: | ---------- | ----------: |
|    50001 |        1001 | 2026-07-03 |      420.00 |
|    50002 |        1001 | 2026-07-05 |      185.00 |
|    50003 |        1002 | 2026-07-06 |      760.00 |
|    50004 |        1003 | 2026-07-09 |      510.00 |

In ascending order by amount:

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value ASC;
```

result:

```text
50002 | 185
50001 | 420
50004 | 510
50003 | 760
```

The columns have not changed, the number of rows has not changed, only the order has changed.

## ASC is the default, but writing it explicitly aids review

The following two writing methods have the same effect in common databases:

```sql
ORDER BY customer_id
```

```sql
ORDER BY customer_id ASC
```

`ASC` means ascending, that is, ascending order.

Although it can be omitted, it is more clear to write it explicitly in team code and multi-column sorting. Numbers are usually from small to large, dates are from early to late, and text is also affected by collation.

## DESC reverses the sort direction

From high to low by amount:

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value DESC;
```

result:

```text
50003 | 760
50004 | 510
50001 | 420
50002 | 185
```

To sort by date from newest to oldest, you can write:

```sql
ORDER BY order_date DESC
```

## Multi-column sorting resolves ties one level at a time

If you sort only by `customer_id`, orders 50001 and 50002 both belong to customer 1001, and they are tied on the first sort key.

You can add a second sort key:

```sql
ORDER BY customer_id ASC, order_date DESC;
```

The databases are first sorted by `customer_id`; if they are the same, they are sorted by `order_date` from newer to older.

Multi-column sorting can be read as:

```text
先看第一列
相同再看第二列
还相同再看第三列
```

## Each sorting column has its own direction

In multi-column ORDER BY, each field can specify ASC or DESC independently.

For example:

```sql
ORDER BY customer_id ASC, order_date DESC, order_id ASC;
```

The meaning is:

```text
customer_id 从小到大
同一客户内，日期从新到旧
如果日期仍相同，再按 order_id 从小到大
```

Do not automatically set the direction of the first field to the back. The direction belongs to each sorting expression itself.

## The first sort key alone may not produce a stable total order

Assume that pagination only writes:

```sql
ORDER BY order_value DESC
```

If two subsequent orders have the same amount, there is no determined order between them.

A safer way to write it is to add a unique tie-breaker:

```sql
ORDER BY order_value DESC, order_id ASC;
```

As long as `order_id` is unique, all records will eventually have a clear location.

The current data is therefore in stable order:

```text
50003
50004
50001
50002
```

This deterministic ordering is important for pagination, leaderboards, and repeatable testing.

## Combining WHERE, projection and ORDER BY

Only look at orders with an amount of at least 400, return only the ID and amount, and then sort them from high to low:

```sql
SELECT
  order_id,
  order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC;
```

The query logic can be split into:

```text
FROM
→ 数据从哪里来

WHERE
→ 哪些行留下

SELECT
→ 显示哪些列

ORDER BY
→ 最终怎样排列
```

## Why ORDER BY comes after WHERE

The writing order of SQL is not arbitrary:

```sql
SELECT ...
FROM ...
WHERE ...
ORDER BY ...;
```

In terms of business, it is easier to understand by filtering out the records that meet the conditions first, and then sorting the final results.

The actual execution plan inside the database may be adjusted due to the optimizer, but the SQL syntax level still requires ORDER BY to be placed after WHERE.

This is why you can't write:

```sql
SELECT *
FROM orders
ORDER BY order_value DESC
WHERE order_value >= 400;
```

This syntax sequence will directly report an error.

## Sorting by an output alias

If aliases are created in SELECT:

```sql
SELECT
  order_id,
  ROUND(order_value * 1.10, 2) AS scenario_value
FROM orders
ORDER BY scenario_value DESC;
```

Common databases allow ORDER BY using `scenario_value`.

This avoids repeating complex expressions and makes the query easier to read.

However, the visibility rules for aliases in different clauses are different. Being able to be used in ORDER BY does not mean that WHERE can also directly reference the same alias.

## Column-position sorting works, but is brittle in maintained code

Some databases allow:

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY 2 DESC;
```

Here `2` means sorting by the second column of the SELECT result, which is `order_value`.

This way of writing is short, but has poor maintainability. Once the SELECT column order changes, the sorting meaning also changes.

Long-term code is better suited to explicitly writing fields or aliases:

```sql
ORDER BY order_value DESC
```

## NULL ordering cannot be inferred from intuition alone

If the sort column contains NULL, the default position may differ between databases.

For example:

```sql
ORDER BY phone ASC
```

A particular database's choice to place NULL first or last is not a universal SQL rule.

PostgreSQL supports:

```sql
NULLS FIRST
NULLS LAST
```

Other databases may do things differently. If the NULL position affects business results, you should look at the specific database and handle it explicitly.

## Collation also affects text sorting

Text sorting involves more than just alphabetical order and can also be affected by:

- uppercase and lowercase;
- accent mark;
- locale;
- Unicode rules;
- database collation.

therefore:

```sql
ORDER BY customer_name ASC
```

It does not mean that all databases are sorted by the exact same "eye alphabet".

The current examples are mainly English names, mainly used to understand the ORDER BY structure; a formal multi-language system also requires clear character sets and collation.

## ORDER BY is a prerequisite for reliable pagination

If you display two orders per page without a stable ORDER BY, the first and second pages are not actually clearly defined.

Pagination should be created first:

```sql
ORDER BY order_value DESC, order_id ASC
```

After determining the order in this way, use LIMIT / OFFSET to intercept the page.

So paging is not "LIMIT first, and then see what order the database gives". Page windows must be built on stable sequences.

## Where ORDER BY appears in business analytics

Sorting is much more than a presentation function in analytical work.

Common scenarios include:

```text
找金额最高的订单
查看最新交易
按风险分数排客户
制作 Top-N 产品榜单
为分页建立固定顺序
按时间检查异常变化
```

For example:

```sql
SELECT order_id, order_value
FROM orders
ORDER BY order_value DESC
LIMIT 3;
```

Here ORDER BY determines the meaning of "highest", and LIMIT only takes the top three results from the already arranged results.

## Sorting cost depends on indexes, not syntax alone

ORDER BY may require the database to perform additional sorting. When the amount of data is large, whether there are appropriate indexes on the sorting column and WHERE condition will affect performance.

But the index is not "automatically created when seeing ORDER BY". Also needs to be combined with:

- WHERE condition;
- Multi-column combination;
- Sorting direction;
- Return the number of rows;
- data distribution;
- Actual execution of the plan.

The index will be continued in subsequent topics. Let’s first write down the sequence contract clearly.

## Common sorting mistakes

### Depends on the current row order of the original table

Without ORDER BY, there is no business-level order guarantee.

### Only the first key is ranked, but the results are required to be completely repeatable

A tie-breaker is required when there is a tie.

### Treat column order as row order

SELECT list controls columns, ORDER BY controls rows.

### Ignore NULL and text collation

Database systems may use different default behaviours.

### No stable sorting during paging

Page content may be duplicated or omitted near parallel values.

## A practical sorting checklist

1. First, confirm how the business really wants to be arranged;
2. Make it clear whether each field is ASC or DESC;
3. When the first sort key may be tied, a second key is added;
4. Ultimately it's best to form a full tie-breaker with a unique bond;
5. NULL is handled explicitly when the position is important;
6. Confirm collation when text sorting is required;
7. Make sure ORDER BY is stable before doing paging.

## Next: take a page from an ordered result

ORDER BY may seem like just rearranging the rows, but it becomes part of the query contract whenever the results need to be repeatedly viewed, exported, ranked, or paginated.

The next note builds directly on stable ordering: set a page size, use LIMIT and OFFSET to take one result window, then compare that approach with keyset pagination as data volume grows.
