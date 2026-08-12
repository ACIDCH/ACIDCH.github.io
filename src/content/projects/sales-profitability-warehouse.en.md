---
translationKey: sales-profitability-warehouse
locale: en
slug: sales-profitability-warehouse
title: Sales and Profitability Warehouse Analysis in SQL
summary: Organise sales detail into an order-line star schema, then use T-SQL to analyse customer concentration, channel margin, discount bands and quarterly change.
tools:
  - T-SQL
  - Relational Database
  - Star Schema
  - Azure SQL
  - Azure Data Factory
topic: analytics
status: completed
featured: true
tags:
  - SQL
  - Database
  - Relational Database
  - Data Warehouse
  - Data Modelling
  - Star Schema
  - ETL
  - Querying
  - Sales Analysis
  - Profitability Analysis
updatedAt: 2026-07-30
---

## Project overview

The warehouse fixes its grain at one sales-order line and uses 1 fact table linked to 5 dimensions for customers, products, territories, promotions and dates. Its 5 foreign-key relationships give customer concentration, channel margin, discount performance and quarterly change a shared definition of sales, standard cost and gross profit.

## Modelling and loading

Dimensions are deduplicated and assigned surrogate keys before the fact table resolves foreign keys, converts amount and date types, and calculates derived measures. Constraint checks prevent orphaned keys and invalid nulls from entering the analytical layer. The time range covers 2011 Q3–2014 Q2, and all 4 T-SQL query groups read from the same star schema.

## Query design

The queries use CTEs, window functions, conditional aggregation and safe division to answer questions about customer revenue concentration, channel margin structure, discount-band performance and year-over-year quarterly change. Revenue and profit are calculated separately so that high sales are not treated automatically as high profitability; ordering and denominator boundaries are explicit in the SQL.

## Main findings

The customer-concentration query shows that leading customers account for 82.39% of sales and 14.60% of gross profit. In the channel analysis, the reseller channel represents 62.60% of sales. Margin across discount bands falls from 10.16% to -143.06%, showing why promotional intensity cannot be judged from revenue alone. The quarterly analysis identifies 2012 Q2 as a key comparison point.

## Limitations and reconciliation

These results reflect the warehouse period and definitions and do not prove that discounting caused lower profit. Source-system treatment of returns, tax, freight and currency can change the margin interpretation. Before a formal decision, the outputs still need reconciliation to finance definitions and ongoing data-quality controls for incremental loads, late-arriving dimensions and duplicate orders.
