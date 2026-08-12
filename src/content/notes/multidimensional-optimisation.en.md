---
translationKey: multidimensional-optimisation
locale: en
slug: multidimensional-optimisation
title: Multidimensional Optimisation Models
summary: Expand a decision from total production to factory × product × period while checking dimensions, indices, sparse combinations and the interpretation of high-dimensional results.
tags:
  - multidimensional models
  - n-dimensional arrays
  - indexed variables
topics:
  - Supply Chain Optimisation
  - Optimisation Programming
tools:
  - Python
  - PuLP
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 8
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - pulp-model-architecture
---

## Add dimensions only when the business needs greater detail

The simplest production variable can have only one:

```text
x = total production
```

If the business starts to differentiate products, it becomes:

```text
x[p]
```

Distinguish the factory again:

```text
x[k, p]
```

Rejoin period:

```text
x[k, p, t]
```

The variables are getting longer, not to make the math seem complicated, but because the decisions themselves are already different from object to object.

North Plant and South Plant have different capacities, Core and Premium have different resource consumption, and have different needs in different periods. If the model wants to truly retain these differences, it must add corresponding dimensions.

<div data-learning-slot="model-scale"></div>

## Understand 0D to n-D through what each variable represents

### 0D: a total quantity

\[
x
\]

Represents a total decision of the entire system, such as total purchase quantity.

### 1D: differentiate by one dimension

\[
x_p
\]

Represents one decision per product.

### 2D: differentiate by two dimensions

\[
x_{k,p}
\]

Represents one decision per factory and per product.

### 3D: add a time period

\[
x_{k,p,t}
\]

Indicates how much of each product each factory produces in each period.

The same logic applies to higher dimensions. The key is not to remember the names of 4D and 5D, but to be able to translate each index back into business language.

If a variable `x[k,p,t]` cannot clearly say "what a record represents", the model is prone to aggregation errors later.

## Each additional dimension multiplies model size

Assumptions:

```text
2 plants
2 products
4 periods
```

The theoretical quantity for variable `x[k,p,t]` is:

\[
2\times2\times4=16
\]

If you add 3 raw materials:

\[
x_{k,p,m,t}
\]

The theoretical number of combinations becomes:

\[
2\times2\times3\times4=48
\]

If a real business had 10 factories, 50 products, 20 customer regions, 52 weeks, the number of fully expanded variables would grow very quickly.

Therefore, high-dimensional modeling cannot only care about whether the formula is written correctly, but also whether the scale is necessary.

## Dimensions should represent meaningful business differences

If you need a certain index, you can ask a simple question:

> Do different objects in this dimension really have different parameters, constraints or decision-making meanings?

If production costs, capacity, and product output are exactly the same for all factories, and there is no management need for factory-specific results, there may be no value in adding the factory dimension.

The time dimension is necessary if there are significant differences in demand in different periods and inventory carryover needs to be processed.

The more dimensions a model has, the higher the data requirements. Fine-grained models without reliable parameter support often just hide uncertainties in more cells.

## Parameter indices must align with variable indices

Assume that the production variables are:

\[
x_{k,p,t}
\]

Unit production cost might be written as:

\[
c_{k,p,t}
\]

Factory capacity may only require:

\[
cap_{k,t}
\]

Product requirements may be:

\[
demand_{p,t}
\]

Not all parameters must have the same dimensions as variables.

If the capacity does not differentiate between products, a p should not be imposed; demand only changes by product and period, so there is no need to copy the factory dimension.

The more precise the parameter dimensions are, the easier it is to see where each data plays a role.

## Summation removes dimensions that a rule does not need

Suppose you want to limit North Plant's total production in period t, regardless of product:

\[
\sum_p x_{north,p,t}\le cap_{north,t}
\]

After p is summed here, the product dimension is aggregated, leaving factory and period.

If you want to calculate the total output of a certain product p in period t:

\[
\sum_k x_{k,p,t}
\]

What is eliminated this time is the factory dimension.

The most worthwhile thing to practice with high-dimensional models is this kind of reading: which dimensions are retained by the current constraints and which dimensions are summed out.

Once the wrong index is found, the model may still be solvable but control resources at the wrong level.

## A constraint family's dimensions determine its size

For example, each factory and each period has a capacity constraint:

\[
\sum_p x_{k,p,t}\le cap_{k,t}\qquad\forall k,t
\]

If there are 2 factories and 4 periods, generate:

\[
2\times4=8
\]

Capacity constraints.

If demand constraints are generated by product and period:

\[
\sum_k x_{k,p,t}\ge demand_{p,t}\qquad\forall p,t
\]

2 products and 4 periods generate 8 items.

Therefore, the model size depends not only on the variable dimensions, but also on which indices are preserved for each set of constraints.

## Distinguish state variables from flow variables

There are two types of variables commonly found in supply chain models.

**Flow** represents the number of occurrences within a certain period of time, for example:

```text
production[k,p,t]
shipment[k,r,t]
```

**State** represents the state saved at a certain point in time, for example:

```text
inventory[p,t]
backlog[p,t]
```

These two types of variables cannot be mixed together arbitrarily.

Production is the flow that occurs within a period, and ending inventory is the state after the interaction of production, demand, and inventory in the previous period.

The most important constraints in multi-period models are often the connection between state and flow:

\[
I_t=I_{t-1}+Production_t-Demand_t
\]

After understanding this difference, the multidimensional production inventory model will be much clearer.

## Do not create variables for impossible combinations

Assuming that Premium can only be produced at North Plant, then the combination:

```text
(south, premium)
```

Not legal at all.

One approach is to still create the variable and then force:

\[
x_{south,premium,t}=0
\]

Another, more compact approach is to not create these variables in the first place.

For large models, the latter is usually clearer:

```python
valid_plant_product = [
    ("north", "core"),
    ("north", "premium"),
    ("south", "core"),
]
```

This sparse combination reduces the number of variables and prevents the solver from wasting time on obviously meaningless combinations.

## Dimension misalignment can survive type checks

Many bugs do not generate Python errors.

For example the cost dictionary is:

```text
(plant, product, period)
```

The code presses incorrectly:

```text
(product, plant, period)
```

Read. If both locations happen to be strings, the program may continue running and end up just putting the cost of the error into the objective function.

This is more dangerous than the obvious `KeyError`.

Therefore, multidimensional parameters should use clear names, fixed key order, and be sampled and checked before modeling:

```text
North × Premium × P1 的成本是多少？
代码拿到的值是否和源数据一致？
```

A little manual spot checking can be very useful.

## Debug with slices instead of printing the whole model

When a high-dimensional model behaves unexpectedly, printing thousands of variables rarely helps.

A better approach is to fix a subset of indices and only look at one slice.

For example:

```text
只看 P1
只看 North Plant
只看 Premium
```

In Python, you can filter by conditions:

```python
for k in plants:
    for p in products:
        value = pl.value(x[k][p]["P1"])
        if value and abs(value) > 1e-8:
            print(k, p, value)
```

If the balance for P1 is wrong, resolve it before inspecting the following 51 weeks.

Starting with verification from low-dimensional slices and then expanding to the whole is one of the most time-saving methods for debugging high-dimensional models.

## Re-aggregation checks dimensional consistency

After solving, the high-dimensional results can be reaggregated into familiar business numbers.

For example:

```text
按工厂汇总总产量
按产品汇总总产量
按时期汇总总发货量
按区域汇总收到的总量
```

These summaries should correspond to capacity, demand, or known totals.

If the total production volume is 900, but the total by product is only 860, it means that a certain dimension is missing from the results.

The verification of high-dimensional models not only checks a single variable, but also requires cross-dimension reconciliation.

## Mass balance is a critical high-dimensional validation

Any network flow or inventory model should be able to answer: where does the goods come from and where does it end up.

A simple equilibrium can be written as:

\[
Beginning+Inbound+Production=Outbound+Demand+Ending
\]

If equilibrium is satisfied at every node, every product, and every period, the model is coherent at least in terms of quantity conservation.

If you only look at the total, local errors may cancel each other out. Therefore, it is best for high-dimensional models to check the balance at the finest effective granularity first, and then aggregate upward.

For example:

```text
product × plant × period
```

After the balance is passed, it is summarized into the company's total.

## Reduce high-dimensional results back to business language

The model may legitimately use 4D or 5D variables, but decision-makers rarely need to see the entire tensor.

The results page is better suited to answer:

```text
哪个工厂承担最多产量？
哪个产品造成容量瓶颈？
哪几个时期库存最高？
哪些路线实际被使用？
```

The high-dimensional result can be made as:

- Polyline by period;
- Factory × Product List;
- route traffic matrix;
- Show only non-zero combinations;
- Detailed slices of key periods.

Complexity should remain within the model, and the interpretation layer should be rearranged into information that can be decision-making.

## A robust high-dimensional modelling sequence

1. First write clearly what a variable represents;
2. Only add dimensions that really need to be differentiated in business;
3. Give each set and index a fixed meaning;
4. Check the order and integrity of parameter keys;
5. The number of estimated variables and constraints;
6. To exclude meaningless combinations, use sparse indexing first;
7. Use summation symbols to clarify which dimensions are aggregated by each constraint;
8. Distinguish between state variable and flow variable;
9. Examine local findings with slides;
10. Use mass balance and multi-directional aggregation for reconciliation;
11. Finally, the high-dimensional results are reduced to business-readable charts and summaries.

Multidimensional optimization is not about writing more subscripts into variables. The real difficulty is: each subscript has a clear business meaning, and the variables, parameters, constraints, and results are always consistent across these dimensions.
