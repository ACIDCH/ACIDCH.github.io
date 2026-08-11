---
translationKey: pulp-model-architecture
locale: zh
slug: pulp-model-architecture
title: PuLP 建模
summary: 数学模型写清楚以后，怎样把它变成一段能检查、能扩展的 Python 代码？这里按集合、参数、变量、目标、约束和求解结果整理一套 PuLP 建模结构。
tags:
  - PuLP
  - Optimisation Programming
  - Model Architecture
topics:
  - 供应链优化
  - 优化编程
tools:
  - Python
  - PuLP
  - CBC
series: 供应链与决策模型
seriesSlug: decision-models
order: 7
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes:
  - sets-indices-model-scale
---

## PuLP 负责“表达模型”，不等于它自己就是求解器

开始写优化代码时，最容易混淆的是 Python、PuLP 和 Solver 各自在做什么。

可以把整个过程分成几层：

```text
Python
→ 处理数据、集合、循环、结果整理

PuLP
→ 把目标函数、变量和约束组织成优化模型

Solver
→ 真正执行求解算法
```

例如 CBC 是常见的开源 MILP solver。PuLP 可以把模型交给 CBC，也可以在合适环境中连接其他求解器。

这一区分很重要。`LpVariable` 是 PuLP 的建模对象，branch-and-bound 则是求解器内部的工作。代码报错和求解状态异常也要分别判断来源。

<div data-learning-slot="pulp-model-anatomy"></div>

## 代码结构最好和数学模型保持同一个顺序

一份容易复查的优化程序，可以按照下面的顺序组织：

```text
1. Sets
2. Parameters
3. Model
4. Decision variables
5. Objective
6. Constraints
7. Solve
8. Status check
9. Result validation
```

这样拿着数学模型对照代码时，不需要在文件里来回寻找。

如果参数、变量和约束交叉散落在几十个 cell 里，模型一旦变大就很难判断某个数字到底从哪里来的。

## Sets 先定义模型有哪些对象

运输模型可能有：

```python
plants = ["north", "south"]
regions = ["metro", "coast", "inland"]
```

产品模型可能还有：

```python
products = ["core", "premium"]
```

集合应该尽量来自数据，而不是在多个地方重复手写。

如果 `regions` 在一处有 3 个区域，在另一处又手动写了一份只有 2 个区域的列表，后面的约束很容易漏生成。

因此，一组业务对象最好只有一个可信来源。

## Parameters 用普通 Python 数据结构保存就够了

例如需求：

```python
demand = {
    "metro": 360,
    "coast": 280,
    "inland": 220,
}
```

工厂容量：

```python
capacity = {
    "north": 520,
    "south": 420,
}
```

运输成本：

```python
transport_cost = {
    ("north", "metro"): 4.2,
    ("north", "coast"): 5.4,
    ("north", "inland"): 6.1,
    ("south", "metro"): 5.1,
    ("south", "coast"): 3.9,
    ("south", "inland"): 4.6,
}
```

这些都是模型输入，不需要做成 PuLP 变量。

把参数和决策变量分开后，代码含义会非常清楚：普通 Python 数字是已知数据，`LpVariable` 才是求解器需要决定的量。

## 建立 Model 时先说清楚是最大化还是最小化

最小化问题：

```python
model = pl.LpProblem("transport_plan", pl.LpMinimize)
```

最大化问题：

```python
model = pl.LpProblem("product_mix", pl.LpMaximize)
```

模型名称也值得写得清楚。以后导出 `.lp` 文件或查看日志时，一个有业务含义的名称比 `Problem1` 更容易追踪。

目标方向如果设反，求解器仍然可能正常运行，因此这属于必须人工检查的基础项。

## LpVariable.dicts 适合创建一整族变量

运输量可以按工厂和区域创建：

```python
flow = pl.LpVariable.dicts(
    "flow",
    (plants, regions),
    lowBound=0,
)
```

以后可以直接引用：

```python
flow["north"]["metro"]
```

如果是整数或二进制变量，可以设置类别：

```python
open_hub = pl.LpVariable.dicts(
    "open_hub",
    hubs,
    cat="Binary",
)
```

变量类型应该在这里就定义好，而不是求解后再把连续结果四舍五入。

## lpSum 用来表达按索引求和

运输总成本可以写成：

```python
model += pl.lpSum(
    transport_cost[k, r] * flow[k][r]
    for k in plants
    for r in regions
)
```

它对应数学表达：

\[
\min \sum_k\sum_r c_{k,r}x_{k,r}
\]

`lpSum` 的意义不只是语法方便。它能让代码保持和数学求和符号相同的结构。

检查这段代码时，重点看三件事：

```text
成本参数的索引顺序对不对？
变量索引对不对？
循环集合有没有漏掉维度？
```

高维模型里，很多 bug 就藏在这些索引错位中。

## 约束最好一类规则写在一块

每个区域需求必须满足：

```python
for r in regions:
    model += (
        pl.lpSum(flow[k][r] for k in plants) >= demand[r],
        f"demand_{r}",
    )
```

每个工厂不能超过容量：

```python
for k in plants:
    model += (
        pl.lpSum(flow[k][r] for r in regions) <= capacity[k],
        f"capacity_{k}",
    )
```

给约束命名很有价值。出现 infeasible 或需要查看 slack 时，`capacity_north` 比系统自动生成的 `_C17` 更容易理解。

约束名称也可以直接体现索引，从而帮助检查是否每个对象都生成了一条规则。

## 建模完成后先数一遍变量和约束

正式求解前，可以做一个简单 sanity check：

```python
print("variables:", len(model.variables()))
print("constraints:", len(model.constraints))
```

如果理论上应该有 6 个运输变量，结果却出现 9 个，就应该先查集合和变量创建逻辑。

如果 3 个区域应该生成 3 条需求约束，却只出现 2 条，也不必等求解结果异常以后才发现。

这种数量核对对于 indexed model 很有效，因为很多漏项问题本质上就是“应该生成 N 条，却只生成了 N-1 条”。

## Solve 之前可以把模型导出来检查

PuLP 可以导出 LP 文件：

```python
model.writeLP("transport_plan.lp")
```

它会把最终交给求解器的目标和约束写成可读文本。

当代码逻辑比较复杂时，直接看 LP 文件有时比盯 Python 循环更容易发现：

- 某个变量漏了；
- 某条约束方向写反；
- 某个成本重复计算；
- 参数索引错位。

这一步尤其适合“代码看起来没问题，但求解结果很奇怪”的情况。

## Solver status 必须先检查，再读取变量值

求解：

```python
status = model.solve(pl.PULP_CBC_CMD(msg=False))
print(pl.LpStatus[status])
```

常见状态可能包括：

```text
Optimal
Infeasible
Unbounded
Not Solved
```

只有状态符合预期以后，变量值才有正常解释。

如果模型 infeasible，却仍然直接把变量对象里的数值拿去做业务报告，很容易得到误导结果。

因此，代码最好明确写出状态门槛：

```python
if pl.LpStatus[status] != "Optimal":
    raise RuntimeError("Model did not solve to optimality")
```

对于设置 time limit 的大型 MILP，则需要根据求解器返回信息判断是否接受当前 incumbent 和 gap，而不能简单要求所有问题都必须完全最优。

## 结果读取后还要重新计算业务指标

最优变量可以通过：

```python
pl.value(flow[k][r])
```

读取。

但结果验证不应该停在“打印变量”。最好独立重算：

```text
总需求是否满足？
每个工厂总流量是否超容量？
目标值是否能由变量 × 成本重新算出来？
binary variable 是否确实为 0/1？
```

例如总成本可以用普通 Python 再算一遍：

```python
recomputed_cost = sum(
    transport_cost[k, r] * pl.value(flow[k][r])
    for k in plants
    for r in regions
)
```

再和：

```python
pl.value(model.objective)
```

比较。

独立复算能发现很多模型表达和结果整理之间的错误。

## 只显示非零变量，结果会清楚很多

大型模型里变量可能有几百甚至几千个。逐个打印所有 0 通常没有价值。

可以只显示有实际决策的变量：

```python
for variable in model.variables():
    value = variable.value()
    if value is not None and abs(value) > 1e-8:
        print(variable.name, value)
```

再按业务维度做汇总，例如：

```text
每个工厂总发货量
每个区域收到多少
每个产品生产多少
每期库存多少
```

优化模型内部可以复杂，最终输出应该重新回到管理问题。

## 把数据准备、建模和结果整理分开

一份可维护的程序不应该把所有东西塞在同一个长 cell 里。

比较清楚的结构是：

```text
load / validate data
↓
build parameters
↓
build model
↓
solve
↓
validate solution
↓
format outputs
```

这样如果需求数据更新，只需要替换输入；如果模型逻辑改变，主要改 build model 部分；如果报告格式变化，不必碰约束代码。

这比“每次改一点就复制整段 notebook”更适合长期维护。

## PuLP 代码最常见的错误不是语法错误

很多模型可以顺利运行，却仍然是错的。

常见问题包括：

### 索引顺序写反

```python
cost[r, k]
```

实际字典却是 `(k, r)`。

### 漏掉一组约束

变量创建完整，但某些区域没有需求约束。

### 目标方向设错

成本问题写成 `LpMaximize`。

### binary variable 没有和连续变量连接

设施关闭了，流量仍能通过。

### 结果没有按业务规则复算

只相信 `Optimal`，没有检查约束使用量。

因此，“程序能跑”最多说明语法和接口没有出错，不代表模型已经验证完成。

## 一套更稳妥的 PuLP 工作流

1. 用 sets 定义业务对象；
2. 用普通 Python 结构保存 parameters；
3. 创建 `LpProblem` 并确认目标方向；
4. 用 `LpVariable` / `LpVariable.dicts` 定义变量类型和边界；
5. 用 `lpSum` 写目标函数；
6. 按约束类别分组生成 constraint families；
7. 检查变量数、约束数和名称；
8. 必要时导出 LP 文件；
9. 求解后先检查 solver status；
10. 独立复算目标值和关键资源平衡；
11. 最后按业务粒度整理结果。

PuLP 最有价值的地方，不是把数学公式变成 Python 语法，而是让一套优化逻辑变成可以重复运行、扩展和检查的程序。代码结构越接近模型结构，后续维护就越轻松。