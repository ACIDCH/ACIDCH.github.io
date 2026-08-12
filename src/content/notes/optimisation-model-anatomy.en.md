---
translationKey: optimisation-model-anatomy
locale: en
slug: optimisation-model-anatomy
title: The Anatomy of an Optimisation Model
summary: Start with a concrete business decision, then define its objective, parameters, decision variables and constraints before checking units, granularity, feasibility and practical usefulness.
tags:
  - optimisation
  - decision variables
  - constraints
topics:
  - Supply Chain Optimisation
  - Decision Modelling
tools:
  - Excel Solver
  - Python
  - PuLP
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 1
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes: []
---

## Optimisation begins by defining the decision

Optimization problems are often talked about as "finding the maximum" or "minimizing the cost," but the real hard part usually happens before solving.

Consider a factory that produces Core Kits and Premium Kits. Both products contribute to profits and consume materials and labor. The business wants to increase total contribution, but there are only 240 units of materials and only 250 units of labor.

Once this question is completed, the model begins to appear in outline:

```text
要决定什么？
→ 两种产品各生产多少

什么已经知道？
→ 单位贡献、单位资源消耗、资源上限

什么不能违反？
→ 材料和人工不能超量

什么结果更好？
→ 总贡献更高
```

These four sentences are more important than any solver settings. If the model understands it wrong here, even if it displays `Optimal` later, it will only get the "optimal answer to the wrong question".

<div data-learning-slot="optimisation-anatomy"></div>

## Four elements form the model's core structure

Most basic optimization models can be broken down into four categories:

```text
Objective
Parameters
Decision Variables
Constraints
```

Their roles are not the same.

**Objective** explains what "better" means; **Parameters** is the given data; **Decision Variables** is the amount that the model can choose; **Constraints** outlines which choices are allowed to exist.

Mixing these four categories together is one of the most common mistakes when modeling. For example, "material usage 3" is a parameter, not a decision; "material cannot exceed 240" is a constraint, not a goal; "how much Core produces" is the variable that the model needs to determine.

## The objective must represent the real management goal

The unit contribution for the Core Kit is 42, and the unit contribution for the Premium Kit is 58. set up:

\[
x_C=\text{Core Kit 产量}
\]

\[
x_P=\text{Premium Kit 产量}
\]

If the business goal is to maximize total contribution, it can be written as:

\[
\max Z=42x_C+58x_P
\]

This expression is short, but it defaults to a lot of things: the contribution has already taken care of the variable costs that need to be deducted; the unit contribution of the two products remains unchanged within the current decision-making scope; what the business really cares about is the total contribution, not revenue, sales or service levels.

Therefore, before writing the objective function, it is best to ask: Will management really be better when this number becomes larger?

Some of the questions ostensibly talk about "reducing costs", but in fact they also require meeting service levels; some questions say "increasing production", but what they really want to maximize is profits. Writing the wrong goal is more troublesome than choosing the wrong algorithm.

## Parameters are supplied inputs, not model decisions

Current product data is:

| product     | unit contribution | Material usage | artificial dosage |
| ----------- | ----------------: | -------------: | ----------------: |
| Core Kit    |                42 |              3 |                 2 |
| Premium Kit |                58 |              4 |                 5 |

Resource limit:

```text
Material capacity = 240
Labour capacity   = 250
```

These numbers are entered into the model as known parameters.

Parameters can come from historical data, contracts, engineering standards, forecasts, or management assumptions. Different sources have different credibility. The optimization model does not automatically determine whether 240 is accurate capacity or an out-of-date estimate, so parameter quality must be checked outside the model first.

A very useful habit is to give the parameters units:

```text
42   contribution / Core Kit
3    material units / Core Kit
240  material units available
```

As long as the units don't match up, there's probably something wrong with the formula.

## Decision variables must map directly to business actions

The variables in this example are:

\[
x_C\ge0,\qquad x_P\ge0
\]

If the final recommendation is "Produce 28.57 Core and 38.57 Premium", continue to ask: Does the product allow consecutive quantities?

If the product must be produced in units, the variables should be integers; if the model deals with divisible quantities such as tons, hours, capacity shares, etc., continuous variables are natural.

Variable types are not technical details. It determines what answers the model allows.

Common variables include:

```text
连续变量
→ 产量、运输量、工时、库存

整数变量
→ 车辆数、班次数、设备数

二进制变量
→ 开不开仓库、选不选供应商、启不启用路线
```

It is best for a good variable name to directly tell the business meaning, rather than just writing `x1`, `x2` and then relying on the comments next to it to guess.

## Constraints encode the rules that decisions must obey

Core uses 3 unit material per piece, Premium uses 4 unit material per piece. The total amount of materials cannot exceed 240:

\[
3x_C+4x_P\le240
\]

The artificial constraints are:

\[
2x_C+5x_P\le250
\]

Add the non-negative condition:

\[
x_C,x_P\ge0
\]

Together, these constraints define the feasible space of the model.

The most important thing about constraints is not the form, but the source. Each constraint should correspond to a clear business rule:

```text
材料不能超库存
人工不能超可用工时
需求必须满足
运输量不能超过承运能力
某设施不开启时不能向它分配流量
```

If a formula doesn't make sense for the business, it's worth re-examining.

## Unit checks reveal many structural errors

Every expression in the optimization model should be true in units.

Material constraint left:

```text
3 material/Core × x_C Core
+
4 material/Premium × x_P Premium
```

The result units are all material, and the 240 on the right is also material, so it can be compared.

If you mistakenly put "profit per unit" into the material constraints, or directly add monthly demand and weekly production capacity, the model will lose meaning even if the solver can run.

Unit checking is especially suitable for use after the model becomes larger, because the most common errors in complex models are not advanced mathematical errors, but index, time period and dimensional misalignment.

## Granularity determines the level of decision detail

"How much to produce" sounds clear, but it can be further broken down:

```text
全公司总产量
工厂产量
工厂 × 产品产量
工厂 × 产品 × 周产量
```

The finer the granularity, the closer the model is to the real business, and it will also bring more variables and parameters.

If the decision really takes place in "factory × product × week", but only builds a company total model, the model may give an answer that seems optimal but is actually unexecutable.

Conversely, if management only needs to make quarterly capacity judgments, refining the model down to every hour will add unnecessary complexity.

The granularity should be consistent with the level at which decisions occur, rather than becoming more granular and advanced.

## Define the model boundary before solving

Any optimization model leaves out part of reality. The question is not whether something was omitted, but whether what was omitted would change the current decision.

For example, this product portfolio model does not include the upper limit of demand, line changeover time, yield difference and minimum batch size. If these factors do exist in the current business, it is necessary to determine which of the three situations they belong to:

```text
已经包含在参数里
→ 例如单位贡献已经扣除了稳定的变动成本

对当前决策影响很小
→ 可以暂时省略，但要写明边界

会直接改变可行方案
→ 应该进入变量、目标或约束
```

This step can prevent the model from becoming more and more complex, and can also avoid the other extreme: in order to keep the formula simple, all the rules that really determine the answer are left outside the model.

A very practical approach is to keep a list of "what is not included in the model". This way the results, when given to others, don't make "optimal" sound like it holds true for all real-world conditions.

## Use manual candidate solutions as a sanity check

Before the model is handed over to the Solver, several very simple solutions can be calculated by hand.

Only produce Core:

\[
x_P=0
\]

The maximum allowed Core for materials is 80, and the maximum allowed for artificial is 125, so the true upper limit is 80.

Only produces Premium:

\[
x_C=0
\]

Material allows 60, labor only allows 50, so the true upper limit is 50.

These two boundary points tell at least three things: whether the variable magnitude is reasonable, whether the constraint direction is reversed, and whether the resource coefficient is roughly in line with expectations.

If the solver later returns `Core = 800`, it can immediately determine that there is a problem with the model representation, rather than first believing in the `Optimal` status. The same idea can also be used for large-scale models: select a few extreme or simple business scenarios, first confirm that the model response is consistent with common sense, and then formally solve it.

## Establish feasibility before comparing performance

The optimization model does not always have a solution.

For example, if the requirement is to produce at least 60 Core and 60 Premium simultaneously, the material requirements are:

\[
3(60)+4(60)=420
\]

The requirement exceeds the available 240 units. The model is infeasible; no “smarter algorithm” can resolve contradictory requirements.

Therefore, when seeing `Infeasible`, the first reaction should be to check whether the constraints conflict with each other:

- Whether minimum demand exceeds total capacity;
- Whether multiple lower limits will crowd out resources together;
- Are units mixed?
- Does binary logic turn off all options?

Feasibility is the prerequisite for optimality. There is no "second best" to an unworkable model, only business rules or data that need to be reexamined.

## The mathematical optimum still requires operational review

For the current two-product model, the optimal continuous solution is located at the intersection of the two resource constraints:

\[
x_C=\frac{200}{7}\approx28.57
\]

\[
x_P=\frac{270}{7}\approx38.57
\]

The target value is approximately:

\[
Z\approx3437.14
\]

Material usage:

\[
3x_C+4x_P=240
\]

Manual usage:

\[
2x_C+5x_P=250
\]

Both resources are just full.

Mathematically this is a clean answer, but one more check to make before actual delivery: Does the product have to be rounded to an integer? Is there a minimum production batch size? Is there a demand cap? Is there a setup cost for switching products? Can the resource capacity really reach the nominal upper limit at the same time?

"Optimal" is only responsible for the rules that have been written into the model.

## Near-optimal alternatives may be more practical

Management decisions do not necessarily have to adhere to a precise optimal point.

If another solution only reduces the target value by 0.5%, but is easier to schedule, more consistent with batch production, or leaves a buffer for critical resources, then it may be more suitable to implement.

Therefore, the optimization results are best viewed simultaneously:

```text
Optimal solution
Near-optimal alternatives
Resource slack
Decision stability
```

A model is truly useful not just because it gives the highest target value, but because it can illustrate the cost of deviating from the optimal value.

## Common modelling mistakes

### Writing code before defining the business meaning

Just because the code can run does not mean that the model is correctly defined. It usually saves time to write the variables, goals and constraints clearly in words first.

### Treating a KPI as an objective without qualification

"High sales", "high customer satisfaction" and "low inventory" may be important at the same time, but it must be clear which are goals, which are constraints, and which are just result indicators.

### Omitting variable bounds

There are no non-negative, upper bound, integer or binary conditions, the solver looks for answers as far as the mathematics allows.

### Mixing units or time scales

Weekly demand mixed with monthly capacity, piece count with tonnage, are more common sources of error than algorithmic issues.

## A robust modelling sequence

Business problems can be translated into optimization models in the following order:

1. Write clearly in one sentence what will ultimately be decided;
2. List parameters and units that are already known;
3. Define decision variables and their types, indices, and bounds;
4. Write the objective function and confirm that it really represents "better";
5. Write each business rule as a constraint;
6. Check units, granularity, and time scales;
7. Write down the model boundaries clearly and calculate several sanity-check solutions by hand;
8. First confirm that the model is feasible;
9. Recalculate resource usage and target values ​​after solving;
10. Then discuss whether the optimal solution is executable and whether there are more reliable solutions nearby.

The purpose of optimisation modelling is not to delegate judgement to software. It is to express the decision clearly enough that every input, rule and result remains traceable.
