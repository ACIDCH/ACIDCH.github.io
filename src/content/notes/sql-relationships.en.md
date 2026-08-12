---
translationKey: sql-relationships
locale: en
slug: sql-relationships
title: Table Relationships
summary: A relationship between two tables is defined by how many records on either side may correspond. Using customers, orders and products, this note explains one-to-many, many-to-many and one-to-one relationships, and why JOIN can increase the number of result rows.
tags:
  - one to many
  - many to many
  - One to one
  - relational model
topics:
  - Data management
  - Data Modelling
  - relational design
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
seriesSlug: sql
order: 4
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-foreign-key
  - sql-select
---

## Saying two tables are related is not enough

Foreign keys can indicate that one record refers to another record, but two questions need to be asked when building a table:

```text
A 的一条记录，最多能对应多少条 B？
B 的一条记录，最多能对应多少条 A？
```

The answer determines the relationship cardinality between tables, that is, Relationship Cardinality.

The three most common situations in relational databases are:

```text
One-to-Many   1:N
Many-to-Many  N:M
One-to-One    1:1
```

These are not three SQL syntaxes, but three business relationships. The database just writes this relationship into the table structure.

<div data-learning-slot="relationship-cardinality-lab"></div>

## One-to-many: one customer can have many orders

In the customer table, there is only one row for each customer:

| customer_id | customer_name |
| ----------: | ------------- |
|        1001 | North Retail  |
|        1002 | Coast Foods   |
|        1003 | Alpine Labs   |

In the order table, the same customer can appear multiple times:

| order_id | customer_id | order_value |
| -------: | ----------: | ----------: |
|    50001 |        1001 |      420.00 |
|    50002 |        1001 |      185.00 |
|    50003 |        1002 |      760.00 |
|    50004 |        1003 |      510.00 |

Customer 1001 has two orders:

```text
customer 1001
    │
    ├── order 50001
    └── order 50002
```

so:

```text
customers 1 → N orders
```

Customer 1002 has only one order in the current sample, which does not mean that the relationship has become 1:1. The relationship cardinality looks at what the business allows to happen, not what happens in the few rows of data in front of you.

### Foreign keys are usually placed on the "many" side

If an order can only belong to one customer, the orders table is best suited to hold `customer_id`:

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

`orders.customer_id` can be repeated, so the same customer can correspond to multiple orders.

On the other hand, "multiple orders belong to one customer" is Many-to-One, which is the same relationship as One-to-Many from two directions.

When judging 1:N, it is usually clearest to state the business rules directly:

```text
一个客户最多能有多少张订单？
→ 多张

一张订单最多能属于多少个客户？
→ 一个
```

Similar structures are common in business data:

```text
warehouse 1:N shipments
category 1:N products
customer 1:N service_events
```

## Many-to-many: why one foreign key is not enough for orders and products

The relationship between orders and products is more complex. An order can contain multiple products, and the same product can also appear in multiple orders.

Order 50001 contains:

```text
product 301 · Forecast Kit
product 305 · Sensor Pack
```

And the product 301 appears again:

```text
order 50001
order 50003
```

therefore:

```text
orders N ↔ M products
```

If you only add one `product_id` to `orders`, one order can only point directly to one product; if you put `order_id` into `products`, the same product can only point to one order. Neither approach can pretend to be a true N:M relationship.

At this time a third table is needed.

## A junction table turns many-to-many into two one-to-many relationships

`order_items` is used here:

| order_id | product_id | quantity | unit_price | line_value |
| -------: | ---------: | -------: | ---------: | ---------: |
|    50001 |        301 |        2 |     150.00 |     300.00 |
|    50001 |        305 |        1 |     120.00 |     120.00 |
|    50002 |        305 |        1 |     185.00 |     185.00 |
|    50003 |        301 |        4 |     190.00 |     760.00 |
|    50004 |        305 |        3 |     170.00 |     510.00 |

A row in this table is neither "an order" nor "a product", but:

> A detail of a certain product in an order.

The structure becomes:

```text
orders
  1
  │
  N
order_items
  N
  │
  1
products
```

So the original N:M was split into two 1:N.

This type of table is often called:

```text
bridge table
junction table
association table
```

The name is different, but the function is the same: specifically saving the relationship between two types of entities.

## Why junction tables often use composite primary keys

The current rules stipulate that only one detail is retained for the same product in the same order. therefore:

```text
(order_id, product_id)
```

This combination must be unique.

SQL can be written as:

```sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id)
    REFERENCES orders (order_id),
  FOREIGN KEY (product_id)
    REFERENCES products (product_id)
);
```

This allows multiple products to appear in the same order, and allows the same product to appear in multiple orders, but the exact same `(order_id, product_id)` combination will not appear.

Not every junction table needs a composite primary key. If one product may appear in several records within the same order, the primary-key design must change. The deciding question remains: what exactly does one row represent?

### The intermediate table can also store information about the relationship itself

`quantity` and `unit_price` are very suitable to be placed in `order_items`, because they are neither fixed attributes of the entire order, nor fixed attributes of the product master data, but information generated only when "this product appears in this order."

For example:

```text
order 50001
+
product 301
+
quantity 2
+
unit_price 150.00
```

correspond:

```text
line_value = 2 × 150 = 300
```

Order 50001 has another detail of 120:

```text
300 + 120 = 420
```

Aligns exactly with `orders.order_value = 420.00`.

This kind of backcalculation is important. Once the intermediate table becomes the source of analysis data, whether the detail totals and order totals are consistent should be checked, rather than defaulting to the fact that they must be consistent.

## One-to-one: one record corresponds to at most one record on the other side

One-to-one representation:

```text
A 的一条记录最多对应一条 B
B 的一条记录最多对应一条 A
```

For example, customer extension information:

| customer_id | timezone         | preferred_channel |
| ----------: | ---------------- | ----------------- |
|        1001 | Pacific/Auckland | Email             |
|        1002 | Pacific/Auckland | Portal            |
|        1003 | Pacific/Auckland | Email             |

If there is at most one profile per customer:

```text
customers 1 ↔ 1 customer_profiles
```

### Ordinary foreign keys by themselves cannot guarantee one-to-one

Just adding a foreign key to `customer_profiles.customer_id` is not enough, because ordinary foreign keys allow duplication. To really limit it to 1:1, a uniqueness constraint is also needed.

One way to write it:

```sql
CREATE TABLE customer_profiles (
  profile_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL UNIQUE,
  timezone TEXT,
  preferred_channel TEXT,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

The current data model uses shared primary keys:

```sql
CREATE TABLE customer_profiles (
  customer_id INTEGER PRIMARY KEY,
  timezone TEXT NOT NULL,
  preferred_channel TEXT NOT NULL,
  FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);
```

`customer_id` is both PK and FK, so it will naturally not be repeated in `customer_profiles`.

### One-on-one does not mean that the watch must be dismantled

If the two sets of fields always exist together and are queried together, splitting them into two tables will increase the complexity. 1:1 is more suitable for the following situations:

- Extended fields are rarely used or are only available in some records;
- Core fields are accessed frequently and extended fields are accessed low-frequency;
- The two parts of data require different access rights;
- The two parts of data have different life cycles;
- The main table needs to be kept relatively simple.

So "one-to-one" is not the more advanced default design. Whether to dismantle the watch or not depends on whether there is a real business reason.

## Relationship cardinality affects the number of rows after JOIN

Customer 1001 has two orders. If you connect the customer table and the order table, the result will naturally be two rows:

```text
1001 | North Retail | 50001
1001 | North Retail | 50002
```

The repetition of `customer_id` here does not mean that the query is wrong, but the normal result after expansion of 1:N.

What really needs to be checked is: whether the number of new rows matches the original business relationship, or whether the JOIN conditions are written incorrectly causing additional amplification.

### Many-to-many is more likely to cause double counting

The order table was originally one order per row. After connecting with `order_items`, the granularity becomes one order detail per row.

```text
orders
One row = one order

orders + order_items
One row = one product line within one order
```

Order 50001 Because there are two details, it will become two rows after JOIN.

If you bring the order-level `order_value = 420` to the two details, and then sum them directly:

```text
420 + 420 = 840
```

The amount was double counted.

The approach depends on the analysis problem:

- If the total order amount is required, maintain the order granularity;
- If product details are needed, use `quantity × unit_price`;
- If you need to recalculate the order amount from details, aggregate `line_value` according to `order_id`.

Many JOIN errors are not syntax errors, but the query has run through but the granularity has changed.

## State the business rule before connecting tables

| Business description                                                                       | relation | Common implementation              |
| ------------------------------------------------------------------------------------------ | -------- | ---------------------------------- |
| A customer has multiple orders, and each order belongs to one customer                     | 1:N      | FK in orders                       |
| One order contains multiple products, and one product will also appear in multiple orders. | N:M      | Use order_items intermediate table |
| A customer can only have one extension at most.                                            | 1:1      | FK + UNIQUE, or shared PK          |

It is usually safer to explain the business rules clearly first and then decide the table structure than to draw a few tables and then guess what their relationships are.

## Common relationship-modelling mistakes

### cram many-to-many into a string

```text
product_ids = "301,305,309"
```

It seems that one table is saved, but later it will make filtering, JOIN, indexing and constraints more troublesome.

### Mistaking every foreign key for a one-to-one relationship

Ordinary foreign key values ​​can be repeated. 1:1 also requires uniqueness guarantees such as `UNIQUE` or a shared primary key.

### Ignore granularity of intermediate tables

A row in the bridge table represents a single relationship and does not equal a complete record of entities on either side.

### If there are duplicate values ​​after JOIN, just remove them directly.

1:N and N:M inherently extend the number of lines. Confirm the relationship and granularity first, and then decide whether duplication is really needed.

### Guess the relationship based on the data in front of you

There is currently only one association, which does not mean that only one will be allowed in the future. The cardinality should come from business rules.

## A relationship design checklist

1. How many records of B can a record of A correspond to?
2. How many records of A can a record of B correspond to?
3. 1: Is the foreign key of N placed on the N side?
4. N:M Is an intermediate table required?
5. 1:1 Is there really a uniqueness constraint?
6. Does the intermediate table also need to store relationship attributes such as quantity, price, status, etc.?
7. What will be the granularity of the results after JOIN?

If you answer these questions clearly, the relationship will usually not be too far off.

## Summary

```text
1:N
→ 外键通常放在 N 侧

N:M
→ 用中间表拆成两个 1:N

1:1
→ 外键 + UNIQUE，或共享主键
```

The table relationship does not depend on what the current data "looks like", but on how many records of another type the business rules allow one record to correspond to. Next, enter `SELECT` and start actually reading data from these tables.
