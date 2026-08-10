---
translationKey: binary-milp-decisions
locale: zh
slug: binary-milp-decisions
title: 二进制决策与 MILP：把“开不开、选不选”写进优化模型
summary: 用设施开启、固定成本与 linking constraints 理解 binary variables 和 Mixed Integer Linear Programming，进一步讨论 Big-M、容量联动、LP relaxation、逻辑约束与路径选择中的离散结构。
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

## 很多供应链决策不是“多少”，而是“是否”

连续变量适合表达：

```text
生产多少
运输多少
库存多少
使用多少工时
```

但很多现实选择具有开关性质：

```text
是否开启仓库
是否选择某运输商
是否增加一班生产
是否启用加急能力
是否安排维护
是否走某条路线
```

这类变量最自然的表达是：

```text
y ∈ {0,1}
```

其中：

```text
0 = 否 / 未开启 / 未选择
1 = 是 / 开启 / 选择
```

当线性模型同时含有连续变量与整数/二进制变量，就进入 Mixed Integer Linear Programming，简称 MILP。

<div data-learning-slot="fixed-charge-milp"></div>

## Fixed charge 是 MILP 最典型的业务结构之一

假设候选枢纽 `h` 只要开启，就产生固定成本：

```text
fixedCost[h]
```

无论实际配送 10 单位还是 500 单位，只要开仓就要付这笔成本。

可以定义：

```text
y[h] = 1 if hub h is open
       0 otherwise
```

固定成本进入目标：

```text
min total_variable_cost + Σ fixedCost[h] · y[h]
```

这和普通连续单位成本不同。

连续成本随流量线性增加，而 fixed charge 是一个离散跳跃：从 0 直接跳到整笔成本。

## 只有 fixed cost 还不够，需要 linking constraint

如果只写：

```text
min transport_cost + fixedCost · y
```

但没有把 y 和流量 x 连起来，模型可能出现荒谬情况：

```text
y = 0
x > 0
```

也就是“仓库没开，但仍然在发货”。

因此需要 linking constraint：

```text
Σ_r x[h,r] ≤ capacity[h] · y[h]
```

它同时表达两种状态。

当：

```text
y[h] = 0
```

右侧变成：

```text
capacity[h] × 0 = 0
```

所以：

```text
Σ_r x[h,r] ≤ 0
```

仓库不能发货。

当：

```text
y[h] = 1
```

右侧恢复为真实容量，仓库最多发送 capacity[h]。

这就是二进制变量把逻辑规则嵌进线性模型的关键方式。

## Linking constraint 比文字说明更重要

业务文档可以写：

> 只有开启仓库才能配送。

但如果这句话没有变成数学约束，求解器不会自动理解。

因此逻辑建模需要问：

```text
哪个连续变量依赖哪个 binary variable？
当 y=0 时，连续变量应该被强制到什么范围？
当 y=1 时，允许范围是什么？
```

把这个逻辑写成线性不等式，才真正成为模型的一部分。

## Big-M 是通用 linking 思路，但 M 不能随便取

常见结构：

```text
x ≤ M y
```

其中 M 是一个足够大的上界。

当 y=0：

```text
x ≤ 0
```

当 y=1：

```text
x ≤ M
```

问题在于“足够大”不等于“越大越好”。

如果真实业务最大容量只有 620，却写：

```text
M = 1,000,000,000
```

虽然逻辑可能仍然正确，但会让 LP relaxation 非常松，增加求解难度，并削弱模型数值质量。

因此更好的原则是：

> **M 应该尽量使用业务上可证明的紧上界。**

设施模型中，直接用真实容量：

```text
x ≤ capacity · y
```

通常比随意 Big-M 更好。

## Binary variable 也可以表达“最多选几个”

例如三个候选运输商：

```text
y_A, y_B, y_C ∈ {0,1}
```

如果最多选择两家：

```text
y_A + y_B + y_C ≤ 2
```

如果恰好选择一家：

```text
y_A + y_B + y_C = 1
```

如果至少选择两家以分散风险：

```text
y_A + y_B + y_C ≥ 2
```

这类 cardinality constraints 很常见。

## “如果 A，则 B”可以转成逻辑约束

对于 binary variables：

```text
A ⇒ B
```

可以写成：

```text
y_A ≤ y_B
```

如果 A 被选择：

```text
y_A = 1
```

那么必须有：

```text
y_B = 1
```

如果 B 没被选择：

```text
y_B = 0
```

A 也只能为 0。

这可以表达：

```text
启用加急班次前必须启用基础班次
选择卫星仓前必须开启主枢纽
某设备扩容只能在设备已购置时发生
```

## “A 和 B 不能同时选”也很直接

```text
y_A + y_B ≤ 1
```

例如两个互斥合同、两种无法共存的配置。

“至少选一个”：

```text
y_A + y_B ≥ 1
```

“恰好选一个”：

```text
y_A + y_B = 1
```

二进制变量的价值就在于它可以把大量业务逻辑变成线性表达。

## 最低承诺量也可以和 binary 联动

假设选择运输商 s 后，至少要给它 120 单位：

```text
x[s] ≥ 120 · y[s]
```

同时最大承运量：

```text
x[s] ≤ 360 · y[s]
```

那么：

```text
y[s] = 0 → x[s] = 0
y[s] = 1 → 120 ≤ x[s] ≤ 360
```

这样“是否签约”和“分配多少”被连接成一个完整商业规则。

## LP relaxation 帮助理解 MILP 为什么更难

如果暂时把：

```text
y ∈ {0,1}
```

放松成：

```text
0 ≤ y ≤ 1
```

得到 LP relaxation。

这时模型可能允许：

```text
y = 0.43
```

数学上代表“只支付 43% 固定成本并获得 43% 容量”。

现实中这可能完全不可执行。

但 LP relaxation 非常重要，因为 MILP 求解器会利用它获得边界，再通过 branch-and-bound 等方法逐步排除分数解。

## Integrality gap 是连续放松与整数现实之间的差距

对于最小化问题：

```text
LP relaxation objective ≤ MILP objective
```

因为 LP relaxation 允许更多方案。

两者之间的差距反映离散要求带来的成本。

如果 relaxation 很松，求解器需要更多搜索才能证明最优。

这也是紧 Big-M、强 linking constraints 和良好模型结构的重要原因。

## 强 formulation 往往比单纯换更快硬件更重要

两个数学上等价的 MILP，求解速度可能差很多。

例如已知设施真实容量只有 620，却使用：

```text
x ≤ 1,000,000 · y
```

会产生很弱的 relaxation。

如果改成：

```text
x ≤ 620 · y
```

整数可行解集合没有改变，但连续 relaxation 更接近真实离散结构，求解器可以更快得到有效边界。

同样，如果业务已经知道：

```text
至少需要开启 2 个节点
```

把这一规则显式加入：

```text
Σ_h y[h] ≥ 2
```

通常比让 branch-and-bound 自己反复发现“开一个节点容量不够”更有效。

因此 MILP 建模不仅要问“逻辑对不对”，还要问：

```text
上界是否尽量紧？
已知业务逻辑是否显式写入？
是否存在重复或对称选择？
relaxation 是否过于宽松？
```

## 对称性会让求解器重复探索等价方案

如果两个候选设施在所有参数上完全相同，模型可能存在：

```text
Open A, close B
```

和：

```text
Close A, open B
```

两种完全等价的方案。

对业务来说它们没有区别，但求解器仍可能在多个对称分支间搜索。

大型模型中，可以通过业务上合理的 symmetry-breaking rule 减少重复搜索。例如在两个真正可互换的候选项中规定：

```text
y_A ≥ y_B
```

表示如果只开一个，优先把 A 作为代表。

这种约束只能在对象确实可互换时使用；如果 A、B 存在地理、风险或运营差异，就不能为了求解速度随意强制顺序。

## Routing / TSP 是 binary matrix 的典型应用

路径选择可以定义：

```text
x[i,j] = 1 if travel from i to j
         0 otherwise
```

目标：

```text
min Σ_i Σ_j distance[i,j] · x[i,j]
```

基本访问约束：

```text
每个节点恰好离开一次
每个节点恰好进入一次
```

但仅有这些规则仍可能产生多个彼此独立的小环，而不是一条完整路线。

这就是 subtour 问题。

因此 TSP 还需要额外 subtour elimination 结构，确保所有节点属于同一个连通巡回。

这一例子说明：

> binary matrix 能表达“选哪些边”，但完整业务结构常常需要额外逻辑约束。

## MILP 的最优解不再具有平滑边际性质

连续 LP 中，增加一点资源可能产生平滑的小变化。

MILP 中，变化可能是跳跃的：

```text
容量 +1 → 无变化
容量 +1 → 无变化
容量再 +1 → 突然可以关闭一个仓库
```

所以经典 LP shadow price 不应机械套在 MILP 上。

对整数模型更稳妥的做法通常是：

```text
修改参数
→ 重新求解
→ 比较目标值
→ 比较 binary 决策是否切换
```

## 时间限制下的 feasible solution 不等于已证明最优

大型 MILP 可能设置 time limit。求解器在时间结束时可能已经找到一个很好、而且完全满足约束的整数方案，但还没有证明不存在更好的方案。

这时需要区分：

```text
Incumbent
→ 当前找到的最好整数可行解

Best bound
→ 由搜索得到的最优目标理论边界

Optimality gap
→ incumbent 与 bound 之间的距离
```

例如最小化模型当前最好成本为 10,100，而 best bound 为 10,000，则相对 gap 大约为 1%。

管理报告不能把这种结果写成“已得到 global optimum”，更准确的表述是：

```text
在给定时间限制下获得可行方案，当前 gap 为约 1%
```

是否接受这个 gap 取决于决策价值、模型运行频率和额外计算时间的收益。日常滚动计划可能接受小 gap，而重大设施投资可能值得投入更多时间证明更接近全局最优。

## Fixed cost 会改变“规模经济”的决策逻辑

如果没有固定成本，模型可能倾向把流量分散到多个设施，只要单位运输成本更低。

加入固定开启成本后：

```text
多开一个设施
→ 可能降低运输成本
→ 但增加一整笔固定成本
```

因此模型开始权衡：

```text
网络集中化
vs
网络分散化
```

这正是设施选址、仓网设计、生产线启用和供应商选择中的核心结构。

## MILP 结果应该同时解释连续与离散决策

不要只报告：

```text
Objective = 12,430
```

还要解释：

```text
哪些设施开启？
哪些运输商被选？
每个开启设施承担多少流量？
哪个容量约束 binding？
哪个 fixed charge 被避免？
如果某 binary 决策翻转，目标会怎样？
```

MILP 的价值在于把“结构选择”和“数量分配”放在同一模型里。

## 常见错误

### 有 binary variable，却没有 linking constraint

会出现“未开启但仍使用”的逻辑漏洞。

### M 取得极大

模型逻辑可能没错，但 relaxation 很弱，求解效率和数值质量下降。

### 把 binary 写成 integer 但忘记上下界

`integer` 可能允许 2、3、4，而业务只允许 0/1。

### 只约束最大量，没有最低承诺量

如果合同要求选中后至少分配一定数量，必须另写下界联动。

### TSP 只写进出一次

可能得到多个 subtours，而不是完整巡回。

### 直接使用 LP sensitivity 解释 MILP

离散切换会破坏连续边际解释。

### 把 time-limit solution 直接写成 optimal

必须同时检查 solver status、best bound 与 optimality gap。

## 核心判断

MILP 的核心不是“把变量改成 binary”，而是：

> **用二进制变量表达结构性选择，再通过 linking、cardinality 与逻辑约束把这些选择和连续业务活动可靠连接起来。**

下一篇进入模型规模：当变量从一个数字扩展成产品 × 工厂 × 客户 × 时期的矩阵和高维数组时，Sets 与 Indices 将成为模型可维护性的基础。
