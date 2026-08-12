---
translationKey: retirement-monte-carlo
locale: en
slug: retirement-monte-carlo
title: Retirement Savings Monte Carlo Model in Excel
summary: Use 25 years of salary, contribution, portfolio-return and inflation assumptions to compare retirement-balance distributions, target-attainment probabilities and parameter sensitivity.
tools:
  - Excel
  - Monte Carlo
  - Scenario Analysis
  - Sensitivity Analysis
topic: analytics
status: completed
featured: true
tags:
  - Monte Carlo
  - Simulation
  - retirement planning
  - superannuation
  - scenario analysis
updatedAt: 2026-07-30
---

## Project overview

The model builds a 25-year path from salary growth, annual contributions, portfolio returns and inflation, using 5,000 Monte Carlo trials to observe the distribution of retirement balances and the probability of meeting the target. Baseline inputs are an initial salary of NZD 95,000, a total contribution rate of 7.5%, mean salary growth of 2.8%, mean portfolio return of 6.12%, return volatility of 10% and inflation of 2%.

## Target and calculation

The current annual spending target is NZD 125,000, which becomes NZD 205,075.75 in the first retirement year after inflation. At a 4% withdrawal rate, the required capital is about NZD 5.13 million. Each path updates salary, contributions and the balance annually, while recording nominal balance, real purchasing-power balance and the first-year withdrawal amount.

## Baseline results

The baseline simulation produces a mean nominal balance of NZD 552,670.63 and a mean real balance of NZD 336,869.81. The 95% interval is NZD 294,058.79–967,300.62 for the nominal balance and NZD 179,237.91–589,599.59 for the real balance. Mean first-year retirement income is NZD 10,120.09 and the probability of meeting the target is 0%.

## Scenario analysis

Fixed scenarios vary return and contribution assumptions separately. The displayed balance is NZD 1,600,000 in the base scenario, NZD 2,200,000 when the return rises to 7.3%, and NZD 2,900,000 when the contribution rate rises to 15%. A downside scenario with a 5% return, 7.5% contribution rate and 2% salary growth produces NZD 1,100,000. All 4 scenarios remain below the target capital.

## Interpretation and limitations

The result distribution is right-skewed, so a single mean cannot replace the interval or failure probability. Normally distributed inputs, fixed inflation and the chosen withdrawal rate are planning assumptions rather than market guarantees; tax, investment fees, policy changes and the actual asset allocation belong in formal advice. The scenarios identify the contribution rate as the most direct controllable lever, but they do not constitute personalised financial advice.
