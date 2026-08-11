---
translationKey: influential-observations
locale: zh
slug: influential-observations
title: 异常点与影响点：Leverage、Cook’s Distance 与 DFBETA
summary: 区分 response outlier、high leverage 与 influential observation，理解 hat values、标准化残差、Cook’s distance 和 DFBETA 各自回答的问题，并建立不依赖“自动删点”的敏感性分析流程。
tags:
  - 异常点
  - 高杠杆点
  - CookDistance
  - DFBETA
topics:
  - 回归与统计建模
  - 模型诊断
  - 数据质量
tools:
  - R
  - Base R
series: 回归与统计建模
seriesSlug: regression
order: 5
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes:
  - regression-diagnostics
  - regression-feature-selection
---

## 三个概念必须先分开

异常点分析中最容易混在一起的三个概念是：outlier、high leverage point 和 influential observation。它们相关，但不是同义词。

**Outlier** 通常指结果变量方向上偏离模型较大的观察值，也就是残差异常。**High leverage point** 指解释变量组合位于 X 空间边缘的观察值。**Influential observation** 指删除或轻微改变该观察后，模型系数、拟合值或结论明显变化的记录。

一个点可能有大残差但 leverage 不高；也可能 X 极端但恰好落在回归趋势上，因此 leverage 高而 residual 不大。真正容易改变模型的是 leverage 与 residual 同时不小的记录。

<div data-learning-slot="influence-diagnostics-lab"></div>

## High leverage 来自 X 空间

在线性回归中，hat matrix：

\[
H=X(X'X)^{-1}X'
\]

其对角元素 \(h_{ii}\) 称为 leverage。它表示第 i 条记录在确定自身拟合值时具有多大权重。

平均 leverage 约为：

\[
\frac{p}{n}
\]

其中 p 是包含截距在内的参数数量。经验筛查有时使用 \(2p/n\) 或 \(3p/n\) 作为提醒线，但这些并不是“超过就删除”的规则。

业务上，高 leverage 常意味着样本边缘情景：极大订单、极远路线、极高收入客户、罕见产品组合或非常高的工作负荷。这样的记录可能恰恰是决策最关心的区域。

## Outlier 来自 Y 方向

原始残差受误差尺度和 leverage 影响，因此通常更适合检查 standardized 或 studentized residuals。

标准化残差的思想是：

\[
r_i=\frac{e_i}{\widehat{SD}(e_i)}
\]

它让不同记录的残差更可比较。

常见经验提醒会关注 \(|r_i|>2\) 或更大，但大样本中自然会出现一些极端残差。真正需要的是核验来源：数据录入是否错误、业务事件是否异常、模型是否遗漏了某个机制。

## Cook’s Distance把残差和 leverage 合在一起

Cook’s distance 衡量删除某条记录后，整组拟合值变化有多大。其结构同时包含残差和 leverage，因此比单独看其中一个更接近“影响力”。

直觉上：

- residual 大但 leverage 很低：点离线远，但未必能拉动整条线；
- leverage 高但 residual 很小：点在 X 边缘，却与模型趋势一致；
- 两者都明显：Cook’s distance 往往较大。

“Cook’s D > 1”或“超过 4/n”都只能用于筛查。是否重要还取决于样本量、模型目标和该记录的业务意义。

## DFBETA直接看某个系数被改变多少

Cook’s distance给出整体影响，而 DFBETA 关注单条记录对特定系数的影响。

设 \(\hat\beta_j\) 是使用全部样本估计的第 j 个系数，\(\hat\beta_{j(i)}\) 是删除第 i 条记录后的估计，则 DFBETA 的核心是比较两者差异。

这非常适合回答：

- 哪条记录让距离系数变得更大？
- 哪条记录决定了某个类别变量是否显著？
- 截距是否主要由少数边缘样本确定？

在解释性模型中，这类系数级敏感性往往比单独列 Cook’s D 更有价值。

## 影响诊断的正确顺序

建议把流程固定为：

1. **识别**：用 residual、leverage、Cook’s D、DFBETA 筛查；
2. **核验**：检查数据来源、单位、编码和事件背景；
3. **分类**：数据错误、真实稀有事件、目标总体外记录，还是模型失配；
4. **敏感性分析**：保留与排除两种模型都估计；
5. **比较结论**：记录系数、区间、预测和诊断是否变化；
6. **决定处理**：基于分析目标，而不是阈值自动决定。

## 为什么“直接删掉异常点”危险

如果某条记录是真实业务风险，删除它会让模型只描述“正常世界”。例如供应中断、极端客诉、超大订单、设备异常高温，往往是运营最需要理解的事件。

相反，如果记录来自明显录入错误，例如距离单位把 km 写成 m，保留它只会污染模型。

因此，异常处理必须记录原因。高质量报告应能回答“为什么这个点被排除”，而不是只写“because Cook’s distance is high”。

## 数据错误与分布尾部要区分

真实数据常有长尾。订单金额、服务时长、损失金额等变量本来就可能右偏。长尾中的大值不是自动错误。

判断顺序可以是：

- 是否违反物理/业务范围；
- 是否与原始记录一致；
- 是否来自不同流程或群体；
- 是否存在单位或编码错误；
- 是否只是合理但罕见的尾部值。

如果是不同数据生成机制，可能需要分层模型或额外变量，而不是删点。

## R 中的常用诊断函数

```r
model <- lm(savings_rate ~ young_share + old_share + income_growth,
            data = economy)

hatvalues(model)
rstandard(model)
cooks.distance(model)
dfbeta(model)

plot(model, which = 4)
plot(model, which = 5)
```

建议不要把所有输出直接截图放进报告。更有效的做法是先筛出最值得解释的 3–5 条记录，再建立一张诊断表：record id、standardized residual、leverage、Cook’s D、关键 DFBETA、业务备注。

## 删除前后的模型对比

假设关键系数为距离斜率。可以估计：

```r
full_model <- lm(delivery_hours ~ distance_km + order_size, data = delivery)
reduced_model <- update(full_model, data = subset(delivery, record_id != "R17"))

coef(full_model)
coef(reduced_model)
confint(full_model)
confint(reduced_model)
```

如果删除一条记录后核心系数方向反转、区间大幅收缩或预测发生明显变化，需要在结论中说明模型对该记录敏感。

## 高 leverage 还暴露样本覆盖问题

如果多个关键预测点都位于历史样本 X 空间边缘，问题可能不是“几个坏点”，而是训练数据覆盖不足。

例如模型用于预测大型企业客户，但历史样本几乎全是中小客户。大型企业样本自然成为高 leverage。此时真正的改进方向是补充数据，而不是删除它们。

## 影响点与外推风险

高 leverage 区域通常也是外推风险较高区域。即使一个点没有强影响，它仍提示模型在该区域依赖较少邻近数据。

对重要业务决策，可以报告局部数据密度、prediction interval 和距离训练分布的位置，而不是只给一个点预测。

## 把影响诊断变成决策敏感性表

单独报告 Cook’s D 排名很难说明“这个点为什么重要”。更可复查的做法，是把统计影响与业务后果放进同一张敏感性表。每条候选记录至少记录：原始业务场景、leverage、standardized residual、Cook’s D、关键系数删除前后差异，以及关键预测是否改变。

例如某个远距离大订单删除后，距离系数从 0.065 变为 0.052，但高风险订单的预测排序基本不变。对于解释任务，这个变化值得报告；对于只要求稳定排序的运营预警，影响可能较小。反过来，如果删掉一条记录就让核心变量符号反转，即使总体 RMSE 几乎不变，也说明解释结论不稳健。

因此，“影响大不大”必须针对分析目标判断：系数解释、平均预测、极端场景预测和排序任务可能得到不同答案。影响诊断最终应回答的是结论对数据扰动有多敏感，而不是找到一个统一的删除阈值。

## 常见错误

- 把 outlier、leverage 和 influence 当成一个概念。
- 使用固定阈值自动删点。
- 只看 Cook’s D，不检查关键系数 DFBETA。
- 删除记录后不重新估计诊断与区间。
- 把真实稀有事件当作“脏数据”。
- 忽略高 leverage 背后的样本覆盖不足。
- 不记录删除理由，导致分析不可审计。

## 下一步

影响点处理解决“哪些观察值主导模型”，下一步是“哪些变量应该进入模型”。REG06 将系统比较 adjusted R²、BIC、validation/CV、Ridge、Lasso、PCR 与 PLS，并强调变量选择目标必须先于算法。