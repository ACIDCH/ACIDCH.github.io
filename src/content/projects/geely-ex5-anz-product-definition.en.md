---
translationKey: geely-ex5-anz-product-definition
locale: en
slug: geely-ex5-anz-product-definition
title: Geely EX5 ANZ Product Definition & Competitor Benchmark
summary: Using a 2026-09-15 public-market snapshot, this case benchmarks Geely EX5 in Australia and New Zealand across price, range, charging, competitors and user experience, then turns the evidence into market-specific Must / Should / Explore requirements and validation plans.
tools:
  - Market Research
  - Competitive Benchmarking
  - Product Definition
  - JavaScript
  - Astro
topic: analytics
status: completed
featured: true
priority: 90
tags:
  - product strategy
  - market research
  - competitor analysis
  - EV
  - Australia
  - New Zealand
updatedAt: 2026-09-15
---

## Project context

Geely EX5 is available in Australia and New Zealand, but the two markets do not use an identical line-up. This project treats overseas product definition as more than a specification table. It asks, in a verifiable sequence, where the target product is already strong, where competitive windows are opening, which experience issues have enough evidence to act on, which remain hypotheses, and how a regional line-up could be structured.

Geely's public material describes localised ANZ operations and its broader “one country, one policy” overseas strategy. The case therefore analyses Australia and New Zealand separately before identifying software, chassis and line-up questions that can be shared across the two markets.

[Open the interactive product-definition workspace →](../../lab/geely-ex5-anz-product-definition/)

## Data and method

The market snapshot is fixed at **2026-09-15**. Specifications prioritise official brand pages and specification sheets. Where a current Australian official page does not expose a complete price/spec table, traceable automotive model data is used as a supplement. The benchmark focuses on similarly priced battery-electric SUVs, including BYD ATTO 3 / ATTO 3 EVO, Kia EV3 and MG MGS5 EV.

Every row retains its price basis. New Zealand mostly uses + ORC. In Australia, Geely, BYD and Kia use before ORC; MG currently publishes a drive-away offer, so MG is used for specification context rather than being forced into a like-for-like price-efficiency calculation.

User-experience evidence is separated into three layers: public specification answers “what the vehicle can do”; professional review records what independent testing found; owner communities surface questions worth testing next. Community samples are not representative of the market, so they create research hypotheses rather than claims that “users generally think” something.

## Competitor benchmark findings

In New Zealand, EX5 Complete at **NZ$49,990 + ORC / 430 km WLTP** remains a clear entry price anchor. Kia EV3 Light SR sits at **NZ$55,520 + ORC / 436 km**, while Light LR reaches **605 km** at **NZ$62,220 + ORC**. EX5 Inspire Extended Range is **NZ$56,990 + ORC / 450 km**, showing that upper-trim pressure is shifting from “does it have enough equipment?” toward “is the road-trip range and charging capability compelling enough?”.

The line-up structure is more important than one headline number. New Zealand Complete uses a **60 kWh** battery while Inspire Extended Range uses **68 kWh**; Australia's 2026 Complete already uses a **68.39 kWh** Extended Range battery and reaches **475 km WLTP**. “Complete Extended Range” is therefore not an invented trim idea: the combination already exists in the other ANZ market.

In Australia, EX5 Complete Extended Range and ATTO 3 EVO Dynamic are both **A$41,990 before ORC**. EX5 offers **475 km WLTP**, **55 km** more than Dynamic's **420 km**, so the entry product still has a strong price-range combination. At the upper end, EX5 Inspire is **A$45,990 / 450 km / 100 kW DC**, while ATTO 3 EVO Premium is **A$46,990 / 510 km / 220 kW DC / 230 kW RWD**. Upper-trim competition is visibly shifting toward road-trip capability, charging and powertrain differentiation.

## User-experience evidence

CarExpert's 2026 EX5 independent review lists **usability, driver-assistance intervention and overly soft body control** among the main weaknesses. Australian owner communities also repeatedly discuss preference persistence, quicker access to assistance settings, multi-driver profiles, cup-holder fit and software details. At the same time, owners report that OTA updates have improved parts of the experience. The more defensible product-definition response is therefore not to freeze the issue as “bad software”, but to treat **local defaults, preference persistence, shortcuts and multi-driver use** as continuous localisation and validation work.

The chassis question uses the same evidence discipline. Professional review records noticeable vertical movement on undulating roads, while owner sentiment is not uniform. The project therefore does not jump straight to “replace the suspension”. It makes **ANZ real-road chassis validation** a Must: test primary body control and steering feel on representative Auckland / Wellington and Sydney / Melbourne roads before deciding whether a regional calibration change is justified.

## Product-definition output

The final requirements avoid invented composite scores such as 87 or 92. They use three priorities that remain explainable in an interview or product review.

**Must — ANZ software and drive-setting localisation.** Validate whether drive preferences persist reliably, whether high-frequency ADAS settings can be reached quickly, and whether two-driver households can switch profiles smoothly. The next step is a task test with 12–15 current owners, measuring preference persistence after restart, taps required for common settings and successful two-user switching.

**Must — ANZ local-road chassis validation.** Use representative urban joints, undulating suburban roads and highway surfaces for A/B evaluation, observing secondary oscillation after a road input, on-centre steering feel and occupant comfort. Only a consistent result should turn into a calibration recommendation.

**Should — New Zealand: test a Complete Extended Range step-up.** Do not automatically replace the NZ$49,990 60 kWh Complete with a larger battery because the entry price is itself a competitive asset. A more useful test is to bring the Complete ER combination already used in Australia into New Zealand between Complete and Inspire, then validate whether “more range without the full comfort package” supports an additional SKU.

**Should — Australia: strengthen Inspire's road-trip differentiation.** With ATTO 3 EVO Premium bringing 510 km / 220 kW DC into a nearby price point, the next Inspire research priority should be range, charging and software experience rather than simply adding more comfort equipment that does not improve the long-distance task.

**Explore — shared-family ownership and small utility details.** Multi-user app access, trip-energy visibility and cup-holder/storage issues are only directional community signals. Start with two-driver household interviews and a 7-day diary study before deciding whether the response belongs in OTA, accessories or a later model-year hardware change.

## Project limits

This is an independent public-data case, not an internal Geely project, and it does not use internal sales dashboards, real cost data, engineering feasibility, supply-chain constraints or non-public customer data. Outputs such as “Complete Extended Range for New Zealand” are therefore **product concepts to validate**, not statements of a real company decision.

Before a production plan, the analysis would still need regional sales and trim mix, price sensitivity, parts and homologation cost, charging behaviour, dealer input, structured user research and engineering validation. The value of the case is the decision chain from public evidence to testable product requirements—not pretending that public sources replace internal product-definition work.

### Reproducible data

- [Competitor benchmark CSV](../../../data/geely-ex5-anz-product-definition/benchmark.csv)
- [User evidence and product requirements CSV](../../../data/geely-ex5-anz-product-definition/evidence-requirements.csv)
- The interactive page retains source and price-basis fields so the snapshot can be updated when model year, price or OTA status changes.
