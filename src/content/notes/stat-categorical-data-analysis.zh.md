---
translationKey: stat-categorical-data-analysis
locale: zh
slug: stat-categorical-data-analysis
title: 分类数据分析
summary: 从频数、比例和列联表开始，进入条件比例、卡方检验、odds 与 odds ratio，并把分类数据分析自然连接到逻辑回归。
tags:
  - 统计学
  - 分类数据
  - 卡方检验
topics:
  - R 与统计
  - 统计推断
  - 分类问题
tools:
  - R
  - Base R
series: R 与统计
seriesSlug: r-statistics
order: 6
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - stat-data-types-scales
  - stat-hypothesis-testing
  - logistic-regression
---

## 分类数据先从“数有多少”开始

类别变量最直接的信息不是均值，而是每个类别出现多少次、占多大比例。

假设某月记录了 400 次客户服务结果：

```r
service <- data.frame(
  channel = rep(c("Web", "Store"), each = 200),
  resolved = c(
    rep("Yes", 164), rep("No", 36),
    rep("Yes", 142), rep("No", 58)
  )
)
```

先看频数：

```r
table(service$resolved)
```

再看比例：

```r
prop.table(table(service$resolved))
```

如果只知道“已解决 306 次”，仍然不知道 Web 和 Store 是否存在差异。分类数据分析的下一步通常是把两个类别变量放进同一张 contingency table。

## 列联表让两个类别变量同时可见

```r
tab <- table(service$channel, service$resolved)
tab
```

得到：

| Channel |  No | Yes |
| ------- | --: | --: |
| Store   |  58 | 142 |
| Web     |  36 | 164 |

这张表同时保留了两个变量的联合频数。

如果业务问题是“不同渠道解决率是否不同”，真正需要比较的不是原始计数，而是**条件比例**。

```r
prop.table(tab, margin = 1)
```

按行归一后，可以看到：

- Web 解决率：82%；
- Store 解决率：71%。

这已经比单独一个总体解决率更接近问题本身。

## 条件比例的分母必须说清楚

`prop.table()` 的 margin 不同，回答的问题也不同。

```r
prop.table(tab, margin = 1)  # 每个渠道内部的结果比例
prop.table(tab, margin = 2)  # 每种结果来自不同渠道的比例
prop.table(tab)              # 占全部记录的联合比例
```

例如“Web 中 82% 被解决”和“所有已解决记录中有多少来自 Web”是两个完全不同的问题。

分类数据最常见的解释错误之一，就是只报百分比，不说明分母。

业务报告里最好把比例写完整：

```text
Web 渠道的 200 次记录中，164 次被解决，解决率 82%。
```

这比只写“82%”更不容易产生歧义。

## 柱状图应该和条件比例保持一致

类别变量的图形通常不复杂，但比例的分母仍然要和问题一致。

```r
library(ggplot2)

ggplot(service, aes(channel, fill = resolved)) +
  geom_bar(position = "fill") +
  labs(y = "Proportion")
```

`position = "fill"` 会把每个渠道缩放到 100%，因此适合比较渠道内部结果组成。

如果使用普通堆叠柱状图，样本量较大的渠道会天然更高，读者看到的就不再只是比例差异。

图形没有自动解决统计问题，只是把选定的分母和比较方式视觉化。

## 独立性意味着“一个变量不改变另一个变量的分布”

如果 channel 与 resolved 独立，那么知道客户来自哪个渠道，不应该改变结果类别的概率分布。

用概率记号可以写成：

\[
P(Resolved\mid Channel)=P(Resolved)
\]

如果 Web 解决率 82%、Store 解决率 71%，样本中已经出现差异。下一步的问题是：这种差异是否大到难以用随机抽样波动解释。

Chi-square test of independence 正是为这种列联表问题提供一个常见检验框架。

## 卡方检验比较观察频数和期望频数

原假设是两个类别变量独立。

\[
H_0:\text{Channel 与 Resolved 独立}
\]

如果独立成立，每个单元格的 expected count 可以由行总计和列总计计算：

\[
E_{ij}=\frac{(\text{row total}_i)(\text{column total}_j)}{N}
\]

卡方统计量：

\[
\chi^2=\sum\frac{(O-E)^2}{E}
\]

其中 \(O\) 是 observed count，\(E\) 是 expected count。

R 中：

```r
chi <- chisq.test(tab, correct = FALSE)
chi
chi$expected
```

`chi$expected` 很重要，因为卡方近似依赖期望频数不能过小。

## 卡方检验的 p 值不告诉效果有多大

即使 p 值很小，也只说明“独立模型与数据不太相容”。它不会自动告诉差异有多大、方向是什么，更不会直接说明业务价值。

因此检验以后还要回到原始比例：

```r
prop.table(tab, margin = 1)
```

本例中 Web 解决率 82%，Store 71%，绝对差为：

\[
0.82-0.71=0.11
\]

也就是 11 个百分点。

如果每月有 50,000 次服务，这个差异可能对应很大的运营影响；如果只有几十次记录，估计的不确定性又可能很高。

统计证据和实际效果需要一起解释。

## 小样本和稀疏表要考虑 Fisher exact test

卡方检验依赖大样本近似。如果 2×2 表里某些 expected counts 很小，近似可能不稳定。

这时常见替代方法是 Fisher's exact test：

```r
small_tab <- matrix(
  c(1, 9,
    6, 4),
  nrow = 2,
  byrow = TRUE
)

fisher.test(small_tab)
```

“期望频数小于 5 就一定不能用卡方”是一条过度机械的规则。更稳妥的判断是检查表规模、稀疏程度和近似条件；在很小的 2×2 问题里，Fisher 方法尤其自然。

## 二元结果可以用风险差和风险比描述

当结果只有 Yes/No 时，除了检验独立性，还可以直接比较两组事件概率。

Web 解决率：

\[
p_W=0.82
\]

Store 解决率：

\[
p_S=0.71
\]

**Risk difference**：

\[
RD=p_W-p_S=0.11
\]

它回答的是“绝对提高多少个百分点”。

**Risk ratio**：

\[
RR=\frac{p_W}{p_S}=\frac{0.82}{0.71}\approx1.15
\]

它回答 Web 的解决概率大约是 Store 的多少倍。

两个指标表达的是不同尺度，不能互相替代。

## Odds 和 probability 不是同一个量

如果事件概率为 \(p\)，odds 定义为：

\[
Odds=\frac{p}{1-p}
\]

Web 的 odds：

\[
\frac{0.82}{0.18}\approx4.56
\]

Store 的 odds：

\[
\frac{0.71}{0.29}\approx2.45
\]

probability 0.82 表示 82% 的概率；odds 4.56 表示事件发生与不发生的相对比值约为 4.56:1。

两者数值尺度完全不同。

## Odds ratio 量化两组相对 odds

对于 2×2 表：

|         | Event | No event |
| ------- | ----: | -------: |
| Group A |     a |        c |
| Group B |     b |        d |

odds ratio：

\[
OR=\frac{a/c}{b/d}=\frac{ad}{bc}
\]

用当前例子：

```r
web_odds <- 164 / 36
store_odds <- 142 / 58
odds_ratio <- web_odds / store_odds
odds_ratio
```

OR > 1 表示 Web 的解决 odds 更高；OR = 1 对应两组 odds 相同。

但 OR 不能直接翻译成“概率提高了多少倍”。当事件很常见时，odds ratio 和 risk ratio 可能差得很明显。

## 为什么 odds ratio 会自然连接到逻辑回归

Logistic regression 使用 log-odds：

\[
\log\left(\frac{p}{1-p}\right)
=\beta_0+\beta_1X
\]

如果 \(X\) 是二元组别，\(e^{\beta_1}\) 就可以解释为调整前提下的 odds ratio。

这意味着分类数据分析和逻辑回归不是两个割裂主题。

列联表处理少数类别之间的直接比较；逻辑回归则可以继续加入多个解释变量，例如渠道、客户等级、等待时间和地区，在同一模型中估计条件关联。

```r
service$resolved_flag <- ifelse(service$resolved == "Yes", 1, 0)

fit <- glm(
  resolved_flag ~ channel,
  data = service,
  family = binomial()
)

exp(coef(fit))
```

模型系数的指数形式与 odds ratio 联系起来，但仍然要先确认事件类编码和参考组。

## Simpson's paradox 提醒不要忽略分层结构

整体比例可能掩盖关键分组。

假设 Web 客户更多来自简单问题，而 Store 接触更多复杂问题。整体上 Web 解决率更高，可能一部分只是因为问题类型组成不同。

可以按 severity 分层查看：

```r
with(service_detail, table(channel, resolved, severity))
```

或者用条件比例分别比较。

如果每个 severity 层内差异都很小，但整体差异很大，说明 composition effect 可能在主导结果。

这也是为什么“总体相关”不能自动解释成渠道本身造成了效果。观察数据中的混杂需要单独处理。

## 多分类变量会产生更大的列联表

分类变量不一定只有两类。

例如地区有 4 类、结果有 3 类，得到 4×3 表：

```r
tab_region <- table(customer$region, customer$outcome)
chisq.test(tab_region)
```

整体卡方检验只能告诉是否存在某种关联，不会指出哪些单元格贡献最大。

可以查看 standardized residuals：

```r
chi_region <- chisq.test(tab_region)
chi_region$stdres
```

绝对值较大的 residual 提示某个组合的观察频数与独立模型期望差异较大。

但如果随后对很多单元格逐个做检验，还要注意多重比较问题。

## 类别顺序存在时，不要完全丢掉顺序信息

如果变量是 Low / Medium / High 这类 ordinal category，普通卡方检验会把它们当成没有顺序的类别。

有时这正是需要的；有时研究问题关心的是单调趋势。

例如服务优先级从低到高时，升级率是否持续上升。此时除了完整列联表，也可以查看按顺序排列的条件比例，或者使用专门考虑顺序的模型。

关键不是强行寻找一个“更高级”的检验，而是不要在数据录入时把 ordinal 误处理成 nominal 后忘记它原本的结构。

## 缺失类别要区分“未知”和“真实类别”

分类变量里经常出现：

```text
Unknown
Not recorded
Not applicable
Other
```

这些标签含义不同。

`Other` 可能是真实类别；`Unknown` 可能是缺失；`Not applicable` 则表示该字段对某些记录不适用。

如果把它们全部合并成一个普通 factor level，比例和检验结果都会混入数据质量问题。

正式分析前最好先检查：

```r
table(customer$category, useNA = "ifany")
```

并把 missingness 本身当成需要解释的数据现象。

## 常见误读

**“类别用数字编码以后就能算均值。”** 编码只是存储，不改变变量语义。

**“百分比越大就一定显著。”** 显著性还取决于样本量和随机波动。

**“p 值小说明关联很强。”** p 值不是效果大小。

**“OR=2 就是概率翻倍。”** odds 和 probability 不在同一尺度。

**“总体比例差异就是因果效果。”** 分组组成和混杂可能改变整体结果。

**“卡方检验通过以后就不用看表。”** 真正的方向和业务含义仍然来自频数、条件比例和效果指标。

## 一条实用的分类数据分析顺序

面对两个类别变量，可以按下面顺序推进：

1. 明确每一行代表什么；
2. 检查类别定义、顺序和缺失值；
3. 打印频数表；
4. 明确分母后计算条件比例；
5. 用比例柱状图检查结构；
6. 需要推断时选择卡方或精确方法；
7. 查看 effect size，而不是只读 p-value；
8. 二元问题可进一步报告 risk difference、risk ratio 或 odds ratio；
9. 检查分层后关系是否改变；
10. 需要控制多个变量时，再进入 logistic regression。

这条路线把“类别数据”从简单计数一直连接到后面的分类模型，同时保留统计解释需要的分母、比较尺度和不确定性。

## 参考资料

知识结构参考 Rafael A. Irizarry 的 _Introduction to Data Science_ 中 categorical data 的可视化与总结，以及新版 _Statistics and Prediction Algorithms Through Case Studies_ 在线性模型部分对 chi-square、odds ratio 与 generalized linear models 的连接。正文、业务示例和代码均重新组织。

参考站点：<https://rafalab.dfci.harvard.edu/dsbook-part-1/> 与 <https://rafalab.dfci.harvard.edu/dsbook-part-2/> 。原资料采用 CC BY-NC-SA 4.0 许可。
