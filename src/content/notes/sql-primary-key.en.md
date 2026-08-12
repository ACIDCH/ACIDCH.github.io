---
translationKey: sql-primary-key
locale: en
slug: sql-primary-key
title: Primary Keys
summary: A primary key uniquely identifies a record. Customer names, email addresses and other business fields can change, so databases often use a more stable identifier. This note compares auto-incrementing integers, UUIDs, natural keys and composite primary keys.
tags:
  - primary key
  - relational model
  - data integrity
  - Database design
topics:
  - Data management
  - Data Modelling
  - Data understanding
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
seriesSlug: sql
order: 2
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-relational-data
  - sql-foreign-key
---

## Why every table needs a record identity

Customer names, email addresses, and mobile phone numbers can all help identify customers, but they are all subject to change. The database needs a more stable field to ensure that even if the name is changed or the contact information is changed, it is still known that this is the same customer record.

Current customer table:

| customer_id | customer_name | email              | phone       | segment    |
| ----------: | ------------- | ------------------ | ----------- | ---------- |
|        1001 | North Retail  | north@example.com  | 021-440-810 | Retail     |
|        1002 | Coast Foods   | coast@example.com  | 021-440-811 | Wholesale  |
|        1003 | Alpine Labs   | alpine@example.com | 021-440-812 | Enterprise |

Here `customer_id` is the primary key, which is used to uniquely identify the customer record.

Primary Key is not the "most important business field". It is only responsible for allowing the database to accurately find a certain record.

## A primary key must guarantee uniqueness

A primary key must satisfy at least two things:

```text
不能重复
不能为 NULL
```

For example:

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  segment TEXT NOT NULL
);
```

`customer_id` is the primary key. Even though `email` also sets `UNIQUE`, the two still have different responsibilities: the mailbox is the business attribute and the customer ID is used to identify the record.

If the database allows two customer records to be called 1001, there will be ambiguity in subsequent UPDATE, DELETE, and JOIN, so uniqueness is not an optional decoration.

## Unique today does not necessarily mean suitable as a primary key

If a certain field currently has no duplicates, it only means that it now meets uniqueness, but it does not mean that it is suitable for long-term use as a primary key.

For example email:

```text
north@example.com
coast@example.com
alpine@example.com
```

It's really all different now. But it is a very common business change for customers to change their email addresses. If the email address is the primary key, updating the contact information also becomes the update record identifier.

Similar problems will also occur with mobile phone numbers, user names, product names and certain business codes.

So when choosing a primary key, in addition to uniqueness, you also need to look at:

- Whether it is stable;
- Is it easy to change;
- Whether it is allowed to be empty;
- Whether it carries too much business meaning;
- Whether it is suitable for long-term reference by other tables.

<div data-learning-slot="primary-key-lab"></div>

## PRIMARY KEY and UNIQUE solve related but different problems

A table can have multiple `UNIQUE` fields or combinations, but usually only one Primary Key.

For example:

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  customer_name TEXT NOT NULL
);
```

here:

```text
customer_id
→ 唯一标识这条记录

email
→ 业务上不允许重复
```

`UNIQUE` is great for protecting business rules without having to treat every unique field as a primary key.

## Auto-incrementing integers are common, but not the only option

Many databases use integer IDs as surrogate keys.

Typical form is:

```text
1001
1002
1003
...
```

The advantages are obvious: short, stable, index-friendly, easy to handle during JOIN, and will not change due to changes in business fields.

`AUTO_INCREMENT` is a MySQL dialect. Common writing methods are:

```sql
customer_id BIGINT AUTO_INCREMENT PRIMARY KEY
```

PostgreSQL more common identity column:

```sql
customer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

The syntax of different databases is different, but the common idea is to let the database generate a stable agent ID.

## What is special about SQLite's INTEGER PRIMARY KEY?

In SQLite:

```sql
customer_id INTEGER PRIMARY KEY
```

With special semantics, it becomes an alias for rowid.

If no specific ID is provided when inserting, SQLite can automatically generate an integer value:

```sql
INSERT INTO customers (customer_name, email, segment)
VALUES ('Harbour Works', 'harbour@example.com', 'Retail');
```

It should be noted that SQLite's `INTEGER PRIMARY KEY` and MySQL's `AUTO_INCREMENT` are not the same implementation. When learning cross-database SQL, it is best to understand the "primary key concept" and "how the specific database generates ID" separately.

## UUIDs support distributed generation, but are not one single algorithm

UUID is often used in scenarios where it is inconvenient to rely on a single database auto-increment sequence, for example, multiple services or devices need to generate IDs independently.

Its form is usually longer than an integer:

```text
550e8400-e29b-41d4-a716-446655440000
```

The advantage is that the generation space is large, the probability of cross-system collision is low, and it is more suitable for distributed environments.

The price includes:

- larger storage;
- Indexes are heavier;
- Manual reading is not as convenient as integers;
- Some random UUIDs are not friendly to B-tree write locality.

Moreover, "UUID" is a family, and the generation methods and sorting characteristics of different versions are different. All UUIDs cannot be simply understood as completely random strings.

## When can a natural key be used as a primary key?

Natural key refers to a field that already exists in the business itself and is stable and unique.

For example, certain standard codes, nationally defined permanent numbers, and strictly controlled and immutable combinations within the system may become candidate primary keys.

The key is not "surrogate keys are always better", but to evaluate whether natural keys actually satisfy:

```text
唯一
非空
稳定
长度合理
长期语义清楚
```

If the business number may be recoded in the future, use it as the primary key with extreme caution.

## Composite primary keys identify a record through multiple fields

The uniqueness of some records naturally comes from the combination of multiple fields.

`order_items` is a typical example. The current rules stipulate that only one detail will appear for the same product in the same order.

therefore:

```text
(order_id, product_id)
```

Decide on a record together.

SQL can be written as:

```sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

Here `order_id` will be repeated alone, and `product_id` will be repeated alone, but the combination of the two cannot be repeated.

Composite primary keys are particularly useful in junction tables. A key with many fields also makes downstream foreign keys wider, so the choice still depends on the data model.

## Do not treat a primary key as a business sequence

When you see an integer primary key, it's easy to think of it as a chronological order:

```text
ID 大
→ 一定更晚
```

This is not reliable.

Different databases, migration processes, bulk imports, or distributed IDs can break this assumption. When you really need to sort by time, you should use an explicit datetime field, for example:

```sql
ORDER BY created_at
```

The primary key is responsible for identifying the record and should not be secretly regarded as an undefined business time field.

## Changing a referenced primary key is costly

In the order table:

```text
orders.customer_id
```

The customer primary key will be referenced.

If a primary key changes frequently, all foreign keys that reference it must be considered for simultaneous updates. Databases can provide mechanisms such as `ON UPDATE CASCADE`, but from a design perspective a stable primary key is usually simpler.

This is why frequently modified fields such as customer name are not suitable as primary keys.

## A minimal primary key experiment

You can try this in the SQLite playground:

```sql
CREATE TABLE demo_customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL
);

INSERT INTO demo_customers VALUES (1, 'North');
INSERT INTO demo_customers VALUES (1, 'Coast');
```

The second INSERT will fail due to duplicate primary keys.

<div data-learning-slot="sql-playground"></div>

The value of this constraint is straightforward: erroneous data is not discovered until analysis, but is blocked while being written to the database.

## A primary key design checklist

1. Does each record have a unique identifier?
2. Will the candidate fields change with ordinary business updates?
3. Allow `NULL`?
4. Will this key be referenced by many tables in the future?
5. Are natural keys really stable, or do they just happen to be unique at the moment?
6. Is a composite primary key required?
7. What is the syntax for generating IDs for a specific database?

A primary key solves a fundamental problem: how to identify a record accurately and consistently over time. The next note looks at foreign keys and how another table can reference that identity safely.
