---
translationKey: stat-interval-estimation
locale: zh
slug: stat-interval-estimation
title: 区间估计
summary: 从点估计与标准误出发，构造并正确解释置信区间，理解置信水平、样本量、t 分布与 Bootstrap 如何共同决定估计精度。
tags:
  - 统计学
  - 置信区间
  - 统计推断
topics:
  - R 与统计
  - 统计推断
  - 不确定性
tools:
  - R
  - Base R
series: R 与统计
seriesSlug: r-statistics
order: 4
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - stat-sampling-estimation
  - descriptive-statistics
---

## 一个点为什么不够

“平均配送时间是 31.4 小时”看起来很明确，但它没有告诉读者这个数字有多稳定。

如果这个平均值来自 12 张订单和来自 12,000 张订单，可信程度显然不同；如果订单时间本身波动很大，31.4 也会比低波动场景更不精确。

区间估计把这部分信息一起报告。最常见形式是：

\[
\text{estimate}\pm\text{margin of error}
\]

其中 margin of error 通常由标准误乘一个临界值构成。

对大样本均值，常见近似写成：

\[
\bar X\pm 1.96\times SE(\bar X)
\]

但 `1.96` 不是所有问题都能直接使用的固定常数。样本量、未知方差、参数类型和抽样结构都会影响实际区间。

## 95% 置信区间到底是什么意思

频率学派的 95% confidence interval 描述的是**构造区间的方法**。

如果不断重复同样的抽样过程，每次都按同一种方法建立区间，那么长期来看大约 95% 的区间会覆盖真实总体参数。

这和“真实参数有 95% 概率落在当前已经算出的区间里”不是同一句话。当前样本抽完以后，区间端点已经确定；频率学解释关注的是这个程序在重复抽样中的覆盖率。

可以用 Monte Carlo 直接检查：

```r
set.seed(2026)
B <- 5000
n <- 100
p <- 0.42

covered <- replicate(B, {
  x <- rbinom(n, size = 1, prob = p)
  p_hat <- mean(x)
  se <- sqrt(p_hat * (1 - p_hat) / n)
  lower <- p_hat - 1.96 * se
  upper <- p_hat + 1.96 * se
  lower <= p && p <= upper
})

mean(covered)
```

在近似条件合适时，覆盖率会接近 0.95。

## Margin of error 来自哪里

对简单均值问题，margin of error 的基本结构是：

\[
ME=\text{critical value}\times SE
\]

标准误反映估计量本身有多不稳定，critical value 则反映希望覆盖得多保守。

如果样本均值是 31.4 小时，标准误是 1.8 小时，用 95% 正态近似：

```r
estimate <- 31.4
se <- 1.8
margin <- 1.96 * se
c(lower = estimate - margin, upper = estimate + margin)
```

这里的区间宽度主要由两件事控制：数据提供的信息量，以及选择的置信水平。

<div data-learning-slot="sampling-precision-lab"></div>

## 置信水平越高，区间通常越宽

如果希望长期覆盖率从 90% 提高到 95%，再提高到 99%，必须扩大区间。

常见标准正态临界值：

| 置信水平 | 临界值 z* |
|---|---:|
| 90% | 1.645 |
| 95% | 1.960 |
| 99% | 2.576 |

```r
z <- qnorm(c(0.95, 0.975, 0.995))
z
```

这里体现一个基本取舍：**更高覆盖把握和更高精度不能免费同时得到。** 在样本量不变时，要求更高 confidence level 就要接受更宽区间。

## 样本量越大，区间会怎样变化

样本均值的标准误满足：

\[
SE(\bar X)=\frac{s}{\sqrt n}
\]

因此其他条件不变时，样本量增加会缩小区间。

```r
s <- 12
n <- c(25, 100, 400)
se <- s / sqrt(n)
margin95 <- 1.96 * se

data.frame(n, se, margin95)
```

从 25 增加到 100，样本量扩大四倍，标准误和 margin of error 大约减半。

这也是样本量规划的重要直觉：如果希望区间宽度减少到原来一半，通常要准备大约四倍的信息量，而不是两倍。

## 总体方差未知时为什么出现 t 分布

现实中通常不知道总体标准差 \(\sigma\)，只能用样本标准差 \(s\) 替代。这样会增加一层不确定性。

均值推断中常用 Student's t distribution：

\[
\frac{\bar X-\mu}{s/\sqrt n}\sim t_{n-1}
\]

相同 95% 置信水平下，小样本的 t 临界值通常比 1.96 更大。

```r
qt(0.975, df = 9)
qt(0.975, df = 29)
qnorm(0.975)
```

自由度增加以后，t 分布逐渐接近标准正态。

R 中对一个均值建立 t 区间很直接：

```r
wait <- c(28, 31, 25, 34, 29, 38, 27, 33, 36, 30)
t.test(wait)$conf.int
```

但函数自动算出区间，不代表数据结构一定适合 t 方法。样本很小且分布高度偏斜、存在明显重尾或强异常值时，需要进一步检查。

## 小样本时先看数据形状

`t.test()` 对轻度偏离正态通常有一定稳健性，但极端偏斜和长尾会让小样本区间表现变差。

```r
hist(wait)
qqnorm(wait)
qqline(wait)
```

不要把“做一个正态性检验”当成唯一入口。Shapiro-Wilk 之类检验会受样本量明显影响；图形、数据生成机制和异常记录的业务原因更重要。

当近似是否可靠不清楚时，模拟可以帮助检查某种方法在假设的数据生成机制下能否达到预期覆盖率。

## 比例的置信区间不能只机械套公式

样本比例 \(\hat p\) 的标准误近似为：

\[
SE(\hat p)=\sqrt{\frac{\hat p(1-\hat p)}{n}}
\]

于是最简单的 Wald 区间写成：

\[
\hat p\pm z^*\sqrt{\frac{\hat p(1-\hat p)}{n}}
\]

例如 240 张订单里 216 张准时：

```r
x <- 216
n <- 240
p_hat <- x / n
se <- sqrt(p_hat * (1 - p_hat) / n)
p_hat + c(-1, 1) * 1.96 * se
```

当样本较小或比例非常接近 0/1 时，这个简单区间可能表现不好，甚至给出低于 0 或高于 1 的端点。

实际 R 分析可以使用：

```r
prop.test(x, n, correct = FALSE)$conf.int
binom.test(x, n)$conf.int
```

两者使用的区间方法不同，因此结果不会完全一致。报告时最好明确使用了什么方法，而不是只写“95% CI”。

## 两组差异也应该报告区间

假设比较渠道 A 与 B 的平均配送时间。真正关心的往往不是两个均值各自的区间，而是**均值差的区间**。

```r
delivery <- data.frame(
  channel = rep(c("A", "B"), each = 12),
  hours = c(
    30, 29, 34, 32, 35, 28, 31, 33, 30, 36, 27, 32,
    26, 25, 29, 27, 24, 28, 30, 26, 27, 25, 29, 24
  )
)

t.test(hours ~ channel, data = delivery)
```

输出的 confidence interval 对应两组均值差。它同时传达：

- 差异方向；
- 可能的效应大小范围；
- 估计精度；
- 零是否仍属于与数据相容的范围。

这比只给一个 p 值更接近实际决策问题。

## Bootstrap 让区间不只依赖解析公式

有些统计量没有简单标准误公式，或者理论近似不方便使用。Bootstrap 的基本做法是从原样本中**有放回重抽样**，每次重新计算统计量。

例如中位数：

```r
set.seed(2026)
wait <- c(6, 7, 7, 8, 9, 10, 11, 13, 16, 22, 31, 44)

boot_median <- replicate(
  5000,
  median(sample(wait, replace = TRUE))
)

quantile(boot_median, c(0.025, 0.975))
```

这个 percentile interval 用 bootstrap 分布的 2.5% 和 97.5% 分位点构造区间。

Bootstrap 的优势是灵活，但它仍然依赖原样本能代表目标总体。如果原样本有选择偏差，反复重抽只会重复同一偏差。

另外，时间序列、门店内聚类、重复测量等有依赖的数据，不能简单按行独立重抽。

## 区间宽并不代表分析失败

宽区间只说明当前数据没有提供足够精确信息。

例如新产品上线首周只有 18 个客户，估计留存率得到 95% CI 为 42%–78%。这个结果可能不适合做精确承诺，但它非常有价值：它直接说明目前证据不足以区分“表现一般”和“表现很好”。

相反，如果只报告点估计 61%，读者很容易误以为数据已经足够稳定。

不确定性本身就是结果，而不是需要隐藏的缺点。

## 统计区间和预测区间不要混淆

回归中常见两种不同区间：

**Confidence interval for the mean response**：估计某个 X 条件下平均 Y 在哪里。

**Prediction interval**：预测一个新的单独观察可能落在哪里。

单个观察还包含个体噪声，因此 prediction interval 通常明显更宽。

```r
fit <- lm(hours ~ distance_km, data = shipments)
predict(fit, newdata = new_route, interval = "confidence")
predict(fit, newdata = new_route, interval = "prediction")
```

如果问题是“这条新路线的一票订单可能多久送达”，用平均响应的 confidence interval 会过度乐观。

## 常见误读

**“95% CI 就是参数有 95% 概率在里面。”** 这是 Bayesian credible interval 才可能采用的概率式参数解释；普通频率学 confidence interval 的定义不同。

**“区间没有跨 0，所以效果一定重要。”** 统计证据和业务重要性仍要分开判断。

**“区间越窄模型越好。”** 非常窄但有系统偏差的区间可能比稍宽、校准正确的区间更危险。

**“增加样本就能解决所有问题。”** 它主要改善随机精度，不自动解决选择偏差、测量错误和数据泄漏。

**“Bootstrap 不需要任何假设。”** 它减少了某些解析分布假设，但仍依赖抽样代表性与重抽单位的合理性。

## 把区间带回业务判断

区间最适合回答“数据支持多大范围”的问题。

如果新服务流程把平均等待时间估计降低 2.1 分钟，95% CI 为 0.3–3.9 分钟，可以同时讨论统计证据和实际价值：即使方向较稳定，最低改善 0.3 分钟是否足以覆盖改造成本仍然是业务问题。

如果区间是 -1.8–6.0 分钟，则当前数据还无法排除“没有改善”甚至“略变差”。此时继续收集数据可能比急着宣布结论更合理。

区间把不确定性变成可读范围，也为下一步假设检验提供自然连接：某个 null value 是否落在置信区间内，与相应显著性检验存在直接关系。

## 参考资料

知识结构参考 Rafael A. Irizarry 的 *Introduction to Data Science: Statistics and Prediction Algorithms Through Case Studies* 中 Estimates and Confidence Intervals、Data-Driven Models 与 Bootstrap 的处理。正文、模拟、业务示例与代码均重新组织。

参考站点：<https://rafalab.dfci.harvard.edu/dsbook-part-2/> 。原资料采用 CC BY-NC-SA 4.0 许可。
