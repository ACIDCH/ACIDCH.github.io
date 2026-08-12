---
translationKey: transportation-models
locale: en
slug: transportation-models
title: Supply Chain Transportation Planning
summary: Connect long-term network design, mid-term carrier contracts and short-term shipment allocation through capacity, minimum commitments and flow balance for an 860-unit requirement.
tags:
  - transportation
  - supply chain planning
  - network flow
topics:
  - Supply Chain Optimisation
  - Transportation Decisions
tools:
  - Excel Solver
  - Python
  - PuLP
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 9
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes:
  - multidimensional-optimisation
---

## Begin by identifying the decision horizon

"Reducing transportation costs" seems like one problem, but it may actually correspond to completely different decisions.

Some decisions are adjusted only once every few years, such as where to build a warehouse and whether to add a new distribution center; some are adjusted quarterly or annually, such as selecting a carrier and how much contract capacity to reserve; and some are rearranged daily or weekly, such as how many goods will be shipped per route today.

These three types of problems can all be optimized, but the variables and constraints in the models are different. If the time scale is clearly distinguished first, the subsequent modeling will be much simpler.

The three common levels are:

```text
战略层 Strategic
→ 长期网络结构

战术层 Tactical
→ 中期容量和合同

运营层 Operational
→ 短期流量和履约
```

<div data-learning-slot="planning-horizon"></div>

## Strategic decisions define warehouses and network structure

Decisions at the strategic level usually have a long impact, require large fixed investment, and are not easy to regret.

For example:

```text
是否开启 Central Hub？
是否开启 Harbour Hub？
每个枢纽配置多少容量？
哪些区域由哪个节点覆盖？
```

Candidate facilities can use binary variables:

\[
y_h\in\{0,1\}
\]

For flow rate, use continuous variables:

\[
x_{h,r}\ge0
\]

If a facility is closed, it cannot let traffic through:

\[
\sum_r x_{h,r}\le Capacity_h\cdot y_h
\]

The objective function usually includes both fixed opening costs and transportation costs:

\[
\min \sum_h F_hy_h+\sum_h\sum_r c_{h,r}x_{h,r}
\]

This way network selection and traffic distribution are put into the same MILP.

## Tactical decisions allocate contracts and capacity

Once facility locations are determined, the question often turns to carriers and contract capacity.

For example:

```text
要不要签 Carrier A？
给 A、B、C 各分多少货？
最低承诺量能不能满足？
某家承运商最多能接多少？
```

These decisions typically don't change from day to day, but are much more flexible than building a warehouse.

Common restrictions in contracts include:

```text
minimum volume
maximum capacity
unit transport cost
```

Putting these conditions together, it is a classic carrier allocation problem.

## A carrier-allocation example for 860 units

Assume the total transportation demand is:

\[
860
\]

There are three carriers:

| Carrier | minimum amount | maximum amount | unit cost |
| ------- | -------------: | -------------: | --------: |
| A       |            180 |            420 |       7.2 |
| B       |            120 |            360 |       6.7 |
| C       |              0 |            300 |       7.8 |

set up:

\[
x_A,x_B,x_C\ge0
\]

Aggregate demand must be allocated in its entirety:

\[
x_A+x_B+x_C=860
\]

Contract upper and lower bounds:

\[
180\le x_A\le420
\]

\[
120\le x_B\le360
\]

\[
0\le x_C\le300
\]

The goal is to minimize transportation costs:

\[
\min 7.2x_A+6.7x_B+7.8x_C
\]

Because B has the lowest unit cost, the model will give priority to B; but B can only afford 360 at most, so the remaining quantity must be divided between A and C.

## Minimum commitments overturn the cheapest-carrier rule

If you only look at the unit cost, it is easy to think of giving as much goods to B first, then to A, and finally to C.

Real contracts are often not that simple. If you sign A, you may need to give it at least 180; if there is still an activation cost, you need to add a binary variable to connect "sign or not" with "how much to divide".

Even without a binary variable, the minimum quantity itself changes the feasible space.

So transportation allocations cannot just be ordered by unit cost, but also by meeting contracts, capacity, and total demand.

## Compare feasible allocations for the example

A set of assignments that satisfy the constraints is:

```text
Carrier A = 300
Carrier B = 300
Carrier C = 260
```

Total amount:

\[
300+300+260=860
\]

cost:

\[
300(7.2)+300(6.7)+260(7.8)=6198
\]

Each family is within its own upper and lower bounds:

```text
A: 180 ≤ 300 ≤ 420
B: 120 ≤ 300 ≤ 360
C:   0 ≤ 260 ≤ 300
```

This set of numbers is ideal for model verification: demand balance, contract boundaries and total costs can all be recalculated independently.

<div data-learning-slot="supply-chain-flow"></div>

## Flow balance is the foundation of a transportation model

Whether the problem is from suppliers to factories, factories to warehouses, or warehouses to customers, the core is inseparable from flow balance.

The simplest area demand constraint is:

\[
\sum_k x_{k,r}\ge demand_r
\]

If it must be just enough and no oversupply is allowed, it can be written as:

\[
\sum_k x_{k,r}=demand_r
\]

When the node has a supply limit:

\[
\sum_r x_{k,r}\le capacity_k
\]

One of these two sets of constraints controls "how much is sent out" and the other controls "how much is received".

If there is a lack of balance constraints, the model can easily give an "optimal solution" that is very low-cost but does not meet the needs at all.

## Create variables only for routes that exist

Assume that North Plant can deliver to Metro, Coast, and Inland, while South Plant can only serve Coast and Inland.

If the model automatically builds all factory-region combinations into variables, it will generate a South→Metro route that does not exist in reality.

There are two ways to deal with it:

```text
不创建非法路线变量
```

or:

\[
x_{south,metro}=0
\]

Large models are often better suited to the former, where variables are created only for valid arcs.

The network structure should be defined by real feasible routes rather than automatically guessed by Cartesian products.

## Strategic, tactical and operational decisions must remain connected

If the strategic layer has determined that a warehouse is closed, the tactical layer should not assume that it is available.

If the tactical contract reserves only 300 units of capacity to Carrier B, the operations layer cannot directly allocate 500 for a given week unless the model explicitly allows for the temporary purchase of additional capacity.

There should be clear input and output relationships between the three levels:

```text
战略结果
→ 网络和长期容量

战术结果
→ 合同和可用资源

运营结果
→ 在这些边界内安排实际流量
```

In this way, each layer only solves the problems it should solve and will not conflict with each other.

## Network design and flow allocation use different cost structures

Facilities networks often include fixed costs:

```text
开仓成本
长期租赁
设备投入
```

Transportation flow is more of a variable cost:

```text
每单位运输费
每公里成本
燃油附加费
```

If the model only counts traffic costs, it may tend to open many facilities because there is no price paid for the facilities themselves.

On the other hand, looking only at fixed costs may compress the network into over-concentration, resulting in high transportation costs and service distances.

What the strategic network model has to do is to find a balance between fixed structure costs and subsequent traffic costs.

## Service requirements can be modelled as constraints

Lowest cost is not always the only goal.

Supply chains often also require:

```text
每个区域必须被覆盖
平均距离不能太高
关键客户必须由特定节点服务
某些区域需要两个备选来源
```

These requirements can be written as constraints or put into the objective function through penalties.

Which method to choose depends on how rigid the business rules are. If "must cover" is a real service commitment that cannot be violated, it is more suitable as a constraint rather than giving a penalty that can be offset by costs.

## Higher capacity utilisation is not always better

Models often push cheaper nodes to capacity because this reduces current costs.

But in the long term, 100% utilization may not have any buffer. Once demand rises, equipment breaks down, or shipments are delayed, there is no room for adjustment.

Therefore, management may proactively set the available capacity to 90% or 95% of the rated capacity, using the remainder as protection margin.

This is not "deliberately making the model suboptimal", but writing realistic reliability requirements into the model boundaries.

## Results must extend beyond a variable table

The easiest thing to get after solving is a lot:

```text
x[north,metro] = ...
x[north,coast] = ...
x[south,inland] = ...
```

A more useful way to organize it is to answer:

- Which nodes are enabled;
- How much total traffic does each node carry?
- which routes are actually used;
- which carrier reaches the cap;
- What is the total shipping cost;
- Which constraints binding;
- Which areas lack alternative routes.

Variables are the output of the solver, and nodes, routes, and resource bottlenecks are the results of the analysis.

## Scenario analysis is more useful than one network solution

Supply chain parameters can easily change:

```text
需求 +10%
某仓库容量下降
某承运商价格上涨
一条路线中断
新设施固定成本变化
```

Each scenario can be resolved to see if the network or distribution changes.

If a small cost change causes a complete carrier switch, the current allocation is sensitive; if a facility remains open through multiple demand scenarios, its long-term value is more stable.

This type of information is often better suited to supporting long-term decision-making than a single cost number for a baseline scenario.

## A practical transportation-modelling sequence

1. First determine whether the problem belongs to the strategic, tactical or operational level;
2. Define network nodes, legal routes and planning cycles;
3. Identify fixed costs, unit flow costs and capacity;
4. Write supply, demand, and flow balances;
5. Write the minimum commitment, maximum carrying capacity and service requirements into the model;
6. If there is an opening decision, use binary variable and linking constraint;
7. After solving, independently check the total demand and total cost;
8. Aggregate high-dimensional variables into node, route, and carrier-level results;
9. Check if the scenario is stable using demand, cost and disruption scenarios.

Transportation models often fail because they mix decisions from different horizons, not because the formulae are difficult. Establish whether the decision concerns the network, a contract or today's flows before defining variables and constraints. The model can then match the operational question.
