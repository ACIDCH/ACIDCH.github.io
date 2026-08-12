---
translationKey: sets-indices-model-scale
locale: en
slug: sets-indices-model-scale
title: Sets, Indices and Model Scale
summary: Organise products, factories, customers and periods with sets, indices and parameter dictionaries so that optimisation models remain complete and maintainable as they scale.
tags:
  - sets
  - indices
  - model scale
topics:
  - Supply Chain Optimisation
  - Optimisation Programming
tools:
  - Python
  - PuLP
  - Excel Solver
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 6
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes:
  - binary-milp-decisions
---

## Scale, not algebra, often makes a model difficult

When there are only two products, you can write directly:

```text
x_core
x_premium
```

Then write two or three constraints by hand, and the model will be easy to understand.

But once the business expands:

```text
5 个产品
4 个工厂
6 个客户区域
12 个时期
```

If you continue to name each variable individually, your code will quickly get out of control.

The real problem that needs to be solved becomes: **How ​​to make the same kind of decisions be generated in batches according to business dimensions while ensuring that each parameter and constraint corresponds to the correct object. **

This is what sets and indices are for.

<div data-learning-slot="model-scale"></div>

## A set defines the objects that exist in the model

Set can first be understood as a set of business objects.

For example:

```python
products = ["core", "premium"]
plants = ["north", "south"]
regions = ["metro", "coast", "inland"]
```

These three sets of sets answer respectively:

```text
有哪些产品？
有哪些工厂？
有哪些市场区域？
```

The collection itself contains no cost, capacity or demand. It just defines which objects the model needs to traverse.

This distinction is important. After separating "object" and "object properties", the model structure will be much clearer.

## An index identifies an object within a set

If p represents an element in the products collection:

\[
p\in P
\]

The output of a certain product can be written as:

\[
x_p
\]

If k represents a factory:

\[
k\in K
\]

The quantity of product p produced by factory k can be written as:

\[
x_{k,p}
\]

This is better than:

```text
north_core
north_premium
south_core
south_premium
```

Easier to expand.

If you add a third factory in the future, you only need to add an element to the `plants` collection instead of re-duplicating the entire set of variables and constraints code.

## Variable dimensions reflect increasing business detail

The different dimensions can be read like this:

```text
x[p]
→ 每个产品一个决策

x[k, p]
→ 每个工厂、每个产品一个决策

x[k, p, t]
→ 每个工厂、每个产品、每个时期一个决策
```

Dimensions are not there to make the model look advanced. Every time an index is added, a practical question is answered: Does this decision need to distinguish this business dimension?

If the cost and capacity of different plants are completely different, it will be necessary to distinguish the plants. If all periods could be represented by the same aggregate, there would be no need to add the time dimension unnecessarily.

Model dimensions should match decision granularity.

## Organise parameters with the same index structure

Assuming that the transportation costs from different factories to different regions are different, you can write:

\[
c_{k,r}
\]

Using tuple keys comes naturally in Python:

```python
transport_cost = {
    ("north", "metro"): 4.2,
    ("north", "coast"): 5.4,
    ("north", "inland"): 6.1,
    ("south", "metro"): 5.1,
    ("south", "coast"): 3.9,
    ("south", "inland"): 4.6,
}
```

Here key `(plant, region)` itself is the business coordinate of the parameter.

Read next:

```python
transport_cost["south", "coast"]
```

You can clearly know that you are getting the unit transportation cost from South Plant to Coast.

This structure is safer than putting all the numbers into a long list without labels.

## Composite keys must be unique and complete

One of the most common problems with multidimensional parameters is that the key is written incorrectly or repeatedly.

For example:

```text
(north, metro)
```

Should only appear once in the shipping cost table.

If the same combination appears twice, you must first figure out which value is correct; if a legal combination is completely missing, an error will be reported when the model runs to the corresponding index, or the code will default to the wrong 0.

Therefore, the tuple key is not just a programming trick, it is actually a data contract:

```text
每个合法业务组合
→ 应该有且只有一个对应参数
```

In larger optimization models, it is worthwhile to check the uniqueness and completeness of keys before modeling.

## Generate variable families instead of individual variables

PuLP can create variables in batches by collection:

```python
x = pl.LpVariable.dicts(
    "flow",
    (plants, regions),
    lowBound=0,
)
```

This generates a whole set of variables:

```text
flow[north][metro]
flow[north][coast]
flow[north][inland]
flow[south][metro]
flow[south][coast]
flow[south][inland]
```

The point is not that you write fewer lines of code, but that all variables follow the same rules.

After adding a region, new variables will be automatically generated with the collection, and the model does not need to manually copy a new piece of code.

## Generate constraint families from business rules

It is assumed that the requirements for each area must be met:

\[
\sum_k x_{k,r}\ge demand_r\qquad\forall r\in R
\]

The code can be written as:

```python
for r in regions:
    model += (
        pl.lpSum(x[k][r] for k in plants) >= demand[r],
        f"demand_{r}",
    )
```

This is not "a constraint", but a whole constraint family.

If there are 3 areas, 3 will be generated; if the area is later increased to 20, the same code will still apply.

This is exactly why the index model is scalable: rules are written once and instances are generated per set.

## Estimate model scale before implementation

You don’t have to wait until the solver is run to know how big your model is.

If the variable is:

\[
x_{k,p,t}
\]

and:

```text
|K| = 4 plants
|P| = 5 products
|T| = 12 periods
```

The number of theoretical variables is:

\[
4\times5\times12=240
\]

Adding area r gives:

\[
x_{k,p,r,t}
\]

Assuming 6 areas, it becomes:

\[
4\times5\times6\times12=1440
\]

With each additional dimension, the scale grows multiplicatively, not simply adding a few columns.

Calculating the number of variables and constraints in advance can help determine whether the model needs to be sparsified, decomposed, or reduce meaningless combinations.

## Distinguish dense and sparse model structures

The above multiplication assumes that all combinations make sense, but in reality this is often not the case.

For example:

- South Plant cannot produce Premium;
- Certain areas can only be serviced by North Plant;
- A product is only sold during certain periods.

If you still create variables for all combinations, you'll end up with a lot of variables that will always have to be 0.

A more compact approach is to define legal combinations first:

```python
valid_routes = [
    ("north", "metro"),
    ("north", "coast"),
    ("south", "coast"),
    ("south", "inland"),
]
```

Then create variables only for these combinations.

Sparse indexing not only saves memory, but also reduces meaningless solutions and logical constraints, making the model easier to check.

## Cell-by-cell hard-coding creates omissions

When the model is large, the most dangerous way to write it is usually:

```python
model += x_north_metro + x_south_metro >= 360
model += x_north_coast + x_south_coast >= 280
model += x_north_inland + x_south_inland >= 220
```

This may seem acceptable with only 3 regions, but adding region 4 later makes it easy to forget the corresponding constraints.

This is the advantage of loops or indexed expressions: the collection is the only source, and the number of constraints changes with the collection.

Similarly, manual copying of formulas is prone to copy-paste errors, such as the misuse of Inland's demand figures in the Coast constraint.

## Audit sets and parameters before building the model

Before creating a variable, you can check:

```text
集合是否为空？
ID 是否唯一？
参数 key 是否全部合法？
每个需要的组合是否都有参数？
有没有多余的未知 key？
数值单位是否一致？
```

For example:

```python
expected = {(k, r) for k in plants for r in regions}
actual = set(transport_cost)

missing = expected - actual
extra = actual - expected
```

This type of check is more efficient than looking for problems in thousands of variables after the model fails to solve.

Parameter auditing should occur before modeling, rather than just temporarily filling in data when `KeyError` occurs.

## Variable names determine whether results are traceable

The final output of the solver is usually a set of variable names and values.

If the variables are called:

```text
x_1
x_2
x_3
```

The results are difficult to trace.

If the name contains a business index:

```text
flow_north_metro
flow_south_coast
production_north_core_P1
```

Even if there is a problem with the model, it is easier to locate which combination is abnormal.

Good naming also affects logs, LP files, and debug output. The larger the scale, the less naming becomes less of a "coding style" and more part of the model's auditability.

## Summarise results instead of printing thousands of variables

After a high-dimensional model is solved, if all variables are printed line by line, readability will soon be lost.

A better approach is to slice by business problem:

```text
按工厂汇总总产量
按区域汇总总配送量
只显示非零变量
只检查某个产品
只看某一个时期
```

For example:

```python
for k in plants:
    total = sum(pl.value(x[k][r]) for r in regions)
    print(k, total)
```

The model can be high-dimensional internally, but the results should be presented at a granularity that managers can understand.

## A robust sequence for scaling a model

1. First confirm what business dimensions are needed;
2. Create explicit sets for each dimension;
3. Check ID uniqueness;
4. Use tuple key or nested dictionary to save parameters;
5. Conduct parameter integrity audit before modeling;
6. Use variable family to create variables in batches;
7. Use loop to generate constraint family;
8. Use sparse indexing for impossible combinations;
9. Estimate variable and constraint sizes in advance;
10. After solving, summarize the results by business dimensions instead of directly outputting all variables.

Collections and indexes seem to be just programming structures, but they actually determine whether the model can be expanded smoothly from a classroom-sized example to real business. The formula does not necessarily become difficult, what really needs to be controlled is scale, correspondence and traceability.
