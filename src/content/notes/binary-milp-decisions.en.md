---
translationKey: binary-milp-decisions
locale: en
slug: binary-milp-decisions
title: Binary Decisions and MILP
summary: Model yes-or-no choices such as facility openings with binary variables, fixed costs, linking constraints and carefully chosen Big-M values, then interpret MILP solution quality.
tags:
  - MILP
  - binary variables
  - fixed charges
topics:
  - Supply Chain Optimisation
  - Decision Modelling
tools:
  - Excel Solver
  - Python
  - PuLP
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 5
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes:
  - optimisation-sensitivity-analysis
---

## Some decisions are inherently yes-or-no choices

Continuous variables are great for expressing production volumes, shipments, inventory, and hours worked, but there is an entirely different class of options in the supply chain:

```text
这个仓库开不开？
这个供应商选不选？
这条运输路线启不启用？
这台设备买不买？
```

These choices cannot be expressed in terms of 0.37 repositories or 0.62 "opens." The most natural variable is a binary variable:

\[
y\in\{0,1\}
\]

Usually agreed:

```text
y = 1 → 开启 / 选择 / 启用
y = 0 → 关闭 / 不选 / 不启用
```

Once such discrete variables appear in the model, it moves from ordinary LP to Mixed Integer Linear Programming, also known as MILP.

<div data-learning-slot="fixed-charge-milp"></div>

## Fixed costs require binary variables

Assume that the Central Hub's fixed turn-on cost is 1450 and its capacity is 620.

Fixed costs are difficult to express correctly if only the continuous flow variable x is used to represent the volume of goods passing through the hub. cannot be written as:

\[
1450x
\]

Because 1450 is "paid once as soon as it is opened", not every unit transported.

A more appropriate approach would be to add:

\[
y_{central}\in\{0,1\}
\]

Then write fixed costs as:

\[
1450y_{central}
\]

The cost is 0 when y=0; the cost is 1450 when y=1. This structure exactly complies with the "opening fee" business rules.

Harbor Hub can also be defined similarly:

\[
y_{harbour}\in\{0,1\}
\]

Fixed costs are:

\[
1120y_{harbour}
\]

## Link activation decisions to continuous flows

If the model only writes fixed costs but does not limit the relationship between flow rate and y, the solver may get an absurd solution:

```text
hub 不开启
但仍然有货物流过
```

So linking constraint must be added.

For Central Hub:

\[
x_{central}\le620y_{central}
\]

when:

\[
y_{central}=0
\]

The right side is 0, so:

\[
x_{central}=0
\]

Traffic cannot be distributed while the facility is closed.

when:

\[
y_{central}=1
\]

The constraints become:

\[
x_{central}\le620
\]

Once the facility is turned on, flow can vary freely within capacity.

This is the core function of linking constraint: to tie "whether it is enabled" and "how much it can be used" together.

## Physical capacity is often the best Big-M

Many logical constraints will be written as:

\[
x\le M\,y
\]

M here is a large enough upper bound, so it is often called Big-M.

The problem is, bigger M is not safer.

If the real maximum capacity of the Central Hub is clearly 620, but write:

\[
x_{central}\le1{,}000{,}000y_{central}
\]

The mathematics may still be correct, but the LP relaxation will become very relaxed, it will be more difficult for the solver to exclude unreasonable fractional solutions, and the numerical stability may become worse.

Therefore, when the real business upper bound can be used, the real capacity can be used directly:

\[
x_{central}\le620y_{central}
\]

This is a better modeling practice than "just find a really big M."

## LP relaxation can open 0.4 of a warehouse

A MILP solver will usually look at a relaxed continuation problem and put:

\[
y\in\{0,1\}
\]

Temporarily relaxed to:

\[
0\le y\le1
\]

This is called LP relaxation.

In the relaxation model, it is possible:

```text
y = 0.4
```

It is not the final executable answer, but information used during the solution process to establish upper and lower bounds.

If the linking constraint is written too loosely, y=0.4 may allow a large amount of traffic to pass through, resulting in a large gap between relaxation and the true integer model. The solver then needs more branch-and-bound work to exclude fractional solutions.

This is why formulation strength is important.

## The same business rule can have strong or weak formulations

Assume that traffic x cannot exceed 620 in any case.

Write:

\[
x\le620y
\]

Usually better than:

\[
x\le1000000y
\]

Stronger because it more accurately describes the feasible range.

A strong formulation does not change the integer feasible solutions, but makes LP relaxation closer to the real integer problem, thereby reducing solver searches.

In large-scale MILP, a slow model does not necessarily mean "the algorithm is not good". Sometimes it is just that the logical constraints are too wide.

## Minimum usage can also depend on activation

Some contracts are not "can be used after opening 0 up to the capacity limit", but as long as they are enabled, they must reach a minimum amount.

For example, if a supplier is selected, it will be allocated at least 180 units and at most 420 units:

\[
180y_A\le x_A\le420y_A
\]

When yA=0:

\[
x_A=0
\]

When yA=1:

\[
180\le x_A\le420
\]

In this way, a pair of upper and lower bounds writes the minimum commitment amount and the maximum capacity into the model at the same time.

This type of structure is common in carrier contracts, production batches, equipment startup and shutdown, and purchasing agreements.

## Encode logical relationships directly in MILP

Binary variables are not only used to represent fixed costs, but also to express many business rules.

### Choose at most one of the two options

\[
y_A+y_B\le1
\]

### Choose at least one

\[
y_A+y_B\ge1
\]

### Choose exactly one

\[
y_A+y_B=1
\]

### Only by choosing A can you choose B

If B depends on A:

\[
y_B\le y_A
\]

### A and B must appear together

\[
y_A=y_B
\]

These relationships seem simple, but they really put the rules that could only be written in text descriptions into the feasible domain.

## Fixed-charge models create scale thresholds

There are fixed costs to pay to open the facility, so the model trades off two forces:

```text
不开设施
→ 没有固定成本
→ 但可能使用更贵的运输路线

开启设施
→ 先支付固定成本
→ 之后可能获得更低的单位流量成本
```

Therefore, whether a facility is worth opening often depends on whether the traffic is large enough.

When demand is low, fixed costs are not spread thinly and closure is more cost-effective; when demand increases, a new hub may suddenly become the optimal choice.

This "sudden switch" is where the integer model is very different from the continuous LP. Decisions don't always change smoothly, bit by bit.

## Re-solve MILP scenarios to assess sensitivity

In linear programming, shadow price can provide very clear local marginal information. But when a binary variable is included, adding a few resources may not immediately change the result.

For example, if the demand increases from 610 to 611, it may still not be worth opening a new facility; after the demand reaches a certain threshold, the facility suddenly changes from 0 to 1, and the target value structure also changes together.

Therefore, when doing sensitivity analysis on MILP, the more practical method is usually:

```text
改参数
→ 重新求解
→ 比较 y 的开关状态、连续变量和目标值
```

Pay special attention to the switch point, where the decision jumps from 0 to 1.

## Symmetry creates duplicate search work

If two facilities are identical in all parameters, the model may have a symmetric solution:

```text
开 A、关 B
```

and:

```text
关 A、开 B
```

The target values ​​are exactly the same.

This is fine for the business, but for the solver it can mean exploring many branches that are essentially the same.

This repetitive search can be reduced in large models through sensible numbering, slight business differentiation, or symmetry-breaking constraints. However, in small models, there is no need to deliberately add constraints for the sake of "technically advanced". First confirm that there is really a performance problem.

## Record solver status, time limit and optimality gap

MILP should not just output a set of variable values.

A more complete result would be to know at least:

```text
Solver status
Objective value
Time used
Optimality gap（如果有）
```

If the solver finds a good but not globally optimal solution before the time limit, this is not the same thing as formally `Optimal`.

In large-scale problems, it may be more reasonable to accept a solution with a 1% gap than to add several hours of computation to pursue the theoretical optimum. The key is to publicly record this, rather than writing "currently the best solution" as "proven optimal."

## Implement a binary linking structure in PuLP

For example:

```python
import pulp as pl

model = pl.LpProblem("hub_choice", pl.LpMinimize)

flow = pl.LpVariable("flow", lowBound=0)
open_hub = pl.LpVariable("open_hub", cat="Binary")

model += 1450 * open_hub
model += flow <= 620 * open_hub
```

A real model will still have requirements, transportation costs, and other facilities, but the structure is already clear:

```text
open_hub
→ 决定设施是否存在

flow
→ 决定使用多少

flow <= capacity × open_hub
→ 把两者连接起来
```

The more complex the code, the more important this structured naming becomes.

## A practical MILP inspection sequence

1. First identify which decisions are truly discrete;
2. Define binary / integer variables instead of rounding afterwards;
3. Fixed costs are only multiplied by the turn-on variable;
4. Use linking constraint to prevent "close but still use";
5. Big-M tries to use true tight upper bounds;
6. Check minimum usage, mutual exclusion and dependency logic;
7. View solver status and optimality gap;
8. Solve the problem again when doing parameter scenarios and observe whether the switch status changes;
9. If solution is slow, check formulation strength and symmetry again.

The value of MILP is that it allows the model to say a very realistic sentence: **Some choices cannot be made half way. ** As long as these switching decisions and continuous flows are properly connected, facilities, contracts, and routing can all fit into the same optimization framework.
