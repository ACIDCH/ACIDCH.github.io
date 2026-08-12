---
translationKey: constrained-optimisation
locale: en
slug: constrained-optimisation
title: Constrained Optimisation
summary: Use two products and two limited resources to construct a feasible region, interpret corner solutions, binding constraints and slack, and understand why optima often occur on a boundary.
tags:
  - constrained optimisation
  - linear programming
  - feasible regions
topics:
  - Supply Chain Optimisation
  - Decision Modelling
tools:
  - Excel Solver
  - Python
  - PuLP
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 3
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - unconstrained-optimisation
---

## Real-life decisions almost always have boundaries

The unconstrained model can first look at the objective function itself, but when it comes to production, transportation or inventory problems, resource constraints will appear immediately.

Materials have an upper limit, labor has an upper limit, warehouses have capacity, vehicles have load capacity, demand may have to be met, and there are minimum service requirements for certain orders. The optimization task then changes from "which is best" to:

> **Of all the options that are allowed to be implemented, which one is the best? **

Constraints are not notes next to the model, they directly define which solutions are eligible for comparison.

<div data-learning-slot="feasible-region-sensitivity"></div>

## Formulate the two-product example

Continue to use Core Kit and Premium Kit.

set up:

\[
x_C=\text{Core Kit 产量}
\]

\[
x_P=\text{Premium Kit 产量}
\]

The unit contributions are 42 and 58 respectively, so the goals are:

\[
\max Z=42x_C+58x_P
\]

Each piece of Core consumes 3 unit material and 2 unit labor; each piece of Premium consumes 4 unit material and 5 unit labor.

Material only 240:

\[
3x_C+4x_P\le240
\]

Artificial only 250:

\[
2x_C+5x_P\le250
\]

Plus:

\[
x_C,x_P\ge0
\]

These formulas together determine which combinations can be produced.

## The feasible region contains every admissible solution

Draw the two resource constraints on the coordinate plane, and two boundary lines will appear.

Material boundaries:

\[
3x_C+4x_P=240
\]

Artificial boundaries:

\[
2x_C+5x_P=250
\]

Each inequality corresponds to one side of the boundary line. Adding the non-negative condition, the final intersection left is the feasible region.

For example:

```text
x_C = 20
x_P = 20
```

Materials used:

\[
3(20)+4(20)=140\le240
\]

Manual use:

\[
2(20)+5(20)=140\le250
\]

So this solution is feasible.

If replaced with:

```text
x_C = 60
x_P = 40
```

The material requirement 340 has exceeded 240, so it is not in the feasible region at all. No matter how high the target value is, it has no meaning in comparison.

## Equalities and inequalities encode different rules

There are two common forms of constraints.

Equation:

\[
x_1+x_2=100
\]

Indicates that a certain balance relationship must be exactly satisfied, for example, the demand is completely covered by two sources.

inequality:

\[
x_1+x_2\le100
\]

Indicates that only 100 can be used at most.

Another kind:

\[
x_1+x_2\ge100
\]

Indicates at least 100.

Wrong choice of symbols will directly change the feasible region. For example, "Use at most 250 working hours" is written as `>=250`. The solver can still calculate normally, but the business meaning is completely reversed.

Therefore, when writing constraints, it is best to first use a Chinese sentence to clearly state "at most", "at least" or "must equal to", and then translate it into symbols.

## Non-negativity constraints must be explicit

Production, shipments and inventories generally cannot be negative, so:

\[
x_C,x_P\ge0
\]

Very natural.

But mathematical models don't automatically understand "The yield cannot be -10". If the default variables of the modeling tool can be negative, and no lower bound is set in the code, the model may use negative numbers to obtain an answer that has no business meaning.

Likewise, some variables require:

```text
integer
binary
upper bound
```

The variable boundaries are part of the model definition and are not an explanation to be added after the solution is completed.

## Linear-programming optima often occur at corner points

In linear programming, the objective function is a set of parallel lines:

\[
42x_C+58x_P=Z
\]

Translate this line in a direction with higher contribution, and the final location where you can still hit the feasible region is usually a corner point or a boundary.

The main corners of the current model include:

```text
(0, 0)
(80, 0)
(0, 50)
两条资源边界的交点
```

Two borders are joined together:

\[
3x_C+4x_P=240
\]

\[
2x_C+5x_P=250
\]

Solution:

\[
x_C=\frac{200}{7}\approx28.57
\]

\[
x_P=\frac{270}{7}\approx38.57
\]

Target value:

\[
Z\approx3437.14
\]

After comparing the corner points, this intersection point is the best.

## A binding constraint has no remaining capacity

Substitute the optimal solution back into the material constraints:

\[
3\left(\frac{200}{7}\right)+4\left(\frac{270}{7}\right)=240
\]

Artificial constraints:

\[
2\left(\frac{200}{7}\right)+5\left(\frac{270}{7}\right)=250
\]

Both are exactly equal to the upper limit, so they are binding constraints on the optimal solution.

Intuitively, both types of resources really limit the current goals. To continue to increase contribution, at least one of the resource boundaries or product economic parameters must be changed.

Binding does not mean "this constraint is the most important", it just means that there is no remaining space at the current optimal point.

## Slack measures unused capacity

For the `<=` constraint, slack can be understood as:

\[
Slack=Capacity-Usage
\]

If a scheme uses only 220 units of material and the capacity is 240, then the material slack is 20.

In the current optimal solution:

```text
Material slack = 0
Labour slack   = 0
```

By contrast, a resource with substantial slack is not currently limiting the solution. Adding more of it will usually not improve the objective because the existing capacity is not fully used.

This is also a very important starting point when doing sensitivity analysis later: first look at which constraints are binding and which resources have margin.

## Numerical tolerances matter when slack is close to 0

Actual solvers use floating point calculations and the results may appear:

```text
239.99999998
```

rather than exactly 240.

Therefore, when judging binding in the program, you should not write directly:

```python
usage == capacity
```

It is more prudent to set a tolerance, for example:

```python
abs(capacity - usage) < 1e-6
```

This is a small technical detail, but it can avoid misjudgment of numerical errors as real slack.

## Redundant constraints increase complexity without changing the solution

Some constraints, although written into the model, are never actually tighter than others.

For example:

\[
x_C+x_P\le1000
\]

This constraint has little effect when material and labor constraints already push production well below 1000.

This constraint is called a redundant constraint.

It does not necessarily make the results wrong, but it increases model maintenance and interpretation burdens. If there are many repetitions or dominated constraints in a large model, the solution efficiency may also be affected.

After the modeling is complete, checking which constraints consistently have large slack can help discover whether there are unnecessary rules.

## Diagnose infeasibility through conflicting constraints

If a model returns `Infeasible`, do not interpret this as "solver failure". More often than not, there is no common intersection between business rules.

Common reasons include:

- Total minimum demand exceeds total production capacity;
- When multiple lower limits are superimposed, resources will be exceeded;
- The upper and lower bounds are written backward;
- Inconsistent units or time periods;
- Binary logic turns off all routes.

When troubleshooting, you can temporarily relax a set of constraints to see if feasibility is restored, and then gradually reduce the scope of the conflict.

What really needs to be fixed are the model inputs or business rules, rather than forcing the solver to give a "closest answer".

## Moving a resource boundary can change the optimum

Assuming that the material increases from 240 to 250, the original feasible region will expand outward. The optimal point may move and the target value may increase.

But if labor is still tight, the material added 10 units may not all be valuable. The true value of additional resources depends on the boundaries formed by other constraints.

This is where constrained optimisation and sensitivity analysis come together:

```text
当前解在哪个角点？
哪些约束 binding？
如果 RHS 改变，角点怎样移动？
目标值能改善多少？
```

It's not enough to just look at "the resource has been used up". The next step is to see how much it is worth to relax it.

## A robust inspection sequence

1. First confirm the unit, lower bound and type of each variable;
2. Explain constraints one by one in business language;
3. Draw or randomly check several feasible and unfeasible solutions;
4. After solving, substitute the optimal variables back into all constraints;
5. Calculate slack and identify binding constraints;
6. Use tolerances to handle floating point errors;
7. Check for obvious redundant constraints;
8. If it is not feasible, troubleshoot according to constraint conflicts;
9. Finally, let’s discuss the impact of changing resource boundaries.

The core of constrained optimization is not just "a few inequalities." What is really useful is to see which business boundaries are limiting decisions and why the model pushes the optimal solution to that position.
