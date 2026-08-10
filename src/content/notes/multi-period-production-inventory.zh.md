---
translationKey: multi-period-production-inventory
locale: zh
slug: multi-period-production-inventory
title: 多期生产与库存优化：用流量平衡连接今天与未来
summary: 把每期生产、需求、库存、setup cost、holding cost 与 shortage/backorder 放进同一时间网络，理解库存结转、批量生产、平滑计划、终端库存和滚动规划如何形成跨期优化决策。
tags:
  - Multi-period Planning
  - Inventory
  - Production Planning
topics:
  - 供应链优化
  - 生产与库存
tools:
  - Excel Solver
  - Python
  - PuLP
series: 供应链与决策模型
seriesSlug: decision-models
order: 10
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - inventory-optimisation
relatedNotes:
  - transportation-models
---

## 多期模型的关键不是“多复制几列”，而是时期之间互相影响

单期生产模型只需要决定：

```text
这一期生产多少？
```

多期模型则必须同时考虑：

```text
今天多生产的部分会进入库存
库存会成为下一期的可用供给
今天少生产可能导致未来 shortage 或 backorder
某次生产 setup 可以覆盖多个时期
```

因此时间维度的核心是**状态结转 state transition**。

<div data-learning-slot="supply-chain-flow"></div>

## 最基本的库存平衡方程

对每个时期 t：

```text
EndingInventory[t]
=
BeginningInventory[t]
+ Production[t]
- Demand[t]
```

并且：

```text
BeginningInventory[t+1] = EndingInventory[t]
```

合并后可以写成：

```text
Inventory[t]
=
Inventory[t-1]
+ Production[t]
- Demand[t]
```

这条方程把所有时期连接起来。

如果某一期生产过多，不会凭空消失；它会成为未来库存。

## 时间耦合让“本期最便宜”不一定是全局最优

假设第 4 期需求很高。

如果只逐期优化：

```text
Period 1 只看 Period 1
Period 2 只看 Period 2
...
```

可能等到第 4 期才发现产能不足。

多期模型可以提前生产并持有库存：

```text
Period 3 额外生产
→ EndingInventory[3] > 0
→ Period 4 可用
```

即使提前生产产生 holding cost，也可能比 shortage、加急或扩容便宜。

## 一个四期合成需求序列

```text
Period 1 demand = 180
Period 2 demand = 260
Period 3 demand = 150
Period 4 demand = 310
```

总需求：

```text
900
```

如果生产成本固定为：

```text
12 / unit
```

只看总生产量，所有满足 900 总产量的方案生产成本都相同。

真正改变总成本的是：

```text
setup cost
holding cost
shortage / backorder cost
capacity
```

## Setup cost 会推动模型减少生产启动次数

假设每次只要某期有生产，就产生：

```text
setupCost = 420
```

需要 binary variable：

```text
y[t] = 1 if production occurs in period t
       0 otherwise
```

生产量联动：

```text
Production[t] ≤ Capacity[t] · y[t]
```

目标加入：

```text
Σ_t setupCost[t] · y[t]
```

于是模型开始权衡：

```text
多次小批生产
→ inventory 较低
→ setup 次数较多

少次大批生产
→ setup 次数较少
→ inventory 较高
```

这就是典型 lot-sizing trade-off。

## Holding cost 给提前生产定价

如果期末库存：

```text
Inventory[t] > 0
```

通常产生：

```text
holdingCost[t] · Inventory[t]
```

持有成本可能代表：

- 仓储空间；
- 资金占用；
- 保险；
- 损耗；
- 过时风险；
- 搬运成本。

因此库存不是免费缓冲。

## Demand matching 是一个基准计划，不一定最优

最直接方案：

```text
Production[t] = Demand[t]
```

四期生产：

```text
180, 260, 150, 310
```

每期库存都回到 0。

优点：

```text
holding cost = 0
```

缺点：

```text
4 次 setup
```

合成数据中：

```text
Production cost = 900 × 12 = 10,800
Setup cost      = 4 × 420 = 1,680
Holding cost    = 0
Total           = 12,480
```

这个方案是很好的 benchmark，但不是因为直觉简单就一定最优。

## Smooth production 可能降低波动，却增加库存

例如每期固定生产：

```text
225, 225, 225, 225
```

库存轨迹：

```text
P1: 0 + 225 - 180 = 45
P2: 45 + 225 - 260 = 10
P3: 10 + 225 - 150 = 85
P4: 85 + 225 - 310 = 0
```

总正库存单位：

```text
45 + 10 + 85 = 140
```

如果 holding cost = 1.2：

```text
Holding cost = 168
```

setup 仍然是 4 次，因此：

```text
Total = 10,800 + 1,680 + 168
      = 12,648
```

生产更平滑，但在当前参数下总成本反而更高。

这说明：

> “平滑生产”是运营偏好，不是自动的经济最优。

## Batch production 可以用库存换 setup 节省

另一方案：

```text
440, 0, 460, 0
```

库存：

```text
P1: 440 - 180 = 260
P2: 260 - 260 = 0
P3: 460 - 150 = 310
P4: 310 - 310 = 0
```

只生产两次：

```text
Setup cost = 2 × 420 = 840
```

库存单位：

```text
260 + 310 = 570
```

持有成本：

```text
570 × 1.2 = 684
```

总成本：

```text
10,800 + 840 + 684 = 12,324
```

在当前合成参数下，这个批量方案优于 demand matching。

这并不证明“两批永远最好”，而是展示 setup 与 holding 的取舍。

## Production capacity 会限制批量策略

如果每期最大产能只有：

```text
300
```

那么：

```text
Production[1] = 440
```

就不可行。

必须加入：

```text
Production[t] ≤ Capacity[t]
```

如果还包含 setup binary：

```text
Production[t] ≤ Capacity[t] · y[t]
```

产能边界会决定可以提前生产多少。

## Initial inventory 必须明确

第 1 期平衡：

```text
Inventory[1]
=
InitialInventory
+ Production[1]
- Demand[1]
```

如果 `InitialInventory` 忘记定义，模型可能默认从 0 开始，但现实仓库可能已经有库存。

期初库存是参数，不是自动从模型里产生。

## Terminal inventory 决定模型是否“把问题推到窗口外”

如果规划到第 4 期就结束，模型可能为了降低成本把库存压到 0，或者在允许 shortage 时把未满足需求推到 horizon 之后。

可以加入终端条件：

```text
Inventory[T] ≥ safetyTarget
```

或者：

```text
Inventory[T] = targetEndingInventory
```

也可以给终端库存一个残值。

终端条件决定模型如何看待规划窗口之后的未来。

## Backorder 与 lost sales 不是同一个概念

如果需求没有当期满足，有两种常见含义。

### Backorder

需求被延期，未来仍需交付。

状态需要继续结转：

```text
Backlog[t]
=
Backlog[t-1]
+ Demand[t]
- Fulfilment[t]
```

### Lost sales

未满足需求永久流失。

通常使用：

```text
LostSales[t] ≥ 0
```

但不会像 backlog 一样自动进入下一期需求。

两者成本和客户影响不同，不能共用一个含糊的 `shortage` 变量而不解释语义。

## Allow backorder 与 no-backorder 是两种不同模型

如果不允许延期：

```text
Inventory[t] ≥ 0
```

并要求需求完全满足。

如果允许 backorder，可以用净库存：

```text
NetInventory[t]
```

允许为负，但需要对负值单独计 penalty。

更清晰的方法往往是分开：

```text
Inventory[t] ≥ 0
Backlog[t] ≥ 0
```

并建立流量平衡。

## Flow conservation 是多期库存模型的核心

可以把每个时期看成一个网络节点。

流入：

```text
Beginning inventory
Production
External supply
```

流出：

```text
Demand fulfilment
Ending inventory
Waste
```

因此库存优化和运输网络其实共享同一类思想：

> 数量不会凭空出现或消失，除非模型显式定义了来源或损失。

## Service level 可以进入约束

例如要求至少满足 98% 总需求：

```text
Σ fulfilment[t] ≥ 0.98 × Σ demand[t]
```

也可以逐期要求：

```text
Fulfilment[t] ≥ serviceTarget[t]
```

逐期约束比总量约束更严格，因为总量达标可能掩盖某一时期的大缺货。

服务水平口径必须与业务 KPI 一致。

## 多产品模型需要增加产品 index

```text
Production[p,t]
Inventory[p,t]
Demand[p,t]
```

库存平衡：

```text
Inventory[p,t]
=
Inventory[p,t-1]
+ Production[p,t]
- Demand[p,t]
```

如果产品共享生产线：

```text
Σ_p processingTime[p] · Production[p,t]
≤ AvailableTime[t]
```

这把产品组合和多期计划连接起来。

## 多工厂模型再增加 plant index

```text
Production[k,p,t]
```

每个工厂产能：

```text
Σ_p time[k,p] · Production[k,p,t]
≤ Capacity[k,t]
```

如果库存位于仓库而生产位于工厂，还需要 shipment variables，把生产和库存位置连接起来。

这就是高维供应链模型自然形成的过程。

## Rolling horizon 比一次性全年计划更接近现实

长期计划通常不会一次求解后全年不变。

Rolling horizon：

```text
1. 用最新数据求解未来若干期
2. 只执行最前面一段
3. 新需求与库存数据到达
4. horizon 向前滚动
5. 重新求解
```

优点是把优化和最新信息连接起来。

需要注意：频繁重优化也可能造成 plan nervousness，也就是计划反复变动。

因此可能需要冻结窗口或变更成本。

## Setup、holding、backorder 的权重决定计划形状

参数变化会系统性改变计划：

```text
setup cost ↑
→ 倾向更少、更大的生产批次

holding cost ↑
→ 倾向更靠近需求发生时生产

backorder penalty ↑
→ 更积极提前准备库存或扩产

capacity ↓
→ 更依赖提前生产或允许 shortage
```

这是一类非常适合情景循环和敏感性曲线的模型。

## 结果不仅要看 total cost

一个多期计划至少应展示：

```text
production by period
ending inventory by period
setups
shortage/backlog
capacity utilisation
service level
total cost breakdown
```

两个方案总成本接近时，库存峰值、setup 次数和服务风险可能完全不同。

## 常见错误

### 忘记库存结转

把每期当成独立模型，无法利用提前生产。

### Initial inventory 写错

会让所有后续时期库存都偏移。

### 只对总需求做平衡

可能在个别时期出现不可执行缺口。

### Setup cost 没有 binary linking

模型可能支付 0 setup 却产生正生产量。

### Terminal condition 缺失

模型可能利用 horizon 边界制造不现实结果。

### Backorder 与 lost sales 混用

会错误计算未来需求和服务影响。

### 只比较总成本

忽略库存峰值、产能压力和服务风险。

## 核心判断

多期生产与库存优化的核心是：

> **用流量平衡把每个时期连接起来，让生产、库存、setup、holding 与 shortage 的成本取舍在整个 planning horizon 上共同优化，而不是逐期做孤立决策。**

至此，供应链与决策模型主线已经从模型四要素、连续优化、约束、敏感性、MILP、Sets/Indices、PuLP 与高维模型，连接到网络运输和多期计划。后续可以在此基础上继续扩展 uncertainty、heuristics 与更大规模的现实求解策略。
