---
translationKey: grammy-spotify-analysis
locale: en
slug: grammy-spotify-analysis
title: Multi-source Grammy and Spotify Analysis
summary: Clean and match Grammy nomination records with Spotify audio data to test whether winning songs differ in popularity and audio characteristics.
tools:
  - Python
  - pandas
  - RapidFuzz
  - SciPy
  - SQLite
  - Matplotlib
topic: analytics
status: completed
featured: true
tags:
  - Data Analysis
  - Data Cleaning
  - Entity Resolution
  - Fuzzy Matching
  - Statistical Testing
  - Data Visualisation
updatedAt: 2026-07-30
---

## Project overview

The analysis links two sources of Grammy nomination records, Spotify song attributes and a supplementary page-view event window to test whether winning songs have different popularity or audio characteristics. The final sample covers 1,687 songs from 2000–2018, of which 71 are identified as winners and 1,616 form the comparison group.

## Data cleaning

The two nomination sources begin with structures of 4,305 × 5 and 4,810 × 10. The workflow removes 43 within-source duplicates and 4,253 overlapping records between the sources, and excludes 2019 because its field structure is anomalous. Spotify data is reduced from 2,000 × 18 to an analysis table of 1,687 × 31.

## Entity matching

Song and artist names are standardised for case, accents, punctuation and whitespace before exact matching. Unmatched records are supplemented with token-set similarity at a threshold of 88, producing 64 exact matches and 7 fuzzy matches. Because changing the threshold changes the number of labels, the matching rule is part of the result rather than an invisible preprocessing detail.

## Statistical results

The median Spotify popularity is 72 for winning songs and 66 for other songs. The difference is statistically significant, but the distributions overlap substantially and the effect is small. None of the tests across 8 audio features reaches the 0.05 significance level. The mean annual popularity gap is 4.27 before 2015 and 2.08 in comparable years after 2015.

## Event window and limitations

The supplementary analysis retains 85 days of page views for each of 3 songs and creates a ±42-day window around the ceremony, yielding 255 observations. This window demonstrates the event-study method and cannot be generalised to the full sample. Platform popularity is a snapshot, while matching error and the observational design do not support treating an award as the causal source of a change in popularity.
