---
translationKey: sets-indices-model-scale
locale: zh
slug: sets-indices-model-scale
title: 集合与索引
summary: 小模型只有几个变量时，手写公式还算轻松；一旦加入产品、工厂、客户和时期，真正麻烦的是规模。这里讲集合、索引和参数字典怎样把模型组织起来。
tags:
  - Sets
  - Indices
  - Model Scale
topics:
  - 供应链优化
  - 优化编程
tools:
  - Python
  - PuLP
  - Excel Solver
series: 供应链与决策模型
seriesSlug: decision-models
order: 6
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - transportation-network
relatedNotes:
  - binary-milp-decisions
---

## 小模型变难，往往不是因为公式更复杂

只有两个产品时，可以直接写：

```text
x_core
x_premium
```

再手写两三条约束，模型很容易看懂。

但业务一旦扩展到：

```text
5 个产品
4 个工厂
6 个客户区域
12 个时期
```

如果继续给每个变量单独起名，代码很快就会失控。

真正需要解决的问题变成：**怎样让同一种决策按照业务维度批量生成，又能保证每个参数和约束都对应正确的对象。**

这就是 sets 和 indices 的作用。

<div data-learning-slot="model-scale"></div>

## Set 只是“有哪些对象”的清单

Set 可以先理解成一组业务对象。

例如：

```python
products = ["core", "premium"]
plants = ["north", "south"]
regions = ["metro", "coast", "inland"]
```

这三组集合分别回答：

```text
有哪些产品？
有哪些工厂？
有哪些市场区域？
```

集合本身不包含成本、容量或需求。它只是定义模型需要遍历哪些对象。

这个区分很重要。把“对象”和“对象的属性”分开以后，模型结构会清楚很多。

## Index 表示当前正在说集合里的哪一个对象

如果 p 表示产品集合中的一个元素：

\[
p\in P
\]

就可以把某个产品的产量写成：

\[
x_p
\]

如果 k 表示工厂：

\[
k\in K
\]

工厂 k 生产产品 p 的数量就可以写成：

\[
x_{k,p}
\]

这比：

```text
north_core
north_premium
south_core
south_premium
```

更容易扩展。

将来增加第三个工厂，只需要向 `plants` 集合加一个元素，而不是重新复制整套变量和约束代码。

## 一维、二维和三维变量只是业务区分越来越细

不同维度可以这样读：

```text
x[p]
→ 每个产品一个决策

x[k, p]
→ 每个工厂、每个产品一个决策

x[k, p, t]
→ 每个工厂、每个产品、每个时期一个决策
```

维度不是为了让模型看起来高级。每增加一个 index，都是在回答一个实际问题：这个决策是否需要区分这一个业务维度？

如果不同工厂的成本和容量完全不同，就有必要区分工厂。如果所有时期都能用同一个总量表示，就没必要无故增加时间维度。

模型维度应该跟决策粒度匹配。

## 参数也应该跟着索引组织

假设不同工厂到不同区域的运输成本不一样，可以写：

\[
c_{k,r}
\]

Python 中很自然地用 tuple key：

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

这里 key `(plant, region)` 本身就是参数的业务坐标。

以后读：

```python
transport_cost["south", "coast"]
```

就能明确知道拿的是 South Plant 到 Coast 的单位运输成本。

这种结构比把所有数字放进一个没有标签的长列表更安全。

## Composite key 最重要的是唯一和完整

多维参数最常见的问题之一，是 key 写错或重复。

例如：

```text
(north, metro)
```

在运输成本表中应该只出现一次。

如果同一个组合出现两次，就要先弄清楚到底哪一个值正确；如果某个合法组合完全缺失，模型运行到相应索引时就会报错，或者被代码默认成错误的 0。

因此，tuple key 不只是编程技巧，它实际上是一份数据契约：

```text
每个合法业务组合
→ 应该有且只有一个对应参数
```

在大模型里，建模前先检查 key 的唯一性和完整性非常值得。

## Variable family 比单独创建变量更容易维护

PuLP 可以按集合批量创建变量：

```python
x = pl.LpVariable.dicts(
    "flow",
    (plants, regions),
    lowBound=0,
)
```

这样会生成一整组变量：

```text
flow[north][metro]
flow[north][coast]
flow[north][inland]
flow[south][metro]
flow[south][coast]
flow[south][inland]
```

重点不在于少写了几行代码，而是所有变量都遵循同一规则。

增加一个区域以后，新的变量会随集合自动生成，模型不需要手动复制一段新代码。

## Constraint family 也应该按业务规则批量生成

假设每个区域的需求必须满足：

\[
\sum_k x_{k,r}\ge demand_r\qquad\forall r\in R
\]

代码可以写成：

```python
for r in regions:
    model += (
        pl.lpSum(x[k][r] for k in plants) >= demand[r],
        f"demand_{r}",
    )
```

这不是“一条约束”，而是一整个 constraint family。

区域有 3 个，就会生成 3 条；区域以后增加到 20 个，同一段代码仍然适用。

这正是索引模型能够扩展的原因：规则写一次，实例按集合生成。

## Model scale 可以在建模前先算一遍

模型有多大，不必等求解器运行后才知道。

如果变量是：

\[
x_{k,p,t}
\]

而：

```text
|K| = 4 plants
|P| = 5 products
|T| = 12 periods
```

理论变量数是：

\[
4\times5\times12=240
\]

如果再加区域 r：

\[
x_{k,p,r,t}
\]

假设 6 个区域，就变成：

\[
4\times5\times6\times12=1440
\]

每增加一个维度，规模是乘法增长，不是简单加几列。

提前计算变量数和约束数，可以帮助判断模型是否需要稀疏化、分解或减少无意义组合。

## Dense model 和 sparse model 不应该混为一谈

上面的乘法默认所有组合都有意义，但现实中经常不是这样。

例如：

- South Plant 不能生产 Premium；
- 某些区域只能由 North Plant 服务；
- 某个产品只在部分时期销售。

如果仍然给所有组合创建变量，就会出现很多永远必须为 0 的变量。

更紧凑的做法是先定义合法组合：

```python
valid_routes = [
    ("north", "metro"),
    ("north", "coast"),
    ("south", "coast"),
    ("south", "inland"),
]
```

再只对这些组合创建变量。

Sparse indexing 不只是节省内存，也能减少无意义解和逻辑约束，让模型更容易检查。

## 逐格硬编码最容易留下漏项

模型规模一大，最危险的写法通常是：

```python
model += x_north_metro + x_south_metro >= 360
model += x_north_coast + x_south_coast >= 280
model += x_north_inland + x_south_inland >= 220
```

在只有 3 个区域时看起来还能接受，但以后增加第 4 个区域，很容易忘记同步增加约束。

循环或 indexed expression 的优势就在这里：集合是唯一来源，约束数量会跟着集合变化。

同样，手工复制公式还容易出现 copy-paste 错误，例如 Coast 约束里误用了 Inland 的需求数字。

## 建模前做 set/parameter audit 能省掉很多调试时间

在创建变量之前，可以先检查：

```text
集合是否为空？
ID 是否唯一？
参数 key 是否全部合法？
每个需要的组合是否都有参数？
有没有多余的未知 key？
数值单位是否一致？
```

例如：

```python
expected = {(k, r) for k in plants for r in regions}
actual = set(transport_cost)

missing = expected - actual
extra = actual - expected
```

这类检查比模型求解失败后再从上千个变量里找问题更高效。

参数审计应该发生在建模前，而不是只在出现 `KeyError` 时临时补数据。

## 变量命名会直接影响结果能不能调试

求解器最终输出的通常是一组变量名和值。

如果变量都叫：

```text
x_1
x_2
x_3
```

结果很难追溯。

如果名称包含业务索引：

```text
flow_north_metro
flow_south_coast
production_north_core_P1
```

即使模型出了问题，也更容易定位是哪一个组合异常。

好的命名还会影响日志、LP 文件和调试输出。规模越大，命名越不是“代码风格”，而是模型可审计性的一部分。

## 结果不应该直接打印几千个变量

高维模型求解后，如果把全部变量逐行打印，很快就失去可读性。

更好的做法是按业务问题切片：

```text
按工厂汇总总产量
按区域汇总总配送量
只显示非零变量
只检查某个产品
只看某一个时期
```

例如：

```python
for k in plants:
    total = sum(pl.value(x[k][r]) for r in regions)
    print(k, total)
```

模型内部可以是高维的，但结果展示应该回到管理者能理解的粒度。

## 一套更稳妥的扩展顺序

1. 先确认需要哪些业务维度；
2. 给每个维度建立明确集合；
3. 检查 ID 唯一性；
4. 用 tuple key 或嵌套字典保存参数；
5. 在建模前做参数完整性 audit；
6. 用 variable family 批量创建变量；
7. 用循环生成 constraint family；
8. 对不可能发生的组合采用 sparse indexing；
9. 提前估算变量和约束规模；
10. 求解后按业务维度汇总结果，而不是直接输出全部变量。

集合与索引看起来只是编程结构，实际上决定了模型能不能从一个课堂大小的例子平稳扩展到真实业务。公式不一定变难，真正需要控制的是规模、对应关系和可追溯性。