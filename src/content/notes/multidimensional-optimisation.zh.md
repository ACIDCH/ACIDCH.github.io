---
translationKey: multidimensional-optimisation
locale: zh
slug: multidimensional-optimisation
title: 多维优化模型：从二维矩阵扩展到产品、工厂、技能与时期
summary: 理解 0D 到 n-D 决策变量的业务含义，学习如何增加工厂、产品、原料、人员与时期维度，并控制参数索引、变量爆炸、稀疏组合、切片调试和高维结果解释。
tags:
  - Multi-dimensional Model
  - n-D Arrays
  - Indexed Variables
topics:
  - 供应链优化
  - 优化编程
tools:
  - Python
  - PuLP
series: 供应链与决策模型
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

## 增加维度的本质是增加业务区分能力

模型从：

```text
x = total production
```

扩展到：

```text
x[k,p]
```

并不是为了让公式更“高级”。

它表示业务开始需要区分：

```text
在哪个工厂 k
生产哪个产品 p
```

继续增加：

```text
x[k,p,v]
```

可能表示再区分原料品种 `v`。

再增加：

```text
x[k,p,v,s]
```

可能表示由不同技能类型 `s` 执行。

再加入时期：

```text
x[k,p,v,s,t]
```

模型就可以描述完整的跨工厂、产品、原料、人员与时间的计划。

<div data-learning-slot="model-scale"></div>

## 0D 到 n-D 可以理解为逐步增加决策粒度

```text
0D: x
```

一个总量。

```text
1D: x[p]
```

每个产品一个量。

```text
2D: x[k,p]
```

工厂 × 产品。

```text
3D: x[k,p,v]
```

工厂 × 产品 × 品种。

```text
4D: x[k,p,v,s]
```

再加入技能或员工类型。

```text
nD: x[...]
```

继续增加业务维度。

重要的是：每个 index 都必须有明确业务含义。

## 维度增加前先问“这个差异会改变决策吗？”

如果两个工厂的成本、能力、产能完全相同，而且业务不关心生产地点，那么加入工厂维度可能没有价值。

相反，如果：

```text
工厂容量不同
运输成本不同
某产品只能在某工厂生产
```

那么不加入工厂维度，模型就无法表达这些差异。

因此新增维度的判断标准是：

> **它是否承载了需要进入目标或约束的业务差异？**

## 参数维度不必和变量完全相同

假设变量：

```text
x[k,p,v,s]
```

产品利润只和产品有关：

```text
profit[p]
```

原料消耗与产品、品种有关：

```text
materialUse[p,v]
```

加工时间与工厂、产品、品种有关：

```text
time[k,p,v]
```

人工消耗与产品、技能有关：

```text
labour[p,s]
```

目标可以写：

```text
max Σ_k Σ_p Σ_v Σ_s profit[p] · x[k,p,v,s]
```

每个参数只保留真实需要的维度。

这样比把所有参数强行复制成四维更紧凑、更容易维护。

## 资源约束决定“哪些维度需要求和，哪些维度保留”

假设某种原料 `v` 有独立总量：

```text
Material[v]
```

约束需要保留 v，并把其他使用该资源的维度求和：

```text
Σ_k Σ_p Σ_s materialUse[p,v] · x[k,p,v,s] ≤ Material[v]
∀v
```

如果每个工厂有独立设备时间：

```text
Time[k]
```

则保留 k：

```text
Σ_p Σ_v Σ_s time[k,p,v] · x[k,p,v,s] ≤ Time[k]
∀k
```

如果每种技能有独立人工容量：

```text
Labour[s]
```

则保留 s：

```text
Σ_k Σ_p Σ_v labour[p,s] · x[k,p,v,s] ≤ Labour[s]
∀s
```

这是高维模型最关键的阅读技巧：

> **看约束右侧按哪个 index 变化，就知道左侧哪些 index 应该保留，其他维度通常被求和。**

## Dimension mismatch 会造成逻辑错误

例如工厂 k 有独立容量：

```text
capacity[k]
```

但约束误写成：

```text
Σ_k Σ_p x[k,p] ≤ capacity[k]
```

右侧还包含 k，但左侧已经把 k 求和掉，数学结构不一致。

正确应是：

```text
Σ_p x[k,p] ≤ capacity[k]  ∀k
```

这种索引错位在代码中可能表现为：

- 循环变量引用了外层最后一个值；
- 某些约束只生成一次；
- 所有设施共用一个容量；
- 参数 key 被错误广播。

因此高维模型必须同时审计数学索引和代码循环。

## 添加时期维度后，模型开始“跨时间耦合”

如果变量：

```text
production[p,t]
inventory[p,t]
```

库存平衡：

```text
inventory[p,t]
=
inventory[p,t-1]
+ production[p,t]
- demand[p,t]
```

这里 `t-1` 把相邻时期连接起来。

这类约束与普通单期容量不同，因为某一期决策会影响未来时期。

因此 time dimension 带来的不是简单“变量数量 × T”，而是**状态转移结构**。

## State variable 与 flow variable 的维度含义不同

多期供应链中可以把变量分成两类：

```text
Flow
→ 某个时期内发生的活动，例如 production[k,p,t]、shipment[k,r,t]

State
→ 某个时期结束后仍保留的状态，例如 inventory[r,p,t]、backlog[r,p,t]
```

Flow 通常在一个时期内产生和消耗资源；State 则通过 `t-1 → t` 把时期连接起来。

例如库存：

```text
inventory[p,t]
= inventory[p,t-1] + production[p,t] - demand[p,t]
```

如果把 inventory 错误地当作每期独立 flow，就可能漏掉跨期守恒关系。反过来，把 shipment 当作长期累积 state，也会造成重复结转。

因此加入时间维度时，不只要问“变量有没有 t”，还要问：

> **这个变量描述当期活动，还是描述期末状态？**

这决定它是否需要与上一期或下一期建立状态转移约束。

## 添加 binary dimension 会进一步增加求解难度

例如：

```text
y[k,t] = 1 if plant k is active in period t
```

变量数量可能并不巨大，但整数结构会增加 branch-and-bound 搜索。

所以模型难度不能只用变量数量判断。

还要看：

```text
continuous vs integer/binary
constraint tightness
Big-M quality
network structure
symmetry
time coupling
```

## Valid combinations 比完整笛卡尔积更重要

如果不是所有：

```text
plant × product × variety × skill
```

组合都可行，不应机械生成全部变量。

例如 Premium Kit 只能由 Master skill 在 South Plant 生产。

可以建立：

```text
A = set of valid (k,p,v,s) tuples
```

然后仅生成：

```text
x[a] for a ∈ A
```

这既减少变量，也把业务可行性直接编码到索引集合中。

## Sparse formulation 可以显著改善可读性和性能

完整笛卡尔积可能有：

```text
10 plants × 50 products × 20 regions × 12 periods
= 120,000 variables
```

如果实际只有 15% 的 plant-product-region 组合允许：

```text
18,000 valid combinations
```

只对 valid arcs 建变量，可以大幅降低规模。

这种稀疏思维在：

- 运输网络；
- 产品工厂资格；
- 供应商物料资格；
- 航线网络；
- 人员技能匹配；

中特别常见。

## 高维结果不应该直接打印全部变量

如果模型有几万个变量，打印：

```text
x_a_b_c_d = ...
```

几乎没有分析价值。

应该先转换成长表：

```text
plant | product | region | period | quantity
```

再做：

```text
过滤非零变量
按工厂汇总
按产品汇总
按时期趋势
检查容量利用率
检查需求满足率
```

模型结果需要回到业务维度才能解释。

## 聚合结果必须能回算到原始高维变量

高维模型常常向管理层展示：

```text
Total production by plant
Total transport cost by region
Inventory by period
```

这些汇总视图很有用，但必须保持可追溯关系。

例如：

```text
plant_total[k]
= Σ_p Σ_r Σ_t x[k,p,r,t]
```

如果结果表中的工厂总量与底层变量重新求和不一致，可能意味着：

```text
漏掉某个 index
重复聚合某些记录
结果提取时只保留了部分 valid combinations
过滤零值时误删了非常小但非零的量
```

因此可以建立 aggregation reconciliation：

```text
Grand total from detailed variables
= Grand total from plant summary
= Grand total from period summary
```

多个切片从不同维度汇总后应回到同一个总量。这个检查特别适合发现高维结果处理代码中的重复和漏项。

## Slice 是调试高维模型的核心方法

不需要一次理解整个 4D 数组。

可以固定部分 index：

```text
固定 plant = north
→ 查看所有 product × region
```

或者：

```text
固定 period = 3
→ 查看该期完整网络
```

或者：

```text
固定 product = premium
→ 查看不同工厂和时期
```

这种切片思维适用于数据检查、结果可视化和约束验证。

## 约束也要做 slice validation

例如要验证：

```text
每个工厂每期容量是否满足
```

可以输出：

```text
plant | period | used | capacity | slack
```

要验证需求：

```text
product | region | period | shipped | demand | gap
```

这比只看 solver status 更容易发现建模维度错误。

## 规模估算应在建模之前进行

在生成模型前，可以先计算：

```text
potential variable combinations
valid variable combinations
continuous variables
binary variables
constraint families
rows per family
```

如果规模远超预期，就先检查索引设计，而不是等 solver 卡住后再排查。

## 高维模型需要更严格的 naming convention

推荐统一 index 顺序：

```text
x[k,p,r,t]
```

代码、文档、结果表都保持：

```text
plant, product, region, period
```

不要在不同模块中交替：

```text
p,k,t,r
r,p,k,t
```

虽然数学上可以转换，但会大幅增加人为错误概率。

## 从二维到四维，目标函数可以保持结构稳定

二维：

```text
max Σ_k Σ_p profit[p] x[k,p]
```

三维增加原料品种：

```text
max Σ_k Σ_p Σ_v profit[p] x[k,p,v]
```

四维增加技能：

```text
max Σ_k Σ_p Σ_v Σ_s profit[p] x[k,p,v,s]
```

从结构上看，目标仍然是“单位贡献 × 数量”的求和。

复杂性主要转移到：

- 参数需要哪些索引；
- 约束保留哪些索引；
- 哪些组合有效；
- 结果怎样重新聚合。

## 常见错误

### 为每个新业务字段都增加一个变量维度

如果字段不改变决策或约束，不必进入变量 index。

### 所有参数都强制做成最高维

造成数据冗余和维护困难。

### 求和时把本应保留的 index 消掉

会把独立资源池错误合并。

### 忽略 valid combinations

生成大量永远为 0 或无业务意义的变量。

### 只检查总目标，不做切片验证

高维模型中的局部错误可能被总量掩盖。

### 变量多就直接认定需要更强 solver

先检查 formulation 是否稀疏、Big-M 是否紧、索引是否重复。

### 汇总表无法回算到底层变量

高维结果需要 aggregation reconciliation，防止结果提取阶段产生重复或漏项。

## 核心判断

多维优化的核心不是“把更多 index 加到 x 后面”，而是：

> **每增加一个维度，都必须明确它承载的业务差异；每条约束都要正确决定哪些维度保留、哪些维度求和；模型规模则通过稀疏组合、结构化数据和切片验证保持可控。**

下一篇把这些建模方法放回供应链规划：不同决策时间尺度下，网络设计、运输商选择和流量分配应该怎样建模与解释。
