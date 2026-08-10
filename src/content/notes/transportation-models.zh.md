---
translationKey: transportation-models
locale: zh
slug: transportation-models
title: 供应链规划与运输分配：从战略网络到战术承运量
summary: 把战略、战术与运营决策放在同一供应链框架中，理解设施网络、运输分配、容量、需求平衡与承运商最低/最高限制如何形成可审计的优化模型，并区分长期结构决策与短期流量决策。
tags:
  - Transportation
  - Supply Chain Planning
  - Network Flow
topics:
  - 供应链优化
  - 运输决策
tools:
  - Excel Solver
  - Python
  - PuLP
series: 供应链与决策模型
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

## 供应链优化首先要区分“在哪个时间尺度做什么决定”

供应链里很多问题都可以写成成本最小化，但管理含义完全不同。

例如：

```text
是否建设一个新的配送枢纽？
```

和：

```text
下个月把多少货量分给 Carrier A？
```

都可以进入优化模型，却属于不同规划层级。

一个实用划分是：

```text
Strategic
→ 长期网络结构与能力配置

Tactical
→ 中期资源、合同与容量分配

Operational
→ 短期生产、运输、库存与履约执行
```

<div data-learning-slot="planning-horizon"></div>

## Strategic decisions：改变网络结构

战略决策常见问题：

```text
开几个设施？
设施建在哪里？
每个设施配置多少长期容量？
哪些市场由哪个节点覆盖？
```

这些决策通常具有：

- 固定投资大；
- 可逆性低；
- 影响周期长；
- 会改变后续所有战术和运营模型的可行空间。

因此常见变量包括：

```text
y[h] ∈ {0,1}
```

表示候选枢纽是否开启。

连续流量：

```text
x[h,r] ≥ 0
```

表示从枢纽 h 向区域 r 的配送量。

目标可能是：

```text
min fixed opening cost
  + transport cost
  + capacity cost
  + service penalty
```

这就是固定成本 MILP 与运输网络模型的结合。

## Tactical decisions：在既定网络上分配中期能力

假设网络已经存在，接下来可能需要决定：

```text
选择哪些运输商？
每家签多少容量？
哪些线路由哪家承担？
最低承诺量如何满足？
最大承运量如何分配？
```

这些决定通常比设施建设更容易改变，但又不是每天重新选择。

它们常与：

- 合同周期；
- 招标；
- lane bundle；
- volume commitment；
- capacity reservation；

相关。

## Operational decisions：把计划变成当期执行

运营层更关注：

```text
本周生产多少？
今天发多少？
库存怎么结转？
需求无法完全满足时如何处理？
```

这里时间粒度更细，状态变化更快。

因此运营模型需要更频繁地重新求解，也更依赖最新数据。

## 同一个业务问题可以跨三个层级连接

例如电商配送网络：

```text
Strategic
→ 是否开 Harbour Hub

Tactical
→ 为 South Plant 采购 Carrier B 的季度容量

Operational
→ 本周向 Coast 区域发多少货
```

这三个模型不是孤立的。

战略层决定有哪些设施可用；战术层决定有哪些合同能力；运营层只能在这些上层边界内执行。

因此模型之间应共享一致的主数据和容量定义。

## 运输模型的基本结构是“供给—需求—流量”

设：

```text
K = supply nodes
R = demand regions
x[k,r] = 从节点 k 发往区域 r 的数量
c[k,r] = 单位运输成本
```

目标：

```text
min Σ_k Σ_r c[k,r] x[k,r]
```

供给/容量：

```text
Σ_r x[k,r] ≤ capacity[k]   ∀k
```

需求：

```text
Σ_k x[k,r] = demand[r]     ∀r
```

如果所有需求必须完全满足且不允许超额配送，等式是最直接的表达。

## Demand must be addressed：总成本低不能以漏发为代价

如果只写目标：

```text
min transport cost
```

却没有需求约束，那么最便宜的方案往往是：

```text
所有 x = 0
```

运输成本为 0。

数学上完美，业务上完全错误。

因此“需求必须被处理”不是解释文字，而是模型最重要的一组 constraints。

## 供给不一定必须全部用完

工厂容量通常是：

```text
Σ_r x[k,r] ≤ capacity[k]
```

不是：

```text
Σ_r x[k,r] = capacity[k]
```

因为容量表示上限，而不是强制生产量。

如果业务确实要求最低利用率，则应单独加入：

```text
Σ_r x[k,r] ≥ minimumUtilisation[k]
```

不要用等式强迫所有设施满负荷。

## Balanced 与 unbalanced transportation problem

如果：

```text
total supply capacity = total demand
```

称作 balanced case。

如果不相等，仍然可以建模。

例如容量大于需求：

```text
Σ_r x[k,r] ≤ capacity[k]
```

多余容量保持 unused。

如果需求大于供应，则需要决定：

```text
允许 shortage？
允许外部采购？
允许加急运输？
允许延期？
```

否则模型可能 infeasible。

## Shortage variable 让“无法满足”变成可解释选择

如果允许缺货：

```text
Σ_k x[k,r] + shortage[r] = demand[r]
```

并在目标加入惩罚：

```text
+ penalty[r] · shortage[r]
```

这样模型不是默默漏发，而是显式量化：

```text
在哪个区域缺多少？
为什么缺？
避免缺货需要多少额外成本？
```

惩罚系数应由业务后果决定，不能随意设成一个很大的数字。

## 运输商选择可以简化成 volume allocation

现在考虑总干线需求 860，三家运输商：

```text
Carrier A
min 180
max 420
cost 7.2

Carrier B
min 120
max 360
cost 6.7

Carrier C
min 0
max 300
cost 7.8
```

决策：

```text
v[s] = 分配给运输商 s 的总货量
```

目标：

```text
min Σ_s unitCost[s] · v[s]
```

总流量平衡：

```text
Σ_s v[s] = 860
```

上下限：

```text
minVolume[s] ≤ v[s] ≤ maxVolume[s]
```

<div data-learning-slot="supply-chain-flow"></div>

## 最低承诺量改变“只选最便宜运输商”的直觉

Carrier B 单位成本最低：

```text
6.7
```

但最大承运量只有 360。

所以不可能把 860 全部给 B。

Carrier A 还有最低承诺 180。

模型需要同时考虑：

```text
单位成本
最大容量
最低承诺
总需求
```

因此成本排序不能直接替代优化模型。

## 如果运输商是“选了才有最低承诺”，需要 binary variable

有时最低承诺不是无条件存在，而是：

> 只有签约后，才必须至少给一定货量。

这时定义：

```text
y[s] ∈ {0,1}
```

然后：

```text
v[s] ≥ minVolume[s] · y[s]
v[s] ≤ maxVolume[s] · y[s]
```

如果 `y=0`：

```text
v=0
```

如果 `y=1`：

```text
min ≤ v ≤ max
```

这就是运输分配从 LP 变成 MILP 的典型路径。

## Lane-level 模型会增加一个维度

总量模型：

```text
v[s]
```

如果运输商在不同 lane 成本不同：

```text
x[s,l]
```

其中：

```text
S = carriers
L = lanes
```

目标：

```text
min Σ_s Σ_l cost[s,l] x[s,l]
```

每条 lane 的需求：

```text
Σ_s x[s,l] = demand[l]
```

每家运输商总量上限：

```text
Σ_l x[s,l] ≤ maxVolume[s]
```

这就是 Sets/Indices 对运输商分配的直接应用。

## Bundle bid 会引入组合逻辑

现实招标中，运输商可能不是逐条 lane 报价，而是：

```text
如果同时给 Lane A + B
→ 提供 bundle price
```

这需要 binary selection 和 linking constraints 表达“组合被选择时优惠才生效”。

因此真实运输采购模型常常从简单 LP 逐步扩展到 MILP。

## 运输成本矩阵应当作为参数表，而不是写死进公式

推荐结构：

```text
origin | destination | carrier | unit_cost | max_capacity | eligible
```

模型代码从这张表生成 valid arcs。

优点：

- 新增 lane 不需要改公式；
- 运输商资格可以成为 sparse set；
- 成本可以由数据流程更新；
- 更容易检查缺失报价。

## 服务质量可以进入目标或约束

只用运输成本可能忽略：

- on-time reliability；
- transit time；
- damage rate；
- capacity reliability；
- emissions。

有两种常见处理：

```text
Constraint approach
→ service ≥ threshold

Objective approach
→ cost + weighted penalty
```

两者含义不同。

约束表达“必须达到底线”，加权目标表达“可以用成本换服务”。

## 战略网络与战术运输模型应避免重复定义口径

如果战略模型中的区域需求是：

```text
monthly demand
```

战术运输模型却使用：

```text
weekly capacity
```

必须先转换到一致周期。

同样：

```text
设施容量
运输商容量
客户需求
```

要明确是重量、托盘、箱、订单还是车辆。

供应链优化最常见的错误之一，不是数学错误，而是单位与时间粒度错位。

## 结果解释需要回到网络结构

不要只输出：

```text
Total cost = 6,120
```

至少还应解释：

```text
每个节点承担多少流量？
每家运输商承担多少？
哪些容量 binding？
哪些 lane 使用替代运输商？
是否存在未利用容量？
成本节省来自哪里？
```

这让模型结果成为供应链决策，而不是一个目标函数数字。

## 常见错误

### 目标只有成本，没有 demand constraints

模型会选择不发货。

### 把 capacity 写成等式

错误地强迫所有供应节点满负荷。

### 只按单位成本排序运输商

忽略上下限和 lane eligibility。

### 最低承诺量和选择逻辑没有连接

可能出现未签约却分配货量，或签约后没有满足最低量。

### 总需求与 lane demand 双重计算

高维模型中容易把同一需求重复约束。

### 服务指标只写在结果讨论里

如果它是硬性要求，就必须进入 constraints。

## 核心判断

供应链规划与运输分配的核心是：

> **先确定决策属于哪一个时间尺度，再用流量变量、容量与需求平衡表达网络；战略层改变网络结构，战术层配置合同能力，运营层在既定边界内执行实际流量。**

下一篇继续沿时间维度展开：生产、库存和需求如何通过库存结转方程连接成一个多期优化模型。
