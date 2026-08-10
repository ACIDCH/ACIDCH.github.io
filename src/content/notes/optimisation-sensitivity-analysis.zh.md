---
translationKey: optimisation-sensitivity-analysis
locale: zh
slug: optimisation-sensitivity-analysis
title: 优化敏感性分析：资源松弛、影子价格与决策稳健性
summary: 从 binding、slack 与 RHS 变化进入优化敏感性分析，理解 shadow price 的局部边际含义、资源 willingness-to-pay、目标系数变化与情景分析，并明确 LP 敏感性结论在整数与非线性模型中的边界。
tags:
  - Sensitivity Analysis
  - Shadow Price
  - Slack
topics:
  - 供应链优化
  - 管理决策
tools:
  - Excel Solver
  - Python
  - PuLP
series: 供应链与决策模型
seriesSlug: decision-models
order: 4
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - constrained-optimisation
---

## 最优解之后，真正有价值的问题才刚开始

一个优化模型给出最优变量和目标值之后，管理者通常不会只问：

```text
最优方案是什么？
```

更重要的问题是：

```text
如果材料多 10 单位，会怎样？
如果需求提高，会怎样？
如果单位利润下降，原来的产品组合还合理吗？
哪一种资源最值得额外购买？
当前最优方案对参数变化是否稳定？
```

这些问题属于 sensitivity analysis。

它把模型从“一个静态答案”扩展成“参数变化—决策变化—目标变化”的关系图。

<div data-learning-slot="feasible-region-sensitivity"></div>

## Sensitivity 首先从 binding 与 slack 开始

上一章已经区分：

```text
Binding constraint
→ 最优解处 LHS = RHS

Non-binding constraint
→ 最优解处仍有 slack
```

如果某资源有明显 slack，例如：

```text
available labour = 250
used labour      = 220
slack            = 30
```

那么再增加少量相同人工通常不会改善当前 LP 目标，因为已有 30 单位闲置。

相反，如果材料约束 binding：

```text
used material = available material
```

就值得继续问：

> 放宽材料上限一个单位，目标能提高多少？

## Shadow price 是 RHS 的局部边际价值

在线性规划的适用条件下，一个约束的 shadow price 可以理解为：

> **在当前最优基结构保持有效的局部范围内，约束 RHS 增加 1 单位时，最优目标大约改变多少。**

如果最大化问题中某材料约束的 shadow price 为 6：

```text
材料容量 +1
→ 最优贡献约 +6
```

那么额外一单位材料的经济价值上限可以和采购价格比较。

如果额外材料成本为 4：

```text
marginal benefit 6 > marginal cost 4
```

增加资源可能有价值。

如果额外成本为 9：

```text
marginal benefit 6 < marginal cost 9
```

仅从当前模型口径看，不值得为这一单位支付 9。

这就是优化模型中的 willingness-to-pay 逻辑。

## Shadow price 不是永久价格

最容易犯的错误是把 shadow price 当成一个永远不变的资源价值。

实际上它是局部结果。

随着 RHS 持续增加，可能发生：

```text
原瓶颈被放松
→ 最优点移动
→ 另一个约束开始 binding
→ 原资源的 shadow price 改变甚至变成 0
```

所以敏感性报告通常会给出一个 RHS 的 allowable range。

只有在相应范围内，当前 shadow price 的线性解释才成立。

## 为什么资源价值会突然归零？

假设材料原本是瓶颈，而人工有 20 单位 slack。

增加材料后，模型可能继续提高生产，直到人工也被完全用满。

再继续增加材料：

```text
材料不再限制最优方案
人工成为唯一瓶颈
```

此时额外材料没有可用人工配合，材料的边际价值就可能降到 0。

这说明：

> 资源价值由整个约束系统共同决定，而不是由资源自身决定。

## RHS sensitivity 与目标系数 sensitivity 是不同问题

RHS sensitivity 问：

```text
如果资源容量、需求上限或服务要求改变，会怎样？
```

Objective coefficient sensitivity 问：

```text
如果产品利润、单位成本或惩罚成本改变，会怎样？
```

例如当前目标：

```text
max 42x + 58y
```

如果 Premium 的单位贡献从 58 降到 45，最优角点可能改变。

这不是资源边界移动，而是目标等值线的斜率发生变化。

因此两类敏感性应分开解释。

## Reduced cost 提供非基变量进入解的门槛直觉

标准 LP 敏感性分析中还会看到 reduced cost。

直觉上，它回答：

> 当前为 0 的变量，其目标系数需要改善多少，才可能值得进入最优解？

例如某运输路线当前流量为 0，不一定代表这条路线“永远不该使用”。

可能只是当前单位成本还不够有竞争力。

如果 reduced cost 表示成本需要下降 1.3 才会进入，那么它提供了一个采购谈判或路线改进的参考门槛。

具体正负号要结合最大化/最小化模型和求解器输出定义解释，不能只背一个固定口诀。

## 情景分析与敏感性分析不是完全相同

Sensitivity analysis 往往利用当前 LP 最优结构的局部性质。

Scenario analysis 则可以直接重新运行一组完整参数：

```text
Base case
High demand
Low capacity
Fuel cost shock
Supplier disruption
```

每个情景都重新求解。

优点是：

- 可以同时改变多个参数；
- 不依赖局部 allowable range；
- 适合解释管理情景；
- 可以用于 MILP 和复杂模型。

缺点是需要更多运行和结果整理，而且参数组合设计本身需要判断。

## 参数变化要观察的不只是目标值

例如材料增加 20 单位后：

```text
objective +120
```

只看这一个数字还不够。

还应检查：

```text
产品组合是否改变？
哪个约束从 binding 变为 slack？
新瓶颈是谁？
某个原本为 0 的变量是否进入？
容量扩张是否改变设施开启决策？
```

敏感性分析真正关心的是**结构变化**。

## Decision sensitivity：管理者更关心方案是否改变

有时目标值变化明显，但决策结构不变。

例如燃油成本上下波动 5%，同一运输商组合仍然最优，只是总成本变化。

这说明决策具有一定稳健性。

另一种情况是参数只变化 1%，最优设施就从 A 切换到 B。

这说明模型处在一个切换边界附近。

因此可以区分：

```text
Objective sensitivity
→ 目标值变化多少

Decision sensitivity
→ 最优决策结构是否改变
```

后者往往更影响执行风险。

## Integer/MILP 中不要机械套 LP shadow price

一旦模型含有 binary 或 integer variables：

```text
y ∈ {0,1}
```

目标函数对 RHS 的响应可能出现跳跃。

例如仓库容量增加 1 单位可能完全没有效果，直到容量达到某个阈值，模型才突然可以少开一个仓库。

这种非连续结构使经典 LP shadow price 的解释不再直接适用。

MILP 更可靠的管理分析通常是：

```text
改变参数
→ 重新求解
→ 比较目标与决策结构
```

也就是 scenario / re-optimisation approach。

## 非线性模型同样需要重新检查局部关系

非线性模型中的边际值可能随决策水平连续变化。

即使可以计算导数，也不能假设一个斜率能够覆盖大范围变化。

因此敏感性结论始终需要说明：

```text
基准点是什么？
变化范围多大？
模型类型是什么？
是否重新求解？
```

## Sensitivity 可以直接支持资源采购

一个实用结构：

```text
Step 1
识别 binding resource

Step 2
估计单位资源的目标边际价值

Step 3
比较资源采购或扩容成本

Step 4
检查 allowable range / 重新求解

Step 5
检查新瓶颈与决策结构
```

例如：

```text
额外 20 小时设备时间
采购成本 80 / hour
模型目标改善 110 / hour（当前局部范围）
```

若口径一致，则说明存在潜在净价值。

但仍应检查人工、原料或需求是否会很快成为新瓶颈。

## Sensitivity 也可以用于合同谈判

运输商最低承诺量、最大承运量、供应商最低采购量，都可以作为 RHS 或逻辑参数进行情景测试。

问题不只是：

```text
当前合同最优分配是多少？
```

还可以问：

```text
如果最低承诺从 180 降到 150，成本降低多少？
如果上限从 360 增到 400，是否改变运输商组合？
为了额外 40 单位容量，最高值得支付多少？
```

优化模型因此可以成为谈判基准，而不是只有一次性计划结果。

## 画“参数—结果曲线”通常比只列三个情景更有信息

如果某参数可以在合理范围内连续变化，可以系统性循环：

```text
for each parameter value:
    solve model
    record objective
    record selected decisions
    record binding constraints
```

然后观察：

```text
平滑区
拐点
决策切换点
平台区
不可行区
```

这比“低/中/高”三个点更容易发现结构边界。

## 常见错误

### 把 shadow price 当市场价格

它是模型中的边际目标价值，不是市场自动报价。

### 忽略 allowable range

局部斜率不能无限外推。

### 只改变一个参数却忘记现实参数会联动

例如扩产同时可能提高人工、能源和维护需求。

### 在 MILP 中直接照搬 LP sensitivity report

离散决策会破坏连续边际解释。

### 只报告目标变化，不报告决策变化

管理执行更关心是否要换供应商、开仓或改变产量结构。

### 看到 non-binding 就认定资源永远没有价值

参数变化后瓶颈可能转移。

## 核心判断

敏感性分析的核心不是“再跑几遍模型”，而是建立：

> **参数变化 → 可行域或目标结构变化 → 最优决策变化 → 目标价值变化 → 管理动作价值**

这一条可解释链。

下一篇加入二进制变量：当模型需要表达“开/不开、选/不选、启用/不启用”时，连续 LP 将扩展为 Mixed Integer Linear Programming。
