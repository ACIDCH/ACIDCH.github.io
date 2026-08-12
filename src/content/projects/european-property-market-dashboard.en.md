---
translationKey: european-property-market-dashboard
locale: en
slug: european-property-market-dashboard
title: European Property Development Market Analysis in Power BI
summary: Compare growth, affordability and development priorities across eight European markets by combining house-price, wage and inflation indicators.
tools:
  - Power BI
  - Power Query
  - DAX
  - Data Modelling
topic: analytics
status: completed
featured: true
tags:
  - Dashboard
  - Data Visualisation
  - European Property
  - House Prices
  - Wages
  - Inflation
  - Affordability
updatedAt: 2026-07-30
---

## Project overview

The dashboard compares house-price, wage and HICP indicators from 2015–2024 across 8 European markets and uses 5 equally weighted ranks to support a development-location decision. Its 4 report pages move from long-term growth and recent momentum to buyer affordability and final priority.

## Data preparation and model

Power Query filters annual residential house-price indices, constant-price USD PPP wages and non-seasonally adjusted HICP series to a common set of countries and years. Dim_Country and Dim_Year connect Fact_HousePrices, Fact_Wages and Fact_HICP through 6 active many-to-one, single-direction relationships, while measures are held in a dedicated measure table.

## Measure design

The measures build from change against a 2015 baseline, rolling momentum over 2022–2024 and risk ranks. The final score gives equal weight to long-term growth, recent momentum, wage support, affordability and cost risk, placing growth opportunity and demand capacity in the same comparison framework.

## Main findings

Portugal's house prices rise by 124.4% from 2015, above the eight-market average of 73.69%, but its 2024 gap between house-price growth and wage growth is about 111 percentage points. Poland records average annual house-price growth of 11.86% over 2022–2024, giving it strong recent momentum; its HICP increase over 2015–2024 is about 49%.

## Decision interpretation

Portugal represents a high-growth opportunity accompanied by affordability pressure, whereas Poland provides a more balanced priority across recent momentum and composite risk. The ranking narrows the field for due diligence; it is not an automatic investment decision. Land, financing, regulation and project-level demand still require separate validation.
