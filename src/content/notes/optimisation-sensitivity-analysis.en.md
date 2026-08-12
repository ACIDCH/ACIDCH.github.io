---
translationKey: optimisation-sensitivity-analysis
locale: en
slug: optimisation-sensitivity-analysis
title: Optimisation Sensitivity Analysis
summary: Treat the optimal solution as a starting point by valuing additional resources, identifying limiting constraints and testing how parameter changes affect the recommended decision.
tags:
  - sensitivity analysis
  - shadow prices
  - slack
topics:
  - Supply Chain Optimisation
  - Management Decisions
tools:
  - Excel Solver
  - Python
  - PuLP
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 4
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - constrained-optimisation
---

## The most useful questions often begin after optimisation

The optimization model gives an optimal solution, but it does not mean that the analysis is over. When it comes to management decisions, the more common questions are:

```text
如果材料再多 10 单位，结果会改善多少？
人工多一点有没有价值？
单位贡献发生变化，原来的产品组合还会不会保持不变？
某条约束虽然存在，但它真的在限制当前方案吗？
```

These issues all belong to sensitivity analysis, which is sensitivity analysis.

It is concerned not with re-telling the model from scratch, but with observing how the model reacts when the input changes. An optimal solution that is very sensitive to small changes and a solution that remains stable over a wide range have completely different management implications.

<div data-learning-slot="feasible-region-sensitivity"></div>

## Begin by identifying binding constraints and slack

The two-product model from the previous section is:

\[
\max Z=42x_C+58x_P
\]

constraint:

\[
3x_C+4x_P\le240
\]

\[
2x_C+5x_P\le250
\]

The optimal solution is:

\[
x_C=\frac{200}{7}\approx28.57
\]

\[
x_P=\frac{270}{7}\approx38.57
\]

Both resource constraints have exactly the same sign, so materials and labor are both binding constraints, and slack is both 0.

This shows that the current optimal solution indeed uses both types of resources to the limit. If there is a lot of slack for a constraint, then simply adding this resource will usually not immediately increase the target value because the model has not yet used it.

The first sensitivity question is therefore not found in a complex report: **Which resources actually limit the current solution?**

## A shadow price values one additional unit of a resource

For RHS constraints in linear programming, shadow price can be understood as: near the current optimal structure, if the right end of the constraint is relaxed by 1 units, how much the optimal target value will change approximately.

For example material constraints are:

\[
3x_C+4x_P\le240
\]

If its shadow price is a positive number, it means that adding a little more material can increase the maximum contribution.

Assuming that the shadow price is 4.2, then the part can be read as:

```text
材料容量 +1
→ 最优目标值约 +4.2
```

If the true cost of purchasing an additional 1 unit of material is less than 4.2, and other conditions remain unchanged, then this resource may be worth purchasing.

This is where shadow price is very useful: it converts a mathematical dual information into the marginal value of a resource.

## A shadow price is local, not permanent

The most common way to misuse shadow price is to treat it as a fixed value that does not change with a range.

It usually only holds within a local scope. As the material continues to increase, the optimal corner point may move, another constraint may become a new bottleneck, and the original shadow price will lose its applicability.

Therefore, a more complete statement is:

> Within the current model structure and allowed RHS variation, increasing one unit of this resource has a marginal impact on the optimal target value of approximately a certain value.

Although this sentence is a little longer than "Material value 4.2", it is much more accurate.

## Compare willingness to pay with the real procurement cost

Sensitivity analysis can give an upper bound on a resource's willingness-to-pay.

If an additional 1 unit of labor capacity increases contributions by up to 6, then in theory no more than a net cost of 6 should be paid to increase this unit of capacity.

But real purchases are often not continuous 1 units. May require:

```text
一次增加 40 小时
整班加班
一次租用一台设备
签一份最低采购合同
```

At this time, you cannot simply multiply the shadow price by the quantity to get the accurate value. It is necessary to confirm that this quantity is still within the local effective range and take into account fixed costs, integer decisions and other resource linkages.

Shadow price is more suitable for answering "is it worth it at the margin?" Large expansions usually require resolving the entire model.

## Right-hand-side changes move the feasible-region boundaries

The material capacity is increased from 240 to 250, which is equivalent to:

\[
3x_C+4x_P=240
\]

Move parallel outward to:

\[
3x_C+4x_P=250
\]

The feasible region is thus expanded.

If the original material constrains the binding, the new optimal point is likely to move and the target value may rise. But how much it rises depends on whether artificial constraints become tighter at the same time.

This is the linkage between constraints. You can't just look at "the material has increased by 10", but also look at which boundary the new optimal point will hit.

Drawing graphs in two-dimensional problems is intuitive; high-dimensional models require re-solving and sensitivity reporting to observe.

## Objective-coefficient changes alter the preferred product mix

Sensitivity analysis not only targets the upper limit of resources, but also changes the coefficients in the objective function.

The original goal was:

\[
42x_C+58x_P
\]

If the unit contribution of Premium decreases from 58 to 48, the slope of the objective function changes and the optimal product mix may also change.

A change in the target coefficient does not move the feasible region, it changes which direction is more attractive within the same feasible region.

Therefore, the two changes can be understood separately:

```text
RHS 改变
→ 可行域变了

目标系数改变
→ 对同一可行域的偏好变了
```

This distinction is important when reading sensitivity reports.

## Switching points reveal decision-relevant thresholds

What management is often really concerned about is: to what extent will the optimal decision-making shift after the parameters change?

For example, Premium unit contribution slowly decreases from 58. Maybe the optimal combination remains unchanged at 58, 55, and 52, and suddenly switches to another corner point near 49.

This critical position can be understood as a switch point.

If the current predicted value is far away from the switch point, it means that the plan is relatively stable; if it is only a little bit away from the switch point, the plan will be changed, the decision-making is more sensitive, and the parameters need to be verified more carefully.

Therefore, sensitivity analysis is best not only to report "how much the target value changes", but also to observe whether the decision variable has changed its structure.

## Use one-at-a-time and combined scenarios for different questions

One-at-a-time (OAT) analysis changes only one parameter at a time:

```text
材料容量 +10
其他不变
```

Its advantage is that it is clearly explained and it is easy to see the impact of a single parameter.

But reality changes usually don’t happen in isolation. For example, when demand increases, overtime costs may also increase; when supply is tight, material prices and delivery times may change together.

Therefore, after OAT, a small number of business-meaningful combination scenarios should be done:

```text
高需求 + 低产能
高需求 + 高加班成本
供应受限 + Premium 贡献下降
```

The purpose of combining scenarios is not to exhaust all possibilities, but to check whether the model suddenly becomes unstable under a truly dangerous or critical combination of conditions.

## Record input and decision changes in the same table

To make the analysis reviewable, you can record for each scenario:

| scene              | Change parameters | target value |  Core | Premium | Binding constraints |
| ------------------ | ----------------- | -----------: | ----: | ------: | ------------------- |
| Base               | none              |      3437.14 | 28.57 |   38.57 | Material, Labour    |
| Material +10       | RHS +10           |            … |     … |       … | …                   |
| Premium value -10% | 58 → 52.2         |            … |     … |       … | …                   |

This way readers don't need to piece together their own conclusions from multiple Solver outputs.

The most important thing is to document both the "outcome value" and the "decision structure". The target value only changes by 1%, but the product mix is ​​completely changed, and the management significance may be greater than the target value itself.

## LP sensitivity results do not transfer directly to integer models

Classic shadow price and allowable range are mainly based on the continuous solution structure of linear programming.

The situation becomes even more dramatic if the model contains binary or integer variables. For example, multiple 1 units of capacity may be completely worthless until the target suddenly changes when the capacity is sufficient to open a new route or allow for one more vehicle.

In this discrete model, a more reliable approach is usually:

```text
改变参数
→ 重新求解
→ 比较目标值和决策变量
```

Instead of directly treating the shadow price of continuous LP as the precise marginal value of MILP.

## Nonlinear models require careful interpretation of local margins

Non-linear goals or constraints will make the marginal value change more significantly with location.

For example, the larger the capacity, the faster the congestion cost increases, so the value of "adding another 1 unit capacity" is not a constant.

At this time, the local derivative is still meaningful, but it cannot cover a large range of variation with a fixed number. Analysis is better suited to combining curves, numerical scenarios and re-optimization results.

The core of sensitivity analysis is not a specific report, but understanding the response relationship between input changes and optimal decisions.

## Stress tests expose vulnerabilities in the recommended solution

Before formally giving advice, key parameters can be deliberately pushed in an unfavorable direction:

- Capacity is lower than planned 10%;
- Unit contribution 15% lower than forecast;
- A key resource suddenly decreases;
- Demand increases simultaneously;
- A transport route is temporarily unavailable.

If the recommended solution remains roughly the same under these reasonable pressures, the decision is relatively robust.

If a small change causes the target value to plummet or the scheme to switch completely, it is not that the model has "failed", but that it has discovered a real vulnerability. This information is often more valuable to management than the best numbers in the baseline scenario.

## A practical sequence for sensitivity analysis

1. Let’s look at slack and binding constraints first;
2. Continuous LP constraints on binding read shadow price;
3. Compare the shadow price with the real resource procurement cost;
4. Change the RHS and observe how the feasible region and optimal solution move;
5. Change the key target coefficients and find possible switch points;
6. Make OAT scenarios and add a small number of combined scenarios;
7. Directly resolve integer or nonlinear models;
8. Use stress test to check whether the recommended solution is fragile;
9. Record input, target values, and decision changes in the same sensitivity record.

Sensitivity analysis ultimately asks: **How reliable is this optimal solution, and under what conditions should the decision change?** It turns a static optimum into evidence for management judgement.
