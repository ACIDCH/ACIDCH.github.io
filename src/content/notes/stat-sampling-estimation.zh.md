---
translationKey: stat-sampling-estimation
locale: zh
slug: stat-sampling-estimation
title: 抽样与估计
summary: 从总体、样本和参数开始，理解随机抽样、抽样分布、标准误与中心极限定理，判断一个样本估计究竟有多可靠。
tags:
  - 统计学
  - 抽样
  - 统计推断
topics:
  - R 与统计
  - 统计推断
  - 数据质量
tools:
  - R
  - Base R
series: R 与统计
seriesSlug: r-statistics
order: 3
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - descriptive-statistics
  - stat-data-types-scales
---

## 从“手里的数据”到“真正关心的总体”

很多分析并不是只想描述当前这张表，而是希望从一部分观察推断更大的总体。

例如，一家公司不可能同时访问所有客户，却希望估计全部活跃客户的平均等待时间；抽查一部分出库订单，希望判断整个仓库的准时率；调查一部分订阅用户，希望估计总体流失比例。

这时需要先把四个角色分清：

- **Population**：真正关心的全部对象；
- **Sample**：实际观察到的一部分对象；
- **Parameter**：总体中想知道但通常看不到的量；
- **Statistic / estimator**：从样本计算、用于估计总体参数的量。

如果总体平均等待时间记作 \(\mu\)，样本平均等待时间记作 \(\bar X\)，那么 \(\bar X\) 是对 \(\mu\) 的估计。

\[
\bar X=\frac{1}{n}\sum_{i=1}^{n}X_i
\]

一次样本只会给出一个 \(\bar X\)。统计推断真正关心的是：**如果重新抽样，这个估计会怎样变化。**

## 随机抽样为什么重要

抽样方法决定样本能不能代表目标总体。

最理想的基础情形是 simple random sample：总体中的每个单位都有已知且公平的机会进入样本。真实业务数据往往达不到完美随机，但这个基准能帮助识别偏差来源。

假设有 10,000 个客户，只抽 200 个：

```r
set.seed(2026)
customer_ids <- 1:10000
sample_ids <- sample(customer_ids, size = 200, replace = FALSE)
length(sample_ids)
```

随机抽样不是为了“让数据看起来随机”，而是为了让样本选择机制尽量不和研究结果系统相关。

如果只调查愿意主动回复问卷的客户，样本可能过度代表特别满意或特别不满意的人；如果只在工作日上午采集服务数据，晚间高峰可能被漏掉。

这些问题不会因为后面用了更复杂的公式而消失。

## 代表性和样本量是两件事

大样本通常能降低随机误差，却不能自动修复 selection bias。

假设某线上渠道有 50,000 条记录，但线下门店客户完全没有进入数据。如果分析目标是“所有客户”，这个样本再大也仍然缺少一个群体。

可以把误差粗略分成两类：

**随机抽样误差**：即使抽样机制正确，不同随机样本仍会产生不同估计；样本量增大时通常会缩小。

**系统性偏差**：样本选择、测量方式或缺失机制让某些方向被持续高估或低估；单纯增加同类样本通常无效。

统计推断中的标准误主要处理第一类问题，因此正式报告前还必须检查第二类问题。

## 点估计只给一个位置

最常见的点估计包括：

总体均值 \(\mu\) 的估计：

\[
\hat\mu=\bar X
\]

总体比例 \(p\) 的估计：

\[
\hat p=\frac{x}{n}
\]

例如 240 个抽样订单中有 216 个准时：

```r
n <- 240
on_time <- 216
p_hat <- on_time / n
p_hat
```

得到 `0.90`，即样本准时率 90%。这个数字是当前样本的事实，但总体准时率不会因此被精确确定为 90%。

点估计回答“中心在哪里”，下一步还需要知道“这个中心有多稳定”。

## 抽样分布是推断的核心

Sampling distribution 不是原始数据的分布，而是**一个统计量在重复抽样中的分布**。

假设总体客户等待时间右偏。如果不断从同一个总体中随机抽 100 人，每次计算平均等待时间，会得到很多不同的样本均值：

```r
set.seed(2026)
population_wait <- rgamma(50000, shape = 3, scale = 4)

sample_means <- replicate(
  3000,
  mean(sample(population_wait, size = 100, replace = FALSE))
)

mean(sample_means)
sd(sample_means)
```

`population_wait` 的分布描述单个客户等待时间；`sample_means` 的分布描述“平均等待时间这个估计量”会怎样波动。

这两个分布不能混在一起解释。

## 标准差和标准误不要混用

Standard deviation 描述**个体数据**的离散程度；standard error 描述**估计量**的抽样波动。

样本均值的标准误常写成：

\[
SE(\bar X)=\frac{s}{\sqrt n}
\]

其中 \(s\) 是样本标准差，\(n\) 是样本量。

假设某次样本等待时间标准差为 12 分钟：

```r
s <- 12
n <- 100
se <- s / sqrt(n)
se
```

标准差仍然是 12 分钟，但平均数的标准误是 1.2 分钟。

这并不意味着大样本客户之间差异变小了，而是说“样本平均值”更稳定了。

## 样本量为什么按平方根改善精度

从公式可以看到：

\[
SE\propto\frac{1}{\sqrt n}
\]

如果样本量从 100 增加到 400，标准误大约减半；如果希望标准误再减半，样本量通常还需要扩大四倍。

```r
n_values <- c(25, 50, 100, 200, 400, 800)
se_values <- 12 / sqrt(n_values)

data.frame(n = n_values, se = se_values)
```

这个平方根关系对数据采集成本很重要。后期继续追求更窄的不确定范围，通常要付出越来越多样本成本。

<div data-learning-slot="sampling-precision-lab"></div>

## 中心极限定理连接样本均值和正态近似

Central Limit Theorem 说明，在相当宽的条件下，当样本量足够大时，独立观察的样本均值经过标准化后会趋近正态分布：

\[
\frac{\bar X-\mu}{\sigma/\sqrt n}\approx N(0,1)
\]

它讨论的是**样本均值的抽样分布**，不是说原始数据会自动变成正态。

即使客户等待时间明显右偏，多次抽取较大样本以后，样本均值往往会比原始数据更接近钟形。

```r
par(mfrow = c(1, 2))
hist(population_wait, main = "Individual waits")
hist(sample_means, main = "Sample means")
```

“样本量多大才够”没有一个脱离数据形状的固定答案。分布越偏、尾部越重，通常需要更多观察。存在强依赖、聚类或时间序列结构时，也不能直接套独立同分布的简单版本。

## 比例估计也有标准误

如果每条记录只有成功/失败两种结果，可以把成功记为 1、失败记为 0。样本比例就是这些 0/1 的平均值。

对于独立 Bernoulli 观察，比例估计的标准误近似为：

\[
SE(\hat p)=\sqrt{\frac{\hat p(1-\hat p)}{n}}
\]

```r
p_hat <- 0.90
n <- 240
sqrt(p_hat * (1 - p_hat) / n)
```

这个公式说明比例靠近 0.5 时，在相同样本量下随机波动通常更大；比例非常靠近 0 或 1 时，近似方法还需要特别检查样本中的成功/失败数量是否足够。

## Monte Carlo 可以把抽样理论直接跑出来

当公式比较抽象时，可以用模拟验证。

假设真实总体准时率是 0.90，每次抽 100 单：

```r
set.seed(2026)
B <- 5000
n <- 100
p <- 0.90

estimates <- replicate(
  B,
  mean(rbinom(n, size = 1, prob = p))
)

mean(estimates)
sd(estimates)
sqrt(p * (1 - p) / n)
```

模拟标准差会接近理论标准误。这个实验能清楚显示：一个统计量的“不确定性”不是凭感觉加出来的，而是重复抽样行为的结果。

模拟同样不能修复错误的总体定义或抽样机制。它只是在已设定的数据生成机制下检查统计方法怎样表现。

## 分层抽样和聚类数据不能机械套简单公式

真实业务常有天然层级：客户属于地区，订单属于门店，员工属于团队，交易属于日期。

如果不同层之间差异明显，simple random sample 可能不是最有效的设计。常见设计包括：

- **stratified sampling**：先按关键群体分层，再在每层内抽样；
- **cluster sampling**：先抽门店、学校或地区，再观察簇内单位；
- **systematic sampling**：按固定间隔从排序列表抽取。

这些设计会改变标准误计算。尤其 cluster 内记录往往相似，把它们全部当成独立观察会低估不确定性。

因此“样本有 10,000 行”并不等于“有 10,000 个独立信息单位”。

## 缺失和非响应属于抽样问题的一部分

抽到某个对象，不代表最终一定得到有效记录。

如果问卷响应概率和满意度有关，complete cases 就可能不再代表原始样本；如果高峰期设备日志更容易丢失，缺失值也会与结果相关。

正式分析至少要比较：

```r
with(customer_survey, table(response_status, region))
with(customer_survey, prop.table(table(response_status, region), margin = 2))
```

这里的重点不是某个固定函数，而是检查“谁没有进入最终分析表”。估计的目标总体往往就在这一步被悄悄改变。

## 常见误读

**“样本很大，所以一定准确。”** 大样本降低随机误差，不保证没有系统偏差。

**“标准差小就是标准误小。”** 两者描述不同对象；标准误还取决于样本量。

**“中心极限定理说明数据会变正态。”** 它主要描述适当条件下样本均值的抽样分布。

**“随机抽样就是从文件里随机抽几行。”** 如果原始文件本身已经漏掉目标总体的一部分，文件内随机并不能恢复代表性。

**“重复抽样只是统计学想象。”** Monte Carlo 可以把这种重复过程直接模拟出来，帮助检查理论近似。

## 从估计进入区间

抽样与估计解决了两个核心问题：用什么统计量代表总体，以及这个统计量为什么会波动。

下一步自然是把这种波动转成区间。点估计给出中心，标准误给出抽样尺度，置信水平再决定需要在中心两侧留多大的余量。

因此区间估计并不是额外加在点估计旁边的“误差条”，而是从抽样分布直接延伸出来的推断结果。

## 参考资料

知识结构参考 Rafael A. Irizarry 的 *Introduction to Data Science: Statistics and Prediction Algorithms Through Case Studies*，尤其是 Probability 中的 sampling models、Central Limit Theorem，以及 Statistical Inference 中 estimates 与 standard error 的处理。正文、模拟和业务案例均重新组织。

参考站点：<https://rafalab.dfci.harvard.edu/dsbook-part-2/> 。原资料采用 CC BY-NC-SA 4.0 许可。
