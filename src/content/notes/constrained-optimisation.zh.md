---
translationKey: constrained-optimisation
locale: zh
slug: constrained-optimisation
title: 受约束优化：从可行域、角点到绑定约束
summary: 用两产品资源分配模型理解线性约束如何形成可行域，区分 equality、inequality、non-negativity、binding 与 slack，并通过角点与资源边界解释为什么最优解常出现在可行域边界。
tags:
  - Constrained Optimisation
  - Linear Programming
  - Feasible Region
topics:
  - 供应链优化
  - 决策建模
tools:
  - Excel Solver
  - Python
  - PuLP
series: 供应链与决策模型
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

## 现实决策通常不是在无限空间中寻找最优

无约束优化可以帮助理解目标函数本身的形状，但供应链决策几乎总会遇到资源边界：材料有限、人工有限、仓库有容量、车辆有载重、客户需求必须满足、合同规定最低采购量。

这些边界把原本无限的决策空间切成一个**可行域 feasible region**。

受约束优化真正解决的是：

> **在所有满足业务规则的方案中，哪个方案的目标最好？**

因此约束不是模型的附属说明，而是“哪些方案允许存在”的定义。

<div data-learning-slot="feasible-region-sensitivity"></div>

## 一个两产品资源分配模型

统一合成数据中，两种产品分别消耗材料和人工：

```text
Core Kit
贡献 = 42 / unit
材料 = 3 / unit
人工 = 2 / unit

Premium Kit
贡献 = 58 / unit
材料 = 4 / unit
人工 = 5 / unit
```

资源上限：

```text
Material ≤ 240
Labour   ≤ 250
```

决策变量：

```text
x = Core Kit 数量
y = Premium Kit 数量
```

模型：

```text
max Z = 42x + 58y

s.t.
3x + 4y ≤ 240     material
2x + 5y ≤ 250     labour
x ≥ 0
y ≥ 0
```

这已经是一份完整的线性规划模型。

## Inequality 约束表达“不能超过”或“至少达到”

容量约束常写成：

```text
resource use ≤ available capacity
```

例如：

```text
3x + 4y ≤ 240
```

含义是材料使用量不能超过 240。

服务或最低需求有时会写成：

```text
service ≥ minimum requirement
```

例如：

```text
shipments_to_region ≥ minimum_service
```

但是否使用 `=`、`≤` 或 `≥` 必须由业务语义决定，而不能为了“让 Solver 更容易”随意修改。

## Equality 约束通常代表严格平衡

典型流量守恒：

```text
inflow = outflow
```

或者：

```text
total_supply = demand
```

如果需求必须恰好满足且不允许超额配送，可以写：

```text
Σ shipments = demand
```

如果允许超额服务，则可能写成 `≥`；如果允许 shortage，就要引入额外变量，而不是把等式悄悄改掉。

因此 equality 往往对应最强的结构性业务关系。

## Non-negativity 是默认但不可忽略的业务规则

很多数量变量都需要：

```text
x ≥ 0
```

这看似明显，但数学模型不会自动知道“负生产量没有意义”。

在 PuLP 中通常用：

```python
LpVariable("x", lowBound=0)
```

在 Excel Solver 中则需要保证变量非负选项或显式下界。

变量 domain 是模型定义的一部分。

## 可行域是所有约束的交集

单独看材料约束：

```text
3x + 4y ≤ 240
```

它定义一大片允许区域。

单独看人工约束：

```text
2x + 5y ≤ 250
```

又定义另一片区域。

再加入：

```text
x ≥ 0
y ≥ 0
```

最终可行域是这四条规则同时成立的区域。

所以“加一个新约束”在几何上意味着：

> 从原有决策空间中删除一部分原本允许的方案。

约束越多，可行域通常越小或保持不变，不会凭空变大。

## 为什么线性规划经常在角点取得最优？

线性目标：

```text
Z = 42x + 58y
```

对应一族平行的等值线。

把等值线沿着“目标更大”的方向移动，最后一次接触可行域的位置通常发生在角点或一条最优边上。

因此二维线性规划可以通过枚举可行角点理解：

```text
(0,0)
(80,0)
(0,50)
材料线与人工线的交点
```

两条资源约束交点满足：

```text
3x + 4y = 240
2x + 5y = 250
```

解得：

```text
x = 200/7 ≈ 28.57
y = 270/7 ≈ 38.57
```

目标值：

```text
Z ≈ 3437.14
```

在当前数据中，这个角点优于其他角点。

## Binding constraint：最优点处资源被完全用满

如果某个约束在最优解满足：

```text
LHS = RHS
```

则称它为 binding constraint。

当前基准最优点：

```text
3x + 4y = 240
2x + 5y = 250
```

材料与人工都恰好用完，因此两个约束都 binding。

这表示：

> 当前最优解已经被这两个边界卡住。

但“binding”不自动等于“增加资源一定非常有价值”。它只是下一步敏感性分析的重要信号。

## Slack：还剩多少未使用资源

对于 `≤` 约束：

```text
Slack = RHS - LHS
```

例如某情景下人工使用 230，而可用 250：

```text
Slack = 250 - 230 = 20
```

说明有 20 单位人工资源未使用。

如果目标是最大化贡献而该资源存在正 slack，短期内增加更多相同资源通常不会改善当前解，因为原有资源尚未用完。

不过这只是局部判断；如果其他参数或约束改变，瓶颈可能转移。

## Binding 与 bottleneck 很接近，但不要机械等同

业务里常把 binding constraint 称作瓶颈，但需要谨慎：

- 一个约束 binding，说明当前解碰到它；
- 一个约束是否具有高经济价值，要看放宽它对目标的影响；
- 多个约束可以同时 binding；
- 整数模型中 binding/slack 的经济解释比纯 LP 更复杂。

所以更好的分析顺序是：

```text
先看 binding/slack
→ 再看 RHS 改变时目标怎样变化
→ 最后判断资源是否值得增加
```

## 约束移动会改变可行域形状

把材料上限从 240 提高到 260，相当于把材料约束边界向外移动。

可能发生三种情况：

```text
1. 最优点移动，目标提高
2. 最优点不动，因为材料不是当前瓶颈
3. 材料曾经是瓶颈，但放宽后瓶颈转移到人工
```

因此资源价值不是永久常数。

这正是互动可行域实验里需要关注的：滑动材料或人工容量时，最优点、slack 和 binding 状态会一起改变。

## Infeasible：约束之间没有共同交集

如果业务规则互相冲突，可能不存在任何可行解。

例如：

```text
要求至少生产 100 Premium
```

但人工上限只有 250，而每件 Premium 需要 5 人工：

```text
5 × 100 = 500 > 250
```

如果没有外包、加班或 shortage 变量，模型将 infeasible。

这不是 Solver “坏了”，而是当前规则组合无法同时满足。

模型调试应检查：

```text
需求是否过高？
容量是否单位错了？
某个等式是不是应该允许 slack？
是否漏掉外包/缺货/加急变量？
```

## Unbounded：目标可以无限改善

另一类异常是 unbounded。

例如目标：

```text
max 42x + 58y
```

却忘记所有资源上限，只保留：

```text
x,y ≥ 0
```

那么 x、y 可以无限增大，目标也无限增大。

Unbounded 常常意味着：

> 模型漏掉了应该限制规模的业务边界。

## Solver status 是结果的一部分

一份可靠的优化输出至少要检查：

```text
Optimal
Feasible
Infeasible
Unbounded
Not Solved / Undefined
```

不能先打印变量值，再假设这些变量一定代表可执行方案。

只有先确认求解状态，目标值和变量值才有正确语境。

## 约束的单位检查非常重要

例如：

```text
3 kg/unit × units = kg
```

因此材料约束左右两边都应是 kg。

如果一边是“每周人工小时”，另一边是“每天人工小时”，数学上仍然可以求解，但业务上已经错误。

建立模型时可以给每个参数加隐含单位标签：

```text
profit: $/unit
material_use: kg/unit
labour_use: hour/unit
capacity: kg/week
```

单位链能发现很多比代码语法更隐蔽的错误。

## 受约束优化的管理价值在于“说明为什么不能更好”

无约束模型可能说：

```text
想继续提高目标，就继续增加某个决策变量
```

受约束模型则可以解释：

```text
为什么停在这里？
是材料限制？
是人工限制？
是需求上限？
是合同规则？
```

这让最优解从一个数字变成一个结构化决策解释。

## 常见错误

### 把所有限制都写成等式

容量通常是上限，不一定必须完全用完。

### 把需求规则写错方向

“至少满足需求”和“不能超过需求”完全不同。

### 忘记 non-negativity 或整数属性

会产生负数量或分数车辆等无意义结果。

### 只看最优变量，不看 slack

会失去对资源瓶颈和潜在增量价值的理解。

### 看到 infeasible 就删约束

正确做法是先找业务冲突，而不是为了让模型“能跑”随意放松规则。

### 把二维角点规则机械推广到所有模型

角点几何解释非常适合 LP 直觉，但高维模型应依靠通用 LP 理论和求解器，而不是手工画图。

## 核心判断

受约束优化的核心是：

> **约束把决策空间缩成可行域，目标函数只在可行域内比较方案；binding 与 slack 解释最优点被哪些资源边界限制，而 Solver status 决定结果是否值得继续解释。**

下一篇进一步回答更接近管理决策的问题：如果多给一点材料、人工或容量，最优目标究竟能改善多少？
