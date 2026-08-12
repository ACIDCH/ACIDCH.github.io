---
translationKey: binary-milp-decisions
locale: zh
slug: binary-milp-decisions
title: 二进制决策与 MILP
summary: 很多决策不是“多少”，而是“要不要”。这里用设施开启和固定成本说明 binary variable 怎么工作，再讲 linking constraint、Big-M 和 MILP 为什么比连续模型更难求。
tags:
  - MILP
  - Binary Variable
  - Fixed Charge
topics:
  - 供应链优化
  - 决策建模
tools:
  - Excel Solver
  - Python
  - PuLP
series: 供应链与决策模型
seriesSlug: decision-models
order: 5
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes:
  - optimisation-sensitivity-analysis
---

## 有些决策只能选“是”或“否”

连续变量很适合表达生产量、运输量、库存和工时，但供应链里还有一类完全不同的选择：

```text
这个仓库开不开？
这个供应商选不选？
这条运输路线启不启用？
这台设备买不买？
```

这些选择不能用 0.37 个仓库或 0.62 次“开启”来表达。最自然的变量是 binary variable：

\[
y\in\{0,1\}
\]

通常约定：

```text
y = 1 → 开启 / 选择 / 启用
y = 0 → 关闭 / 不选 / 不启用
```

一旦模型里出现这类离散变量，就从普通 LP 进入了 Mixed Integer Linear Programming，也就是 MILP。

<div data-learning-slot="fixed-charge-milp"></div>

## 固定成本为什么需要二进制变量

假设 Central Hub 的固定开启成本是 1450，容量是 620。

如果只用连续流量变量 x 表示通过该枢纽的货量，固定成本很难正确表达。不能写成：

\[
1450x
\]

因为 1450 是“只要开了就付一次”，不是每运输一单位都支付。

更合适的做法是增加：

\[
y_{central}\in\{0,1\}
\]

然后把固定成本写成：

\[
1450y_{central}
\]

当 y=0 时成本为 0；当 y=1 时成本为 1450。这个结构正好符合“开门费”式的业务规则。

Harbour Hub 也可以同样定义：

\[
y_{harbour}\in\{0,1\}
\]

固定成本为：

\[
1120y_{harbour}
\]

## 只有 binary variable 还不够，还要把它和流量连起来

如果模型只写了固定成本，却没有限制流量和 y 的关系，求解器可能得到一种荒唐方案：

```text
hub 不开启
但仍然有货物流过
```

所以必须增加 linking constraint。

对 Central Hub：

\[
x_{central}\le620y_{central}
\]

当：

\[
y_{central}=0
\]

右边为 0，因此：

\[
x_{central}=0
\]

设施关闭时不能分配流量。

当：

\[
y_{central}=1
\]

约束变成：

\[
x_{central}\le620
\]

设施开启后，流量可以在容量范围内自由变化。

这就是 linking constraint 最核心的作用：把“是否开启”和“可以使用多少”绑在一起。

## 容量本身就是最好的 Big-M

很多逻辑约束会写成：

\[
x\le M\,y
\]

这里的 M 是一个足够大的上界，所以常被称为 Big-M。

问题是，M 并不是越大越安全。

如果 Central Hub 的真实最大容量明明是 620，却写：

\[
x_{central}\le1{,}000{,}000y_{central}
\]

数学上也许仍然正确，但 LP relaxation 会变得非常松，求解器更难排除不合理的分数解，数值稳定性也可能变差。

所以能用真实业务上界时，就直接用真实容量：

\[
x_{central}\le620y_{central}
\]

这是比“随便找一个特别大的 M”更好的建模习惯。

## LP relaxation 为什么会出现 0.4 个仓库

MILP 求解器通常会先看一个放松后的连续问题，把：

\[
y\in\{0,1\}
\]

暂时放宽成：

\[
0\le y\le1
\]

这叫 LP relaxation。

在放松模型里，可能出现：

```text
y = 0.4
```

它不是最终可执行答案，而是求解过程中用于建立上下界的信息。

如果 linking constraint 写得太松，y=0.4 可能允许大量流量通过，导致 relaxation 和真正的整数模型差距很大。求解器就需要更多 branch-and-bound 工作把分数解排除掉。

这也是 formulation strength 很重要的原因。

## 同一条业务规则，也有“强”和“弱”的写法

假设流量 x 无论如何都不可能超过 620。

写：

\[
x\le620y
\]

通常比：

\[
x\le1000000y
\]

更强，因为它更准确地描述了可行范围。

一个强 formulation 不会改变整数可行解，却能让 LP relaxation 更接近真正的整数问题，从而减少求解器搜索。

大型 MILP 里，模型慢不一定是“算法不行”，有时只是逻辑约束给得太宽。

## 最低使用量也可以和开启决策联动

有些合同不是“开了以后可以用 0 到容量上限”，而是只要启用，就必须达到最低量。

例如某供应商如果被选中，至少分配 180 单位，最多 420 单位：

\[
180y_A\le x_A\le420y_A
\]

当 yA=0：

\[
x_A=0
\]

当 yA=1：

\[
180\le x_A\le420
\]

这样一对上下界就把最低承诺量和最大能力同时写进模型。

这类结构在承运商合同、生产批量、设备启停和采购协议里都很常见。

## 逻辑关系可以直接写进 MILP

Binary variables 不只用来表示固定成本，还能表达很多业务规则。

### 两个方案最多选一个

\[
y_A+y_B\le1
\]

### 至少选一个

\[
y_A+y_B\ge1
\]

### 恰好选一个

\[
y_A+y_B=1
\]

### 只有选择 A 才能选择 B

如果 B 依赖 A：

\[
y_B\le y_A
\]

### A 和 B 必须一起出现

\[
y_A=y_B
\]

这些关系看起来简单，但它们把原本只能写在文字说明里的规则真正放进了可行域。

## Fixed-charge 模型为什么经常有“规模门槛”

设施开启要先支付固定成本，所以模型会在两种力量之间权衡：

```text
不开设施
→ 没有固定成本
→ 但可能使用更贵的运输路线

开启设施
→ 先支付固定成本
→ 之后可能获得更低的单位流量成本
```

因此，某个设施是否值得开往往取决于流量是否足够大。

需求很低时，固定成本摊不薄，关闭更划算；需求增加以后，新的枢纽可能突然变成最优选择。

这种“突然切换”正是整数模型和连续 LP 很不一样的地方。决策不会总是平滑地一点点改变。

## MILP 的敏感性更适合直接重新求解

在线性规划里，shadow price 可以提供很清楚的局部边际信息。但含 binary variable 时，增加一点资源未必立即改变结果。

例如需求从 610 增加到 611，可能仍然不值得开启新设施；需求达到某个门槛后，设施才突然从 0 变成 1，目标值结构也一起变化。

所以对 MILP 做敏感性分析时，更实用的方法通常是：

```text
改参数
→ 重新求解
→ 比较 y 的开关状态、连续变量和目标值
```

要特别关注 switch point，也就是决策从 0 跳到 1 的位置。

## Symmetry 会让求解器做重复工作

如果两个设施在所有参数上完全相同，模型可能存在对称解：

```text
开 A、关 B
```

和：

```text
关 A、开 B
```

目标值完全一样。

对业务来说这没问题，但对求解器来说可能意味着需要探索很多本质相同的分支。

大型模型中可以通过合理编号、轻微业务区分或 symmetry-breaking constraints 减少这种重复搜索。不过在小模型里不必为了“技术高级”刻意增加约束，先确认真的存在性能问题。

## Solver status、time limit 和 gap 都应该被记录

MILP 不应该只输出一组变量值。

更完整的结果至少要知道：

```text
Solver status
Objective value
Time used
Optimality gap（如果有）
```

如果求解器在 time limit 前找到一个很好但未证明全局最优的方案，这和正式 `Optimal` 不是同一件事。

在大规模问题中，接受一个 1% gap 的方案可能比再计算几小时追求理论最优更合理。关键是把这一点公开记录，而不是把“当前最好方案”写成“已经证明最优”。

## 用 PuLP 写一个简单的 binary linking structure

例如：

```python
import pulp as pl

model = pl.LpProblem("hub_choice", pl.LpMinimize)

flow = pl.LpVariable("flow", lowBound=0)
open_hub = pl.LpVariable("open_hub", cat="Binary")

model += 1450 * open_hub
model += flow <= 620 * open_hub
```

真正模型还会有需求、运输成本和其他设施，但结构已经很清楚：

```text
open_hub
→ 决定设施是否存在

flow
→ 决定使用多少

flow <= capacity × open_hub
→ 把两者连接起来
```

代码越复杂，这种结构化命名越重要。

## 一套实用的 MILP 检查顺序

1. 先确认哪些决策真的是离散的；
2. 定义 binary / integer variable，而不是事后四舍五入；
3. 固定成本只和开启变量相乘；
4. 用 linking constraint 阻止“关闭但仍使用”；
5. Big-M 尽量使用真实紧上界；
6. 检查最低使用量、互斥和依赖逻辑；
7. 查看 solver status 和 optimality gap；
8. 做参数情景时重新求解，观察开关状态是否变化；
9. 如果求解很慢，再检查 formulation strength 和 symmetry。

MILP 的价值就在于它允许模型说出非常现实的一句话：**有些选择不能做一半。** 只要把这些开关决策和连续流量正确连接起来，设施、合同和路径选择就能进入同一个优化框架。
