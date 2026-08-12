---
translationKey: pulp-model-architecture
locale: en
slug: pulp-model-architecture
title: Building Optimisation Models with PuLP
summary: Translate a mathematical model into maintainable Python by organising PuLP code around sets, parameters, variables, objectives, constraints, solver status and validated results.
tags:
  - PuLP
  - optimisation programming
  - model architecture
topics:
  - Supply Chain Optimisation
  - Optimisation Programming
tools:
  - Python
  - PuLP
  - CBC
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 7
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes:
  - sets-indices-model-scale
---

## PuLP expresses a model but is not itself the solver

When you start writing optimized code, the most confusing thing is what Python, PuLP, and Solver are each doing.

The whole process can be divided into several layers:

```text
Python
→ 处理数据、集合、循环、结果整理

PuLP
→ 把目标函数、变量和约束组织成优化模型

Solver
→ 真正执行求解算法
```

For example, CBC is a common open source MILP solver. PuLP can pass the model to CBC or connect to other solvers in the appropriate environment.

This distinction is important. `LpVariable` is the modeling object of PuLP, and branch-and-bound is the internal working of the solver. The source of code errors and solution status exceptions must also be determined separately.

<div data-learning-slot="pulp-model-anatomy"></div>

## Keep code structure aligned with the mathematical model

An easy-to-review optimization program can be organized in the following order:

```text
1. Sets
2. Parameters
3. Model
4. Decision variables
5. Objective
6. Constraints
7. Solve
8. Status check
9. Result validation
```

In this way, when comparing the code with the mathematical model, there is no need to search back and forth in the file.

If parameters, variables, and constraints are scattered across dozens of cells, once the model becomes large, it will be difficult to determine where a certain number comes from.

## Define sets before parameters and variables

Transport models may be:

```python
plants = ["north", "south"]
regions = ["metro", "coast", "inland"]
```

Product models may also:

```python
products = ["core", "premium"]
```

Collections should be drawn from data as much as possible, rather than repeated handwriting in multiple places.

If `regions` has 3 areas in one place, and a list of only 2 areas is manually written in another place, subsequent constraints can easily be missed.

Therefore, it is best to have only one source of trust for a set of business objects.

## Store parameters in ordinary Python data structures

For example requirements:

```python
demand = {
    "metro": 360,
    "coast": 280,
    "inland": 220,
}
```

Factory capacity:

```python
capacity = {
    "north": 520,
    "south": 420,
}
```

Shipping cost:

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

These are model inputs and do not need to be made into PuLP variables.

After separating the parameters and decision variables, the meaning of the code is very clear: the ordinary Python numbers are the known data, and `LpVariable` is the quantity that the solver needs to decide.

## Declare the objective direction when creating the model

Minimization problem:

```python
model = pl.LpProblem("transport_plan", pl.LpMinimize)
```

Maximization problem:

```python
model = pl.LpProblem("product_mix", pl.LpMaximize)
```

The model name also deserves to be written clearly. When exporting `.lp` files or viewing logs later, a name with business meaning is easier to trace than `Problem1`.

If the target direction is reversed, the solver may still run normally, so this is a basic item that must be checked manually.

## LpVariable.dicts creates indexed variable families

Shipping volumes can be created by plant and region:

```python
flow = pl.LpVariable.dicts(
    "flow",
    (plants, regions),
    lowBound=0,
)
```

You can quote directly later:

```python
flow["north"]["metro"]
```

If it is an integer or binary variable, you can set the category:

```python
open_hub = pl.LpVariable.dicts(
    "open_hub",
    hubs,
    cat="Binary",
)
```

The variable type should be defined here instead of rounding the continuous results after solving.

## lpSum expresses indexed summation

The total transportation cost can be written as:

```python
model += pl.lpSum(
    transport_cost[k, r] * flow[k][r]
    for k in plants
    for r in regions
)
```

It corresponds to the mathematical expression:

\[
\min \sum_k\sum_r c_{k,r}x_{k,r}
\]

`lpSum` means more than just syntactic convenience. It allows the code to maintain the same structure as the mathematical summation symbol.

When examining this code, focus on three things:

```text
成本参数的索引顺序对不对？
变量索引对不对？
循环集合有没有漏掉维度？
```

In high-dimensional models, many bugs are hidden in these index misalignments.

## Generate constraints one rule family at a time

Each area requirement must meet:

```python
for r in regions:
    model += (
        pl.lpSum(flow[k][r] for k in plants) >= demand[r],
        f"demand_{r}",
    )
```

Each factory cannot exceed capacity:

```python
for k in plants:
    model += (
        pl.lpSum(flow[k][r] for r in regions) <= capacity[k],
        f"capacity_{k}",
    )
```

Naming constraints is valuable. When infeasible occurs or you need to check slack, `capacity_north` is easier to understand than the automatically generated `_C17` by the system.

The constraint name can also reflect the index directly, helping to check whether a rule was generated for each object.

## Count variables and constraints before solving

Before formally solving, you can do a simple sanity check:

```python
print("variables:", len(model.variables()))
print("constraints:", len(model.constraints))
```

If there should theoretically be 6 transportation variables, but instead there are 9, you should first check the collection and variable creation logic.

If 3 areas should generate 3 demand constraints, but only 2 appear, there is no need to wait until the solution result is abnormal to find out.

This quantity check is very effective for indexed models, because many missing items are essentially "N items should be generated, but only N-1 items are generated".

## Export the model for inspection before solving

PuLP can export LP files:

```python
model.writeLP("transport_plan.lp")
```

It writes the objectives and constraints that are ultimately handed to the solver into human-readable text.

When the code logic is complex, it is sometimes easier to find it by looking directly at the LP file than looking at the Python loop:

- A variable is missing;
- The direction of a certain constraint is written in reverse;
- Double counting of a certain cost;
- Parameter index is misplaced.

This step is especially suitable for situations where "the code looks fine, but the solution results are strange."

## Check solver status before reading variable values

Solution:

```python
status = model.solve(pl.PULP_CBC_CMD(msg=False))
print(pl.LpStatus[status])
```

Common statuses may include:

```text
Optimal
Infeasible
Unbounded
Not Solved
```

Only after the status meets expectations can the variable value be interpreted normally.

If the model is infeasible but the values ​​in the variable objects are still directly used for business reporting, it is easy to get misleading results.

Therefore, it is best to explicitly write the status threshold in the code:

```python
if pl.LpStatus[status] != "Optimal":
    raise RuntimeError("Model did not solve to optimality")
```

For large-scale MILP with a time limit set, it is necessary to determine whether to accept the current incumbent and gap based on the information returned by the solver, rather than simply requiring that all problems must be completely optimal.

## Recalculate business metrics from the returned solution

The optimal variable can be passed:

```python
pl.value(flow[k][r])
```

Read.

But result validation shouldn't stop at "printing variables". Better to recalculate independently:

```text
总需求是否满足？
每个工厂总流量是否超容量？
目标值是否能由变量 × 成本重新算出来？
binary variable 是否确实为 0/1？
```

For example, the total cost can be calculated again using plain Python:

```python
recomputed_cost = sum(
    transport_cost[k, r] * pl.value(flow[k][r])
    for k in plants
    for r in regions
)
```

Again:

```python
pl.value(model.objective)
```

Compare.

Independent recalculation can uncover many errors between model expression and result compilation.

## Display non-zero variables and meaningful aggregates

Large models may have hundreds or even thousands of variables. Printing all 0 one by one is usually worthless.

It is possible to display only variables with actual decisions:

```python
for variable in model.variables():
    value = variable.value()
    if value is not None and abs(value) > 1e-8:
        print(variable.name, value)
```

Then summarize according to business dimensions, for example:

```text
每个工厂总发货量
每个区域收到多少
每个产品生产多少
每期库存多少
```

Optimization models can be complex internally and the final output should come back to the management problem.

## Separate data preparation, modelling and reporting

A maintainable program shouldn't cram everything into the same long cell.

The clearer structure is:

```text
load / validate data
↓
build parameters
↓
build model
↓
solve
↓
validate solution
↓
format outputs
```

In this way, if the requirement data is updated, only the input needs to be replaced; if the model logic changes, the build model part is mainly modified; if the report format changes, there is no need to touch the constraint code.

This is more suitable for long-term maintenance than "copying the entire notebook every time you change a little bit".

## The most common PuLP errors are structural, not syntactic

Many models can run smoothly and still be wrong.

Frequently asked questions include:

### Reversed index order

```python
cost[r, k]
```

The actual dictionary is `(k, r)`.

### Missing a constraint family

Variable creation is complete, but some areas have no requirement constraints.

### Incorrect objective direction

The cost question is written as `LpMaximize`.

### Binary variable not linked to a continuous variable

The facility is closed, but traffic can still get through.

### Results not recalculated from business rules

Only trust `Optimal`, no check for constraint usage.

Therefore, "the program can run" at most indicates that there are no errors in the syntax and interface, but it does not mean that the model has been verified.

## A robust PuLP workflow

1. Use sets to define business objects;
2. Save parameters using ordinary Python structures;
3. Create `LpProblem` and confirm the target direction;
4. Use `LpVariable` / `LpVariable.dicts` to define variable types and boundaries;
5. Use `lpSum` to write the target function;
6. Group constraint families to generate constraint families;
7. Check the number of variables, constraints and names;
8. Export LP files if necessary;
9. After solving, check the solver status first;
10. Independently recalculate target values ​​and key resource balances;
11. Finally, the results are organized according to business granularity.

The most valuable part of PuLP is not to turn mathematical formulas into Python syntax, but to turn a set of optimization logic into a program that can be run, expanded, and checked repeatedly. The closer the code structure is to the model structure, the easier subsequent maintenance will be.
