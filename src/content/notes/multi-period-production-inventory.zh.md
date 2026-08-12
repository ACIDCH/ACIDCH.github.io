---
translationKey: multi-period-production-inventory
locale: zh
slug: multi-period-production-inventory
title: 多期生产与库存优化
summary: 今天多生产一点，可能是在为下个月省一次开机成本；今天少生产，也可能把问题推成未来的缺货。这里用四个时期比较按需生产、平滑生产和批量生产三种计划。
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

## 多期问题的难点，是今天的决定会留到以后

单期生产模型只需要问：这一期生产多少？

加入时间以后，问题立刻变得不一样。今天多生产的部分不会消失，而是变成下一期库存；今天少生产，也可能留下 shortage 或 backorder。一次 setup 还可能覆盖未来几个时期的需求。

所以多期模型真正连接的是一连串状态：

```text
期初库存
+
本期生产
-
本期需求
=
期末库存
```

下一期再从这个期末库存继续往下走。

<div data-learning-slot="supply-chain-flow"></div>

## 最重要的一条式子是库存平衡

设：

\[
I_t=\text{时期 t 的期末库存}
\]

\[
Q_t=\text{时期 t 的生产量}
\]

\[
D_t=\text{时期 t 的需求}
\]

最基础的 inventory balance 是：

\[
I_t=I_{t-1}+Q_t-D_t
\]

这条式子把相邻时期真正连了起来。

如果 P1 多生产 40 单位，P1 期末库存就多 40；到了 P2，这 40 会成为可用供给，不需要重新生产。

多期模型如果只是把四个单期模型并排放在一起，却没有这条跨期平衡，就没有真正建出时间关系。

## 用四个时期看三种完全不同的生产计划

当前需求是：

| 时期 | 需求 |
| ---- | ---: |
| P1   |  180 |
| P2   |  260 |
| P3   |  150 |
| P4   |  310 |

总需求：

\[
180+260+150+310=900
\]

每单位生产成本都是 12，每次启动生产的 setup cost 是 420，每单位期末库存的 holding cost 是 1.2。

这组数据可以比较三种很直观的计划：

```text
Demand-match
→ 每期刚好生产当期需求

Smooth
→ 每期生产 225

Batch
→ P1 生产 440，P3 生产 460
```

三种计划都最终提供 900 单位，但成本结构完全不同。

## 按需生产几乎不留库存，但每期都要启动

Demand-match 计划：

```text
P1 180
P2 260
P3 150
P4 310
```

每期生产量刚好等于需求，所以库存一直为 0。

生产成本：

\[
900\times12=10800
\]

四个时期都有生产，因此 setup 次数是 4：

\[
4\times420=1680
\]

没有 holding cost，所以总成本：

\[
10800+1680=12480
\]

这是一种很“干净”的计划：没有提前生产，也没有库存，但为此付出了四次 setup。

## 平滑生产让产量稳定，却会产生库存

总需求 900，分四期平均：

\[
900/4=225
\]

Smooth 计划每期生产 225。

库存变化：

```text
P1: 0 + 225 - 180 = 45
P2: 45 + 225 - 260 = 10
P3: 10 + 225 - 150 = 85
P4: 85 + 225 - 310 = 0
```

期末库存累计：

\[
45+10+85+0=140
\]

holding cost：

\[
140\times1.2=168
\]

仍然每期生产，所以 setup cost 也是 1680。

总成本：

\[
10800+1680+168=12648
\]

平滑计划比按需生产更稳定，但在这组成本参数下，稳定生产带来的库存成本让总成本更高。

## 批量生产用库存换更少的 setup

Batch 计划：

```text
P1 440
P2 0
P3 460
P4 0
```

库存变化：

```text
P1: 0 + 440 - 180 = 260
P2: 260 + 0 - 260 = 0
P3: 0 + 460 - 150 = 310
P4: 310 + 0 - 310 = 0
```

总 holding units：

\[
260+0+310+0=570
\]

holding cost：

\[
570\times1.2=684
\]

只在 P1 和 P3 生产，所以 setup 次数是 2：

\[
2\times420=840
\]

生产成本仍然是 10800。

总成本：

\[
10800+840+684=12324
\]

在当前参数下，Batch 是三种计划中成本最低的。

## 最低成本为什么会偏向批量生产

三种计划的生产总量都是 900，所以生产成本完全相同。

真正不同的是：

```text
Demand-match
→ setup 多，库存少

Smooth
→ setup 多，也有库存

Batch
→ setup 少，但库存多
```

当前 setup cost 420 相对 holding cost 1.2 较高，所以模型愿意提前生产、持有库存，来减少启动次数。

如果 holding cost 大幅上升，Batch 的优势会变小；如果 setup cost 接近 0，按需生产就会更有吸引力。

这就是多期生产模型最核心的 trade-off。

## Setup cost 往往需要 binary variable

如果某期只要生产就支付一次 setup cost，可以定义：

\[
y_t\in\{0,1\}
\]

```text
y_t = 1 → 时期 t 开始生产
y_t = 0 → 时期 t 不生产
```

目标函数加入：

\[
\sum_t SetupCost_t\cdot y_t
\]

再用 linking constraint：

\[
Q_t\le M_ty_t
\]

如果 y=0，Q 必须为 0；如果 y=1，Q 可以在上限内生产。

M 最好使用真实生产能力，而不是一个随意特别大的数字。

## Holding cost 应该对应真正留下来的库存

如果 holding cost 按每期期末库存计费，目标里是：

\[
\sum_t h_tI_t
\]

这意味着一件产品如果从 P1 一直存到 P3，会经历多期持有成本。

所以“提前生产 100 单位”并不是只付一次库存费用。提前得越早，库存停留时间越长，总 holding cost 越高。

这一点正是批量大小和生产时点之间的关键权衡。

## 如果允许缺货，需要明确 shortage 和 backorder 是哪一种

有些模型允许当期需求暂时不满足。

这时需要先分清两种情况。

**Lost sales**：当期没卖掉就永远失去，不会留到下期。

**Backorder**：当期没满足的需求会结转，以后仍然要交付。

Backorder 可以定义：

\[
B_t\ge0
\]

平衡式也要相应扩展，不能简单把负库存和真实库存混成一个变量而不解释。

如果允许 backlog，目标函数通常还要加入 shortage penalty：

\[
\sum_t p_tB_t
\]

罚得越高，模型越不愿意延期满足需求。

## 期末库存条件会明显影响最后几个时期

多期模型必须明确规划期结束时库存应该怎样处理。

常见条件包括：

```text
I_T = 0
```

表示不希望规划期末留下多余库存。

或者：

```text
I_T ≥ safety stock
```

要求留出下一周期所需的安全库存。

如果完全不管 terminal inventory，而期末库存又没有价值或成本设置不合理，模型可能在最后一期做出不符合真实业务的行为。

终端条件本质上是在告诉模型：规划期结束不等于世界结束。

## 产能限制会让平滑和提前生产更重要

假设 P4 需求是 310，但 P4 最大产能只有 250。

那么即使 P4 单期生产成本最低，也不可能在 P4 当期满足全部需求。必须在更早时期提前生产至少 60，并通过库存带到 P4。

此时 inventory 不再只是为了省 setup cost，而是为了满足未来的 capacity shortage。

多期模型特别适合处理这种情况：某个时期的资源约束可以通过其他时期的提前生产来缓冲。

## Rolling planning 用新信息不断重算，而不是一次锁死全年

实际业务很少在年初就准确知道未来所有需求和成本。

更常见的做法是 rolling horizon：

```text
先优化未来若干期
↓
执行最近一期
↓
拿到新的需求和库存信息
↓
把窗口向前滚动
↓
重新优化
```

这样，远期计划可以保留方向，近期计划则随着新信息不断更新。

滚动规划并不否定优化模型，反而更符合优化的使用方式：模型是反复更新的决策工具，不是一张生成一次就永远不变的年度表。

## 多期结果至少要核对三种平衡

求解以后，最好逐期检查：

### 库存平衡

\[
I_t-I_{t-1}-Q_t+D_t=0
\]

### 总量平衡

如果起始和终端库存都为 0：

\[
\sum_t Q_t=\sum_t D_t
\]

当前例子就是：

\[
900=900
\]

### 成本回算

```text
production cost
+
setup cost
+
holding cost
+
shortage cost（如果有）
```

应当和模型目标值一致。

这些检查能避免“变量看起来合理，但跨期平衡有一处漏写”的问题。

## 三种计划放在一起，差异就很清楚

| 计划         | Setup 次数 | Holding units | 总成本 |
| ------------ | ---------: | ------------: | -----: |
| Demand-match |          4 |             0 |  12480 |
| Smooth       |          4 |           140 |  12648 |
| Batch        |          2 |           570 |  12324 |

当前成本下，Batch 最便宜，但这不是一条普遍规律。

换一组 setup cost、holding cost、产能或需求，最优计划就可能改变。因此，这张比较表的价值不是记住 12324，而是看懂不同成本参数如何推动计划在“频繁生产”和“提前囤货”之间移动。

## 一套实用的多期建模顺序

1. 明确每个时期的需求、产能和生产成本；
2. 定义生产量和期末库存；
3. 用 inventory balance 把相邻时期连起来；
4. 如果有 setup cost，增加 binary variable 和 linking constraint；
5. 决定是否允许 shortage / backorder；
6. 明确初始库存和 terminal inventory；
7. 求解后逐期检查库存平衡；
8. 独立回算 setup、holding 和生产成本；
9. 改变 setup cost、holding cost、产能和需求做情景比较；
10. 实际执行时采用 rolling horizon，用最新信息重新优化。

多期生产与库存优化最值得理解的，不是把一张单期模型横向复制很多列，而是承认一个事实：**今天的生产选择会改变明天拥有多少库存，也会改变未来还需要付什么成本。**
