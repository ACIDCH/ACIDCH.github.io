---
translationKey: multi-period-production-inventory
locale: en
slug: multi-period-production-inventory
title: Multi-period Production and Inventory Optimisation
summary: Compare make-to-demand, level-production and batch-production plans across four periods to understand inventory balance, setup costs, capacity and rolling planning.
tags:
  - multi-period planning
  - inventory
  - production planning
topics:
  - Supply Chain Optimisation
  - Production and Inventory
tools:
  - Excel Solver
  - Python
  - PuLP
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 10
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - inventory-optimisation
relatedNotes:
  - transportation-models
---

## Multi-period decisions carry consequences into the future

The single-period production model only needs to ask: How much is produced in this period?

After adding time, the problem immediately becomes different. The excess production today will not disappear, but will become the next period's inventory; the less production today may also leave a shortage or backorder. One setup may also cover needs for several periods in the future.

So what the multi-period model really connects is a series of states:

```text
期初库存
+
本期生产
-
本期需求
=
期末库存
```

The ending inventory becomes the next period's opening inventory.

<div data-learning-slot="supply-chain-flow"></div>

## Inventory balance links consecutive periods

set up:

\[
I_t=\text{时期 t 的期末库存}
\]

\[
Q_t=\text{时期 t 的生产量}
\]

\[
D_t=\text{时期 t 的需求}
\]

The most basic inventory balance is:

\[
I_t=I_{t-1}+Q_t-D_t
\]

This formula truly connects adjacent periods.

If P1 produces 40 more units, P1's ending inventory will be 40 more; by P2, this 40 will become available supply and no new production will be needed.

If the multi-period model just puts four single-period models side by side without this inter-temporal balance, no real time relationship can be established.

## Compare three production plans across four periods

Current requirements are:

| period | need |
| ------ | ---: |
| P1     |  180 |
| P2     |  260 |
| P3     |  150 |
| P4     |  310 |

Total demand:

\[
180+260+150+310=900
\]

The production cost per unit is 12, the setup cost for starting production each time is 420, and the holding cost per unit of ending inventory is 1.2.

This set of data allows comparison of three very intuitive plans:

```text
Demand-match
→ 每期刚好生产当期需求

Smooth
→ 每期生产 225

Batch
→ P1 生产 440，P3 生产 460
```

All three plans ultimately offer 900 units, but have completely different cost structures.

## Make-to-demand minimises inventory but requires frequent setups

Demand-match plan:

```text
P1 180
P2 260
P3 150
P4 310
```

The production quantity of each period is exactly equal to the demand, so the inventory is always 0.

Production cost:

\[
900\times12=10800
\]

There is production in four epochs, so the number of setups is 4:

\[
4\times420=1680
\]

There is no holding cost, so the total cost is:

\[
10800+1680=12480
\]

This is a very "clean" plan: no advance production and no inventory, but it took four setups.

## Level production stabilises output but creates inventory

Total demand 900, averaged over four periods:

\[
900/4=225
\]

Smooth plans to produce 225 per issue.

Stock changes:

```text
P1: 0 + 225 - 180 = 45
P2: 45 + 225 - 260 = 10
P3: 10 + 225 - 150 = 85
P4: 85 + 225 - 310 = 0
```

Ending inventory accumulation:

\[
45+10+85+0=140
\]

holding cost：

\[
140\times1.2=168
\]

It is still produced per issue, so the setup cost is also 1680.

Total cost:

\[
10800+1680+168=12648
\]

Smooth planning is more stable than on-demand production, but under this set of cost parameters, the inventory costs brought about by stable production make the total cost higher.

## Batch production exchanges higher inventory for fewer setups

Batch plan:

```text
P1 440
P2 0
P3 460
P4 0
```

Stock changes:

```text
P1: 0 + 440 - 180 = 260
P2: 260 + 0 - 260 = 0
P3: 0 + 460 - 150 = 310
P4: 310 + 0 - 310 = 0
```

Total holding units:

\[
260+0+310+0=570
\]

holding cost：

\[
570\times1.2=684
\]

Only produced on P1 and P3, so the number of setups is 2:

\[
2\times420=840
\]

The production cost is still 10800.

Total cost:

\[
10800+840+684=12324
\]

Under current parameters, Batch is the least expensive of the three plans.

## Why the lowest-cost plan favours batch production

The total production quantity of the three plans is 900, so the production costs are exactly the same.

The real difference is:

```text
Demand-match
→ setup 多，库存少

Smooth
→ setup 多，也有库存

Batch
→ setup 少，但库存多
```

The current setup cost 420 is relatively high compared to the holding cost 1.2, so the model is willing to produce in advance and hold inventory to reduce the number of starts.

If the holding cost rises significantly, the advantage of Batch will become smaller; if the setup cost is close to 0, on-demand production will become more attractive.

This is the core trade-off of the multi-period production model.

## Setup costs often require binary variables

If the setup cost is paid once for production in a certain period, you can define:

\[
y_t\in\{0,1\}
\]

```text
y_t = 1 → 时期 t 开始生产
y_t = 0 → 时期 t 不生产
```

Objective function added:

\[
\sum_t SetupCost_t\cdot y_t
\]

Use linking constraints again:

\[
Q_t\le M_ty_t
\]

If y=0, Q must be 0; if y=1, Q can be produced within the upper limit.

M is better to use real production capacity, rather than an arbitrary and extremely large number.

## Holding costs should follow the inventory actually carried

If holding cost is calculated based on the ending inventory of each period, the target is:

\[
\sum_t h_tI_t
\]

This means that if a product is stored from P1 to P3, it will experience multi-period holding costs.

So "Producing 100 units ahead of schedule" is not a one-time inventory charge. The earlier the advance is made, the longer the inventory will stay and the higher the total holding cost will be.

This is the key trade-off between batch size and production timing.

## Distinguish lost sales from backorders when shortages are allowed

Some models allow for temporary unmet demand in the current period.

First distinguish two cases.

**Lost sales**: If it is not sold in the current period, it will be lost forever and will not be retained in the next period.

**Backorder**: Unmet demand in the current period will be carried forward and will still have to be delivered in the future.

Backorder can be defined:

\[
B_t\ge0
\]

The balancing formula must also be expanded accordingly, and negative inventory and real inventory cannot simply be mixed into one variable without explanation.

If backlog is allowed, the objective function usually also adds a shortage penalty:

\[
\sum_t p_tB_t
\]

The higher the penalty, the less willing the model is to delay meeting demand.

## Terminal inventory conditions shape late-period decisions

A multi-period model must specify what should happen to the inventory at the end of the planning period.

Common conditions include:

```text
I_T = 0
```

Indicates that it does not want to leave excess inventory at the end of the planning period.

or:

```text
I_T ≥ safety stock
```

Safety stock required for the next period is required to be set aside.

If terminal inventory is completely ignored, and the ending inventory has no value or the cost setting is unreasonable, the model may behave in the last period that is inconsistent with real business.

The terminal condition essentially tells the model that the end of the planning period does not equal the end of the world.

## Capacity constraints increase the value of early and level production

Assume that the P4 demand is 310, but the maximum production capacity of P4 is only 250.

Even if P4 has the lowest single-period production cost, its capacity cannot meet all P4 demand. At least 60 units must be produced earlier and carried into P4 as inventory.

Inventory now serves not only to reduce setup costs but also to cover future capacity shortages.

Multi-period models are particularly well-suited to handle situations where resource constraints in one period can be buffered by lead production in other periods.

## Rolling planning re-optimises as new information arrives

Real businesses rarely know exactly all future needs and costs at the beginning of the year.

A more common approach is rolling horizon:

```text
先优化未来若干期
↓
执行最近一期
↓
拿到新的需求和库存信息
↓
把窗口向前滚动
↓
重新优化
```

This way, long-term plans can retain direction, while near-term plans are continually updated with new information.

Rolling planning does not negate the optimization model, but is more consistent with the way optimization is used: the model is a decision-making tool that is updated repeatedly, not an annual table that is generated once and remains unchanged forever.

## Validate multi-period results with three reconciliations

After solving the problem, it is best to check period by period:

### Inventory balance

\[
I_t-I_{t-1}-Q_t+D_t=0
\]

### Total balance

If both starting and ending stocks are 0:

\[
\sum_t Q_t=\sum_t D_t
\]

The current example is:

\[
900=900
\]

### Cost reconciliation

```text
production cost
+
setup cost
+
holding cost
+
shortage cost（如果有）
```

It should be consistent with the model target value.

These checks can avoid the problem where the variables look reasonable but the intertemporal balance is missing something.

## Compare the three plans directly

| plan         | Setup times | Holding units | total cost |
| ------------ | ----------: | ------------: | ---------: |
| Demand-match |           4 |             0 |      12480 |
| Smooth       |           4 |           140 |      12648 |
| Batch        |           2 |           570 |      12324 |

Batch is the cheapest at current costs, but this is not a general rule.

Change the set of setup costs, holding costs, capacity, or demand, and the optimal plan may change. Therefore, the value of this comparison chart is not to memorize 12324, but to understand how different cost parameters drive plans to move between "produce frequently" and "stock up early."

## A practical multi-period modelling sequence

1. Clarify demand, capacity and production costs for each period;
2. Define production volume and ending inventory;
3. Use inventory balance to connect adjacent periods;
4. If there is setup cost, add binary variable and linking constraint;
5. Decide whether to allow shortage / backorder;
6. Clarify initial inventory and terminal inventory;
7. After solving, check the inventory balance period by period;
8. Independently backcalculate setup, holding and production costs;
9. Change setup cost, holding cost, capacity and demand for scenario comparison;
10. In actual execution, rolling horizon is used to re-optimize with the latest information.

The most worthwhile thing to understand about multi-period production and inventory optimization is not to copy many columns horizontally from a single-period model, but to acknowledge the fact that today's production choices will change how much inventory will be available tomorrow, and will also change what costs will need to be paid in the future. **
