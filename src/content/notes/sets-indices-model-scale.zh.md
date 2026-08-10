---
translationKey: sets-indices-model-scale
locale: zh
slug: sets-indices-model-scale
title: Sets 与 Indices：让优化模型从几个变量扩展到真实业务规模
summary: 从单变量、列表、矩阵进入高维优化模型，理解集合、索引、基数、参数字典、变量族与约束族如何控制规模增长，并避免逐格硬编码、维度错位和约束漏生成。
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

## 小模型真正变难的原因通常不是公式，而是规模

一个单变量模型：

```text
x = 总生产量
```

很容易管理。

如果业务开始区分产品：

```text
x[p]
```

再区分工厂：

```text
x[k,p]
```

再区分客户区域：

```text
x[k,p,r]
```

再增加时期：

```text
x[k,p,r,t]
```

数学结构可能仍然只是“生产/运输量”，但变量数量已经按所有维度的组合成倍增长。

这时继续逐个命名：

```text
x_north_core_metro_1
x_north_core_coast_1
...
```

会迅速失去可维护性。

<div data-learning-slot="model-scale"></div>

## Set 是一组有效业务对象

例如：

```text
K = {North Plant, South Plant}
P = {Core Kit, Premium Kit}
R = {Metro, Coast, Inland}
T = {1,2,3,4}
```

这些集合不是为了让公式更抽象，而是明确：

> 模型中哪些业务对象属于同一种维度。

集合可以来自：

- 主数据表；
- 配置文件；
- DataFrame 的唯一值；
- 数据库维表；
- 稳定的业务字典。

不建议把同一组对象在多个代码位置重复手工输入，因为容易出现拼写和遗漏不一致。

## Index 是集合中的一个元素位置

如果：

```text
k ∈ K
```

表示 k 是工厂集合中的一个成员。

类似：

```text
p ∈ P
r ∈ R
t ∈ T
```

所以：

```text
x[k,p,r,t]
```

表示一个**变量族**：对每一个有效的 `(k,p,r,t)` 组合，都存在一个变量。

它不是一个变量名，而是一整组结构一致的变量。

## Cardinality 决定变量数量

集合大小写成：

```text
|K|, |P|, |R|, |T|
```

如果：

```text
|K| = 2
|P| = 3
|R| = 4
|T| = 1
```

那么三维变量族：

```text
x[k,p,r]
```

总数是：

```text
2 × 3 × 4 = 24
```

若加入 12 个时期：

```text
2 × 3 × 4 × 12 = 288
```

如果再增加 5 种运输方式：

```text
2 × 3 × 4 × 12 × 5 = 1,440
```

这就是高维模型的 variable explosion。

## 变量数量增长是乘法，约束数量也会增长

例如：

```text
每个工厂每期一个容量约束
```

数量：

```text
|K| × |T|
```

每个产品 × 区域 × 时期一个需求约束：

```text
|P| × |R| × |T|
```

如果又增加服务等级、运输商、技能类型，constraint families 也会跟着增长。

所以真实模型的复杂度往往来自：

```text
变量族数量
+
约束族数量
+
索引组合数量
```

而不是来自某个特别长的单一公式。

## 0D、1D、2D、3D、4D 是业务粒度的逐步细化

可以这样理解：

```text
0D
x
→ 一个总决策

1D
x[p]
→ 每个产品一个决策

2D
x[k,p]
→ 每个工厂 × 产品一个决策

3D
x[k,p,r]
→ 工厂 × 产品 × 区域

4D
x[k,p,r,t]
→ 再加入时期
```

维度越高，模型可以表达的现实差异越多，但数据需求与验证成本也更高。

所以“增加一个维度”不是免费增强模型。

## 参数必须和变量维度对齐

假设运输成本只和工厂、区域有关：

```text
c[k,r]
```

而变量是：

```text
x[k,p,r,t]
```

目标可以写：

```text
Σ_k Σ_p Σ_r Σ_t c[k,r] · x[k,p,r,t]
```

这里成本不需要复制成四维，只需要在循环中按照 k、r 查值。

如果不同产品运输成本不同，则应变成：

```text
c[k,p,r]
```

维度设计应该由业务差异决定，而不是为了“看起来统一”把所有参数强行做成最高维。

## 错位索引是最危险的静默错误之一

例如变量：

```text
x[k,p,r]
```

但代码误把成本查成：

```text
cost[r][k]
```

如果字典恰好都有键，代码可能不会报错，却会使用错误数据。

因此建议保持：

```text
数学索引顺序
变量字典顺序
参数字典顺序
循环顺序
```

尽量一致。

例如统一采用：

```text
plant → product → region → period
```

## Summation notation 是对循环的压缩表达

数学：

```text
Σ_k Σ_r c[k,r] x[k,r]
```

Python：

```python
lpSum(cost[k][r] * x[k][r] for k in K for r in R)
```

两者本质上表达同一件事。

数学符号用于快速看结构，程序循环用于生成所有具体项。

理解这种映射后，长公式不再需要逐项展开。

## Constraint family 也是一组结构相同的约束

例如每个工厂一个容量限制：

```text
Σ_r x[k,r] ≤ capacity[k]   ∀ k ∈ K
```

这里的：

```text
∀ k ∈ K
```

意味着会生成 `|K|` 条约束。

Python：

```python
for k in K:
    model += lpSum(x[k][r] for r in R) <= capacity[k]
```

如果忘记 `for k in K`，就可能只生成一条约束，或者错误地把全部工厂容量混在一起。

## Excel 网格和索引模型在本质上是同一个结构

Excel 中常用二维表：

```text
rows    = plants
columns = regions
cells   = shipment decision variables
```

这其实就是：

```text
x[k,r]
```

Excel 的行列标题承担了 index label 的作用。

当模型扩展到三维以上时，电子表格往往需要：

- 多个工作表；
- 堆叠块；
- 长表格式；
- 辅助索引列。

Python 则可以更自然地用 tuple keys 或嵌套字典表达 n-D 变量。

这就是为什么规模扩大后，编程建模通常更容易维护。

## Long format 更适合高维业务数据

与其建立大量宽表，可以把数据存成：

```text
plant | product | region | period | cost | capacity | demand
```

每一行代表一个有效组合或参数记录。

优点：

- 容易过滤；
- 容易 join；
- 容易生成 tuple key；
- 容易检查缺失组合；
- 更适合数据库和 DataFrame。

高维模型的数据工程和数学模型往往是同一个问题的两面。

## Sparse model：并不是所有组合都应该生成变量

如果某产品根本不能在某工厂生产：

```text
North Plant × Premium Kit
```

可能是无效组合。

一种做法是生成变量后强制：

```text
x[north,premium] = 0
```

另一种更紧凑的做法是只为 valid arcs / valid combinations 生成变量。

例如：

```text
A = {(k,p,r) | combination is allowed}
```

然后：

```text
x[a] for a ∈ A
```

这种 sparse indexing 可以显著减少模型规模。

## 高维模型必须增加数据完整性检查

至少应检查：

```text
每个需求组合是否有需求参数？
每个可行运输弧是否有成本？
每个工厂是否有容量？
每个变量组合是否有必要系数？
集合中是否存在拼写重复？
参数表是否有 duplicate keys？
```

模型越大，手工肉眼检查越不可靠。

因此应把这些检查写成自动化断言。

## 变量命名是调试工具

良好的求解器变量名称：

```text
flow_north_metro
flow_south_coast
```

比：

```text
x1
x2
x3
```

更容易调试。

PuLP 的 dict variables 可以保留索引信息，求解后也更容易把结果还原成表格。

## 模型规模要在求解之前估算

在真正建模前可以先计算：

```text
number of continuous variables
number of binary variables
number of constraint rows
number of valid arcs
number of periods
```

这有助于决定：

- 是否仍适合 Excel Solver；
- 是否要切换到 Python；
- 是否要利用 sparse formulation；
- 是否需要商业级求解器；
- 是否要做 decomposition 或 heuristic。

## 常见错误

### 复制粘贴生成变量和约束

规模一大就容易漏掉组合或引用错误。

### 集合名称与数据键不一致

例如 `North` 与 `north` 被当成两个对象。

### 参数维度过高

把本来只按区域变化的参数复制成四维，增加数据冗余和出错机会。

### 参数维度过低

真实成本按工厂变化，却只存一个产品平均成本，模型无法表达差异。

### 生成所有笛卡尔积但实际大量组合无效

会造成不必要的模型膨胀。

### 只看代码能否运行，不统计实际生成多少变量与约束

一个无意多乘一个维度的模型也可能正常运行，只是规模暴涨。

## 核心判断

Sets 与 Indices 的核心价值是：

> **把“很多类似变量和约束”定义成结构化的变量族和约束族，让模型规模可以随着业务维度扩展，而不是随着复制粘贴数量扩展。**

下一篇把这套数学结构直接映射到 PuLP：从 sets、parameters、variables 到 objective、constraints、solve status，建立可维护的优化编程架构。
