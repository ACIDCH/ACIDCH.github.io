---
translationKey: sql-pagination
locale: en
slug: sql-pagination
title: Pagination Queries
summary: When a result is too large to display at once, it must be divided into pages in a stable order. This note builds a minimal pagination query with LIMIT, OFFSET and ORDER BY, then compares deep-offset and keyset pagination.
tags:
  - Pagination
  - LIMIT
  - OFFSET
  - Keyset Pagination
topics:
  - Data Queries
  - SQL Basics
  - Query Performance
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
seriesSlug: sql
order: 9
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-order-by
---

## From an ordered result to a page window

When there are only four orders, it is of course no problem to return them all at once. If there are hundreds of thousands of records in a real system, it is impossible for the list page to send all rows to the browser every time.

What paging does is actually very simple: first arrange the results according to stable rules, and then cut a section from this ordered sequence.

Current order by:

```sql
ORDER BY order_value DESC, order_id ASC
```

get:

```text
50003 | 760
50004 | 510
50001 | 420
50002 | 185
```

If there are 2 items per page, then the first page will be the first two items, and the second page will be the last two items.

<div data-learning-slot="pagination-lab"></div>

## LIMIT sets the maximum rows per page

In SQLite:

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2;
```

will return:

```text
50003 | 760
50004 | 510
```

`LIMIT 2` means that at most 2 rows will be fetched this time.

If the result would have only been 1 rows, LIMIT doesn't shoehorn in the second row; it just sets the upper limit.

The paging syntax of different databases may be different. For example, SQL Server commonly uses OFFSET/FETCH. Standards and dialects need to be looked at separately.

## OFFSET sets how many rows to skip

The second page needs to skip the 2 line on the first page:

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 2;
```

result:

```text
50001 | 420
50002 | 185
```

OFFSET means: **skip a specified number of rows from the start of the ordered result, then take at most the number specified by LIMIT.**

## Page numbers start at 1; OFFSET starts at 0

The business interface usually calls the first page page 1, but OFFSET is calculated from 0.

formula:

```text
OFFSET = pageSize × (pageIndex - 1)
```

2 items per page:

```text
page 1 → OFFSET 0
page 2 → OFFSET 2
page 3 → OFFSET 4
```

therefore:

```text
OFFSET = pageSize × (pageIndex - 1)
```

This minus 1 is easy to miss, and the result is that the entire page will be misaligned.

## Total pages come from the record count and pageSize

If there are 4 records in total, 2 records per page:

\[
TotalPages=\lceil4/2\rceil=2
\]

If there are 5 items:

\[
TotalPages=\lceil5/2\rceil=3
\]

It's completely normal to have only 1 items on the last page.

Page components usually also need to query the total number of records separately:

```sql
SELECT COUNT(*)
FROM orders;
```

Then calculate the total number of pages based on pageSize.

## An out-of-range OFFSET usually returns an empty result

There are currently only 4 orders, if you run:

```sql
SELECT
  order_id,
  order_value
FROM orders
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 10;
```

Usually you get an empty result set.

This does not indicate an SQL syntax error, just that the number of skipped rows exceeds the current result length.

The application layer needs to decide what to do when an out-of-bounds page number is encountered: display an empty page, return to the last page, or return 404/parameter error. The database is only responsible for executing queries.

## Pagination requires a stable ORDER BY

The most dangerous paging error is not LIMIT written incorrectly, but sorting instability.

If you just write:

```sql
ORDER BY order_value DESC
```

When two orders have the same amount, there is no determined order between them.

Cut off one line on the first page, and when querying again on the second page, the parallel records may change positions, so the following may appear:

```text
某条记录重复出现
```

or:

```text
某条记录被跳过
```

Therefore, a more secure ranking is:

```sql
ORDER BY order_value DESC, order_id ASC
```

`order_id` is unique, so the entire sequence ends up in a clear order.

## LIMIT/OFFSET repeatedly counts from the beginning

To fetch page 5000, if there are 20 rows per page:

```text
OFFSET = 20 × (5000 - 1)
       = 99980
```

The database needs to get past the previous 99,980 entries before it can start returning this page.

Exactly how this is performed depends on the database and index, but deep OFFSETs are generally increasingly expensive.

So LIMIT/OFFSET is suitable for:

- The amount of data is not large;
- The page is not deep;
- The management background needs to jump directly to a certain page;
- Inquiry costs are acceptable.

It's simple, intuitive, and not the "wrong way to paginate." It’s just that you need to know its boundaries when the scale becomes larger.

## A deeper OFFSET usually makes the database skip more records

For example:

```sql
LIMIT 20 OFFSET 100000
```

In the end, only 20 rows are returned, but a large number of previous records still need to be located and skipped.

If the page is mainly "next page, next page" browsing backwards, rather than randomly jumping to page 8000, keyset pagination is often more suitable.

Before optimizing paging, it is best to look at the actual query plan and access pattern, rather than just replacing all OFFSET based on rules.

## Data changes between requests create another pagination problem

Assume that after the first page query is completed, a new order is inserted into the top of the sort.

The original second record may have been pushed to third place. Now execute the second page:

```text
OFFSET 2
```

Page boundaries have changed.

There may be duplicates or omissions in results.

It's not that the ORDER BY is unstable, it's that the data itself has changed between the two queries.

For data streams that change frequently, simply using offset to indicate "which page" will naturally be affected by this positional movement.

## Keyset pagination continues from the previous page's last key

Keyset pagination no longer says "skip the first 100000 rows" but instead remembers the sort key of the last record on the previous page.

Current sort:

```sql
ORDER BY order_value DESC, order_id ASC
```

The last item on the first page is:

```text
50004 | 510
```

You can continue to find the next page from "Records ranked after 510 / 50004".

Conceptually similar:

```sql
WHERE
  order_value < 510
  OR (order_value = 510 AND order_id > 50004)
ORDER BY order_value DESC, order_id ASC
LIMIT 2;
```

The result is still:

```text
50001 | 420
50002 | 185
```

It uses the cursor position instead of the page number offset.

## Keyset pagination is not always better

Advantages of Keyset:

- Deep pages are generally more efficient;
- More stable for previously inserted new records;
- Great for continuous scrolling and "loading more".

The cost is also obvious:

- It is inconvenient to jump directly to page 237;
- The cursor needs to contain the full sort key;
- The conditions are more complex when using multiple columns, NULL and mixed sorting directions;
- Front-end URL and status management also need to cooperate with cursor.

Therefore, the choice between offset and keyset should be based on product interaction and data scale, rather than regarding a certain method as the standard answer for all scenarios.

## The pagination COUNT must use the same query scope

Assume that the list only shows orders with an amount of at least 400:

```sql
SELECT
  order_id,
  order_value
FROM orders
WHERE order_value >= 400
ORDER BY order_value DESC, order_id ASC
LIMIT 2 OFFSET 0;
```

The same filter must also be used for the total number of records:

```sql
SELECT COUNT(*)
FROM orders
WHERE order_value >= 400;
```

If the page query has a WHERE but the COUNT does not, the frontend will display the wrong total number of pages.

This kind of bug is very common because "data query" and "count query" are maintained separately, and the conditions are later changed only on one side.

## Filters, ordering and cursor values must agree

Under Keyset pagination, the cursor does not just pick an ID.

If the sorting is:

```text
order_value DESC, order_id ASC
```

Cursors must also carry:

```text
last_order_value
last_order_id
```

Saving only `order_id` cannot restore the same sort position.

Likewise, if the user changes the WHERE filtering or sorting method, the old cursor usually cannot be used anymore because it belongs to another query sequence.

## A pagination interface should state its boundary behaviour clearly

A stable paging interface usually needs to specify:

```text
pageSize 最大允许多少？
pageIndex 从 0 还是 1 开始？
默认排序是什么？
排序是否有唯一 tie-breaker？
筛选变化后是否重置页码？
空页怎样返回？
cursor 是否有过期规则？
```

These are not database syntax issues, but they directly affect whether paging is repeatable and whether the front and back ends are consistent.

## Common pagination mistakes

### Without ORDER BY, just LIMIT/OFFSET directly

The page has no stable sequence basis.

### ORDER BY has tied values ​​but no unique tie-breaker

Page boundaries may be unstable.

### Forgot to subtract 1 from the page number formula

page 1 was incorrectly converted to OFFSET=pageSize.

### COUNT is inconsistent with list WHERE

The total number of pages in the front end is wrong.

### Deep OFFSET is very slow, but still increases the page number infinitely

You need to first look at the access mode and query plan to determine whether to use keyset instead.

### The data changes frequently, but it is assumed that "page N" always represents the same batch of records.

Positional paging itself does not guarantee this.

## A practical pagination checklist

1. First define a stable ORDER BY and add a unique tie-breaker;
2. Clarify pageSize and pageIndex;
3. Use `OFFSET = pageSize × (pageIndex - 1)` to calculate the offset;
4. COUNT uses the same filtering criteria as the list;
5. Test the first page, last page and out-of-bounds page;
6. Test for parallel sorting values;
7. The execution cost of checking deep OFFSET when the amount of data is large;
8. Consider keyset pagination in continuous scrolling scenarios;
9. When using keyset, let the cursor completely correspond to the sort key.

The core of paging is not the two keywords LIMIT and OFFSET, but to first establish a certain result sequence, and then fetch data along this sequence in a way suitable for the product scenario.
