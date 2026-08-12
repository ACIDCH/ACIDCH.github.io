---
translationKey: sql-foreign-key
locale: en
slug: sql-foreign-key
title: Foreign Keys
summary: An order's customer_id is not just a number; it should identify a real customer. Using customers and orders, this note explains foreign keys, parent and child tables, referential integrity, and the way constraint syntax varies across database systems.
tags:
  - Foreign Key
  - Relational Model
  - Referential Integrity
  - Database Design
topics:
  - Data Management
  - Data Modelling
  - Data Integrity
tools:
  - SQL
  - SQLite
series: SQL and Relational Data
seriesSlug: sql
order: 3
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - sales-profitability-warehouse
relatedNotes:
  - sql-primary-key
  - sql-relationships
---

## A primary key identifies the record; a foreign key identifies its relationship

`customer_id` in the customer table can uniquely find a customer. When it comes to the order table, the same field takes on another role: indicating who this order belongs to.

Customer table:

| customer_id | customer_name | segment    |
| ----------: | ------------- | ---------- |
|        1001 | North Retail  | Retail     |
|        1002 | Coast Foods   | Wholesale  |
|        1003 | Alpine Labs   | Enterprise |

Orders table:

| order_id | customer_id | order_date | order_value |
| -------: | ----------: | ---------- | ----------: |
|    50001 |        1001 | 2026-07-03 |      420.00 |
|    50002 |        1001 | 2026-07-05 |      185.00 |
|    50003 |        1002 | 2026-07-06 |      760.00 |
|    50004 |        1003 | 2026-07-09 |      510.00 |

here:

```text
customers.customer_id
→ Primary Key

orders.customer_id
→ Foreign Key
```

Foreign keys securely point records in one table to another table.

## Matching column names do not create a foreign key

Both tables are called `customer_id` and will not automatically generate database relationships. The real constraints need to be written explicitly:

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

This SQL does two things:

```sql
FOREIGN KEY (customer_id)
```

Description `orders.customer_id` is a reference column;

```sql
REFERENCES customers (customer_id)
```

Explain that it refers to `customers.customer_id`.

Matching column names are a useful convention, not a requirement. A child-table field named `buyer_id` can still reference `customers.customer_id` when the constraint states that relationship explicitly.

<div data-learning-slot="foreign-key-lab"></div>

## Parent and child describe the direction of the reference

In this relationship:

```text
customers
→ 被引用
→ Parent table

orders
→ 保存 customer_id
→ Child table
```

"Father" and "Son" do not indicate business importance, nor do they mean that customers are necessarily more advanced than orders. It just describes the reference direction.

A parent record can be referenced by many child records, which is also the basis of the one-to-many relationship later.

## What is referential integrity?

Referential integrity requires that foreign key references must have legal targets.

The current customer IDs are only:

```text
1001
1002
1003
```

If the new order is written as:

```text
order_id = 50005
customer_id = 9999
```

And the customer 9999 does not exist at all, so this order becomes an orphan record.

The purpose of foreign key constraints is to prevent such references from entering the database.

This is much more reliable than later analysis only to discover that "there is an order and the customer cannot be found" because the error will be exposed when it is written.

## How foreign key constraints prevent invalid orders

First enable foreign key checking in SQLite:

```sql
PRAGMA foreign_keys = ON;
```

Then insert a non-existing customer:

```sql
INSERT INTO orders (
  order_id,
  customer_id,
  order_date,
  order_value
)
VALUES (
  50005,
  9999,
  '2026-07-10',
  250
);
```

This INSERT will fail if the foreign key has been correctly created and enabled.

This kind of failure is a good thing. The database is telling the user that the order refers to a customer that does not exist, and the data relationship is no longer established.

## Foreign key columns can often be repeated

`orders.customer_id` is a foreign key, but client 1001 can appear twice:

```text
50001 → 1001
50002 → 1001
```

This is completely normal as a customer can have multiple orders.

therefore:

```text
Foreign Key
≠ UNIQUE
```

If the foreign key is also set to `UNIQUE`, the relationship will be further restricted to one of the structures of "one parent record corresponds to at most one child record".

Ordinary foreign keys themselves only guarantee that the reference is legal, and do not specify how many times it can be referenced.

## What happens when a parent record is deleted

Assume that customer 1001 still has an order. If you delete this customer directly, the order will lose the reference target.

Databases usually require an explicit policy.

### RESTRICT / NO ACTION

If there are child records, refuse to delete the parent record.

This is the most conservative and easiest to understand option.

### CASCADE

When a parent record is deleted, related child records are deleted together:

```sql
FOREIGN KEY (customer_id)
  REFERENCES customers (customer_id)
  ON DELETE CASCADE
```

This behaviour has substantial consequences. Confirm that the business genuinely intends to delete historical orders with the customer; many transaction systems are deliberately designed otherwise.

### SET NULL

If the foreign key column allows `NULL`, you can change the reference to `NULL` after the parent record is deleted.

Whether it is reasonable depends on whether the business allows "the order exists, but the customer is unknown".

There is no unified best answer for foreign key actions, and they should be determined according to the data life cycle.

## Updating a primary key also affects its references

What happens to the child table if the referenced primary key changes? Some databases support:

```sql
ON UPDATE CASCADE
```

Let the foreign keys be updated accordingly.

But from a design point of view, the primary key should be as stable as possible. If a key is modified frequently, it is often more important to first check whether it is actually suitable to assume record identity than to rely on a large number of cascading updates.

## Foreign keys can be added later, but the syntax depends on the database

In some databases, you can create a table first and then use `ALTER TABLE` to add foreign keys.

For example, common ideas:

```sql
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id);
```

Naming constraints helps with subsequent maintenance and troubleshooting.

### Why is SQLite different?

SQLite's `ALTER TABLE` capabilities are not exactly the same as those of MySQL and PostgreSQL. Many complex constraint modifications need to be completed by creating new tables, migrating data, renaming tables, etc.

Therefore, the DDL syntax of one database cannot be copied directly to all databases.

The current learning experiment uses SQLite, so table relationships are usually defined directly at `CREATE TABLE`.

## A logical foreign key is not the same as a database constraint

In real data warehouses and analysis platforms, situations where "logically this is a foreign key" often occur, but the database does not actually create the `FOREIGN KEY` constraint.

For example in the fact table:

```text
customer_id
product_id
```

Dimension tables are obviously referenced on the data model, but there may be no physical foreign keys due to ETL, partitioning, performance or platform limitations.

At this point the relationship still exists, but referential integrity is ensured by data pipelines and quality checks.

So it should be distinguished:

```text
logical relationship
→ 数据模型上应该怎样关联

physical foreign-key constraint
→ 数据库是否真正强制执行
```

The two are related, but not entirely equivalent.

## Foreign and primary key types must be compatible

If parent key is an integer:

```sql
customers.customer_id INTEGER
```

Child foreign keys should also use compatible types.

If one side stores the integer 1001 and the other stores the text `'1001'`, a database may apply implicit conversion. Index use, comparisons and constraint behaviour can then become difficult to reason about.

The type, length, and encoding of key fields are best kept consistent from the design stage.

## Foreign keys will directly affect subsequent JOINs

With:

```text
orders.customer_id
→ customers.customer_id
```

Later you can write:

```sql
SELECT
  o.order_id,
  c.customer_name,
  o.order_value
FROM orders AS o
JOIN customers AS c
  ON o.customer_id = c.customer_id;
```

The JOIN syntax itself does not force the database to have foreign keys, but foreign keys provide a clear data model basis for this connection.

If the join field is not a real business relationship, even if the SQL can run, it may produce incorrect results.

## Common foreign key problems

### Reference to a non-existent ID

This is the most direct referential integrity error.

### Historical data is not considered when deleting parent records

Cascading deletes can take away transaction records that shouldn't be gone.

### Mistakenly thinking that fields with the same name are automatically related

When there is no clear model relationship, you cannot guess JOIN based on field names only.

### The foreign key type of the child table is inconsistent with the primary key type of the parent table

This can leave constraints and queries vulnerable.

### If the data warehouse does not have physical foreign keys, it is assumed that the relationship does not exist.

Logical relationships still need to be maintained through ETL testing or data quality rules.

## When reviewing a foreign key design, you can ask these questions

1. Which table and column does the child-table field reference?
2. Is the referenced column unique and suitable as a key?
3. Is `NULL` allowed for child tables?
4. Can foreign keys be repeated? Is the business relationship 1:N or 1:1?
5. What should happen when a parent record is deleted or updated?
6. Are the key field types compatible?
7. Does the database actually have constraints enabled?
8. If there are only logical foreign keys, who checks the integrity?

The core rule is straightforward: every reference value in the child table must resolve to a valid target. The next note considers relationship cardinality—how to represent one-to-many, many-to-many and one-to-one relationships.
