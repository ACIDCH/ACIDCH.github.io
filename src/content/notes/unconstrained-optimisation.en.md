---
translationKey: unconstrained-optimisation
locale: en
slug: unconstrained-optimisation
title: Unconstrained Optimisation
summary: Use a capacity-value model to connect function shape and derivatives to the mathematical optimum, then compare that point with nearby choices that can actually be implemented.
tags:
  - unconstrained optimisation
  - marginal analysis
  - optimal points
topics:
  - Supply Chain Optimisation
  - Decision Modelling
tools:
  - Excel Solver
  - Python
series: Supply Chain and Decision Models
seriesSlug: decision-models
order: 2
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - optimisation-model-anatomy
---

## Unconstrained optimisation is a useful mathematical starting point

Unconstrained optimization means that the upper limit of resources, lower limit of demand or logical limits are not explicitly written in the model for the time being. It does not mean that the real world really has no boundaries.

It is most suitable to answer a basic question first: when a decision variable changes by itself, how will the objective function change, and why does the best position appear there?

For example, capacity increases often bring about two opposing forces:

```text
容量更大
→ 能承接更多业务
→ 价值上升

容量更大
→ 维护、拥堵、预留或低利用成本上升
→ 边际收益下降
```

When two forces cancel out, an internal optimum may emerge.

<div data-learning-slot="unconstrained-tradeoff"></div>

## A capacity model makes the objective's shape visible

Let the capacity decision be x, and the net value function is:

\[
V(x)=96x-0.08x^2-18000
\]

The meaning of the three parts is very intuitive:

```text
96x
→ 容量带来的线性价值

-0.08x²
→ 容量扩大后的拥堵或复杂度成本

-18000
→ 固定基础成本
```

If you only look at `96x`, the larger the capacity, the better; if you only look at `-0.08x²`, the larger the capacity, the faster the cost increases. Putting the two items together, the net value will rise first, then reach a peak, and then start to decline.

This type of function is closer to many real-world capacity problems than simply "maximizing revenue" because it recognizes that after a certain level of expansion, additional capacity is no longer free.

## The first derivative measures the value of a marginal increase

Derive V(x):

\[
V'(x)=96-0.16x
\]

The first derivative can be understood as how the net value will change if a little more capacity is added near the current point.

when:

```text
V'(x) > 0
```

Continuing to increase x also increases the target value.

when:

```text
V'(x) < 0
```

Increasing the capacity will actually reduce the net value.

The internal optimum satisfies:

\[
V'(x)=0
\]

so:

\[
96-0.16x=0
\]

get:

\[
x^*=600
\]

This is not because 600 looks "centered", but because at this point the marginal value of the extra capacity is just offset by the extra cost.

## The second derivative identifies the type of stationary point

Only the first derivative is equal to 0, which cannot be immediately concluded to be the maximum value.

Continue to find the second derivative:

\[
V''(x)=-0.16
\]

It is always less than 0, indicating that the function is curved downward as a whole and is a concave function.

Therefore x=600 corresponds to the maximum value, not the minimum value.

This step seems very basic in a simple single variable problem, but the idea is very important:

```text
一阶导数
→ 找可能的最优位置

二阶导数 / 函数形状
→ 判断这个位置到底是峰值还是谷值
```

## Substitute the optimum into the original objective

Substitute x=600 back:

\[
V(600)=96(600)-0.08(600)^2-18000
\]

get:

\[
V(600)=10800
\]

So the optimal capacity of the continuous model is 600 and the net value is 10,800.

It's best to develop a habit here: even if x has been given by the solver or calculus, resubstitute the objective function and check again. Optimization results should be able to be recalculated independently rather than just trusting the final numbers on the software screen.

## An optimum of 600 does not make 599 or 601 poor choices

The most easily misunderstood aspect of many optimization results is that a mathematical optimal point is regarded as an undeviable instruction.

Compare three capacities:

\[
V(575)=10750
\]

\[
V(600)=10800
\]

\[
V(625)=10750
\]

Both 575 and 625 are only 50 below the optimal value.

That is, deviating from 600 by 25 capacity units, the net value only decreases:

\[
10800-10750=50
\]

If 575 is easier to match warehouse space, or 625 leaves a little buffer for future demand, then this 50 gap may be well worth accepting.

The optimal point tells "where is the theoretical best", and the near-optimal region tells "how many choices there are in reality."

## A flatter objective creates a wider near-optimal region

Near the peak value, if the function is flat, the decision variables change a lot, but the target value changes very little. This means there is more room for management to maneuver.

On the other hand, if the peak value of the function is sharp and a slight deviation is very costly, then the decision-making needs to be more precise.

The second derivative also has intuition here: the greater the absolute value of the curvature, the more curved the function is; the closer it is to 0, the flatter it is locally.

Therefore, the second-order information is not only used to determine the maximum or minimum, but also helps to understand the sensitivity near the optimal point.

## The mathematical optimum may not be an executable choice

The continuous model gives x=600 which is very convenient, but the actual capacity may only be chosen from a few options:

```text
575
600
625
```

Candidates can then be compared directly rather than assuming that all contiguous capacity can be purchased.

If the alternative becomes:

```text
575
625
```

The net value of both plans is 10,750. The model does not differentiate between them for management at this point because the target values ​​are exactly the same.

This just illustrates an important boundary: the optimization model will only make choices based on what has been written into the objective function and constraints. If 625 brings higher scalability and 575 has lower risk, these factors need to be additionally discussed or written into the model.

## Re-evaluate discrete alternatives instead of rounding blindly

Assume that the calculation result is not 600, but 612.4, but the actual capacity can only be purchased according to 25. The two closest candidates are probably 600 and 625.

At this time, it is not rigorous to directly round 612.4 to 600, because the objective function is not necessarily symmetrical on both sides. The correct approach is simple: Substitute the executable candidates back into the objective function respectively, and then compare their net values.

```text
连续模型
→ 找出最有吸引力的区域

离散业务选择
→ 在真实可选方案中重新比较
```

If the discrete rules themselves are many, for example, the capacity must be an integer multiple of the number of devices, accompanied by a fixed activation cost, then the problem has begun to approach integer optimization, and the continuous solution should not be regarded as the final answer.

## Define the near-optimal region with an acceptable loss

"The nearby solutions are also good" is best not to stop at feelings. You can first define an acceptable loss for the business, for example, the target value is at most 1% lower than the optimal value.

The current optimal value is 10,800, then the tolerance range of 1% corresponds to:

\[
10800\times0.99=10692
\]

As long as the net value of a capacity solution is no less than 10,692, it enters this group of near-optimal candidates. Comparisons can then be made using execution factors not expressed in the model: site, headroom for expansion, lead time, risk buffer, or round-number batch size.

This approach separates "mathematical optimization" and "management selection" into two steps, and avoids sacrificing obvious execution convenience for a small goal difference.

## Calculus and grid search are complementary

For single variable functions, you can find the optimum in different ways:

```text
解析求导
→ 直接解 V'(x)=0

网格搜索
→ 在一组候选 x 上计算 V(x)

数值优化
→ 用算法迭代寻找更优点
```

Analytical solutions are clearest, but not all functions can be easily differentiated or equations solved. Grid search is great for verification: even if you already know that 600 is optimal, you can do point-by-point calculations between 500 and 700 to see if the function indeed peaks around 600.

Python example:

```python

def value(x):
    return 96 * x - 0.08 * x**2 - 18000

candidates = range(500, 701, 5)
best_x = max(candidates, key=value)
print(best_x, value(best_x))
```

Using different methods to reach the same conclusion makes it easier to spot coding or formula errors than relying on just one method.

## Numerical optimisation still requires bounds, starting values and visual checks

Numerical optimization is more common when the function does not have a convenient analytical solution. But after the algorithm returns a candidate point, it still has to determine whether it is a reasonable optimal point.

For single variable problems, you can take a few more values ​​around the candidate point:

```text
x* - 10
x*
x* + 10
```

The results would only be consistent with the intuition of local peaks if the intermediate values ​​were indeed better. More complex, non-convex functions may also have multiple local optimal points, and different initial values ​​may go to different positions.

Therefore, "the solver ended successfully" does not mean that the objective function has been understood. Graphs, grids, and multiple initial value comparisons remain valuable verification tools.

## Multiple variables introduce partial derivatives

If the objective function is affected by two decision variables at the same time:

\[
f(x_1,x_2)
\]

You need to consider separately:

\[
\frac{\partial f}{\partial x_1},\qquad
\frac{\partial f}{\partial x_2}
\]

Internal stationary points are usually such that all first-order partial derivatives are 0.

Multivariable situations also require consideration of interactions between variables and overall curvature. The "second derivative" in a single variable will be expanded into a Hessian matrix.

However, the management intuition has not changed: first look at when the marginal benefit of each variable disappears, and then look at whether this stationary point is a real peak.

## An unconstrained formulation can still produce a boundary optimum

Unconstrained optimization often talks about the internal optimal point, but the actual function may not necessarily achieve the internal optimal point.

For example, although the decision variables are not written as formal constraints, in reality they only consider:

\[
0\le x\le500
\]

The peak value of the original function is at 600, so within the allowed range, the best choice will fall on the boundary x=500.

Therefore, after finding the stationary point, you still need to check the decision scope. A mathematical point outside the actual range of options is not an executable answer.

If the first derivative is greater than 0 in the entire allowable interval, the optimal point is naturally at the upper boundary; if it is always less than 0, it will fall to the lower boundary. Not every optimization problem should be forced to find an internal solution with a derivative equal to 0.

## Parameter changes move the optimum

In the current model:

\[
V(x)=ax-bx^2-F
\]

The internal optimum satisfies:

\[
x^*=\frac{a}{2b}
\]

If the unit value a increases, the optimal capacity will become larger; if the congestion coefficient b increases, the optimal capacity will become smaller. The fixed cost F changes the net value level but does not change the internal optimal x in this simple model.

This relationship is very suitable for situational analysis. Rather than just giving "optimal 600", it would be more useful to indicate which parameter changes would push the optimal capacity to another range.

It is also possible to directly compare whether parameter changes would move the optimal point across a certain real purchasing bin. For example, when the optimal capacity changes from 612 to 628, mathematically it only moves 16, but the actual purchasing decision may jump from 625 to 650. There is often such a decision threshold between continuous parameter changes and discrete business actions.

## A practical analysis sequence

Faced with an unconstrained optimization problem, you can follow the following sequence:

1. First draw or calculate the objective function to confirm the overall shape;
2. Use the first derivative to find the location where the marginal change is 0;
3. Use second-order derivatives or function graphs to determine peak or valley values;
4. Substitute the candidate points back into the objective function and recalculate;
5. Check the practical range and discrete limits of decision variables;
6. Compare several executable solutions near the optimal point and clarify the near-optimal tolerance;
7. Review numerical solution results using grids or local values;
8. Change the key parameters to see if the optimal point and the real decision-making position are stable.

What is really worth taking away from unconstrained optimization is not just "the derivative is equal to 0", but learning to look at the function shape, marginal value and realistic executable plan together.
