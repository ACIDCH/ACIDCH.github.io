---
translationKey: logistic-regression
locale: zh
slug: logistic-regression
title: Logistic Regression：从 Log-Odds 到概率、阈值与分类决策
summary: 系统理解二元结果为何不适合普通线性回归，推导 logit、odds 与 probability 的关系，解释 odds ratio、预测概率、置信区间和分类阈值，并把模型输出连接到业务成本与分类错误。
tags:
  - LogisticRegression
  - OddsRatio
  - 分类阈值
  - 二元结果
topics:
  - 回归与统计建模
  - 分类建模
  - 机器学习
tools:
  - R
  - glm
series: 回归与统计建模
seriesSlug: regression
order: 7
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes:
  - regression-feature-selection
  - descriptive-statistics
---

## 为什么二元结果不能直接照搬 OLS

当结果变量只有 0/1，例如是否流失、是否延迟、是否违约、是否故障，普通线性回归会遇到明显问题：预测值可能小于 0 或大于 1，而且误差方差天然依赖于预测概率。

对于 Bernoulli 结果：

\[
Y\in\{0,1\},\qquad P(Y=1\mid X)=p(X)
\]

Logistic Regression 不直接把 Y 的均值写成一条无限延伸的直线，而是把概率通过 logit link 映射到整个实数轴：

\[
\log\left(\frac{p}{1-p}\right)=\beta_0+\beta_1X_1+\cdots+\beta_pX_p
\]

左侧称为 log-odds。

## Probability、Odds 与 Log-Odds

概率：

\[
p=P(Y=1)
\]

odds：

\[
Odds=\frac{p}{1-p}
\]

例如 p=0.8，则 odds=4，表示事件发生与不发生的相对机会为 4:1。

log-odds：

\[
\log(Odds)=\log\left(\frac{p}{1-p}\right)
\]

logistic model 在线性预测器尺度上是线性的，但转换回概率后形成 S 型曲线：

\[
p=\frac{\exp(\eta)}{1+\exp(\eta)},\qquad \eta=X\beta
\]

因此，X 增加一个单位不会让概率在所有位置都增加固定数值。靠近 p=0.5 的区域，概率变化往往更敏感；接近 0 或 1 时同样的 log-odds 变化产生较小概率变化。

<div data-learning-slot="logistic-regression-lab"></div>

## Logistic 系数直接作用在 Log-Odds 上

单变量模型：

\[
\log\left(\frac{p}{1-p}\right)=\beta_0+\beta_1X
\]

X 每增加 1，log-odds 增加 \(\beta_1\)。指数化系数：

\[
\exp(\beta_1)
\]

得到 odds ratio。

若 \(\exp(\beta_1)=1.25\)，可以解释为：在其他变量保持不变时，X 每增加 1，事件 odds 乘以 1.25，也就是增加 25%。

这不是“概率增加 25%”。odds ratio 与 probability change 是不同尺度。

## Odds Ratio 的解释必须带上单位

如果 X 是温度、金额、年龄、距离等连续变量，一个单位可能太小或太大。可以把变量缩放成更有意义的单位，例如每 10 km：

\[
X_{10}=Distance/10
\]

此时 OR 表示每增加 10 km 的 odds 变化，更容易沟通。

对于类别变量，OR 通常相对于 reference group。例如 premium 客户的 OR=0.65，表示在其他变量相同条件下，其事件 odds 是基准客户的 0.65 倍。

## 截距通常不需要强行解释

\(\beta_0\) 表示所有连续变量为 0、类别变量处于 reference 时的 log-odds。如果这些零值没有业务意义，截距只用于定位概率曲线。

通过中心化连续变量，可以让截距对应更合理的基准场景，例如平均距离、平均订单规模下的事件概率。

## 最大似然代替最小二乘

Logistic Regression 通常通过 maximum likelihood estimation 估计参数。每条记录对似然的贡献来自模型给真实结果赋予的概率。

对 Bernoulli 数据：

\[
L(\beta)=\prod_i p_i^{y_i}(1-p_i)^{1-y_i}
\]

实际计算使用 log-likelihood。模型会寻找使观察到的 0/1 结果整体最可能出现的参数。

因此，Logistic 的 deviance 与线性回归 SSE 不是同一种度量。

## Deviance 与 Likelihood Ratio Test

Null deviance 对应只有截距的模型；residual deviance 对应加入解释变量后的模型。

比较 nested logistic models 时，deviance difference 可以形成 likelihood ratio test：

\[
2(\ell_{full}-\ell_{reduced})
\]

在适当条件下近似服从卡方分布，用来判断新增变量组是否显著改善模型。

## Wald Test 与置信区间

`summary(glm(...))` 中常见 z test 使用：

\[
z=\frac{\hat\beta_j}{SE(\hat\beta_j)}
\]

对于 odds ratio，置信区间可以在 log-odds 尺度构造后指数化：

\[
\exp(\hat\beta_j\pm z_{\alpha/2}SE)
\]

如果 OR 区间跨过 1，说明在该置信水平下没有足够证据排除“odds 不变”。

## 预测概率比单独系数更接近业务决策

对某个具体客户或订单，最直接输出是：

\[
\hat p=P(Y=1\mid X)
\]

例如流失概率 0.73、延迟概率 0.42。概率可以直接进入资源分配、排序、预警或成本模型。

但一个概率值本身还不是分类决策。要把概率转成类别，需要阈值。

## 分类阈值不是固定 0.5

常见默认规则：

\[
\hat y=1\quad\text{if}\quad \hat p\ge 0.5
\]

0.5 只是一个方便默认值，不是统计定律。

如果漏掉一次高风险事件代价很高，可以降低阈值，提高 recall，但通常会增加 false positives。如果人工复核资源昂贵，则可能提高阈值。

阈值应该由业务损失、容量和风险偏好决定。

## Confusion Matrix

在给定阈值后：

| | 实际 1 | 实际 0 |
| --- | --- | --- |
| 预测 1 | TP | FP |
| 预测 0 | FN | TN |

常见指标：

\[
Recall=\frac{TP}{TP+FN}
\]

\[
Precision=\frac{TP}{TP+FP}
\]

\[
Specificity=\frac{TN}{TN+FP}
\]

不同指标对应不同错误成本，因此不存在脱离业务目标的“最佳阈值”。

## 概率校准与排序能力要区分

一个模型可以很会排序高风险与低风险样本，却把 0.8 风险实际预测成 0.6；也可以概率校准很好，但区分能力一般。

对于需要用概率做成本期望、库存准备或风险定价的场景，calibration 尤其重要。只报告 accuracy 或 AUC 不足以说明概率质量。

## Link Function 不只有 Logit

二元 GLM 还可以使用 probit、complementary log-log 等 link。它们在中间概率区域往往相近，但尾部行为不同。

Logit 的优势是 odds ratio 解释直接，因此商业分析中非常常见。选择其他 link 应有数据生成过程或建模目的支持，而不是为了微小拟合改善随意替换。

## R 中建立 Logistic Regression

```r
model <- glm(
  late_delivery ~ distance_km + order_size + priority,
  data = delivery,
  family = binomial(link = "logit")
)

summary(model)
exp(coef(model))
exp(confint(model))

new_orders <- data.frame(
  distance_km = c(20, 70),
  order_size = c(3, 8),
  priority = c("standard", "priority")
)

predict(model, newdata = new_orders, type = "response")
```

要注意类别变量的 reference level、训练数据因子 levels 和新数据编码一致。

## Separation 会让系数失控

如果某个变量或组合能完美区分 0 与 1，就可能出现 complete separation。此时最大似然估计会把某些系数推向非常大的绝对值，标准误也异常。

例如样本中所有“critical”订单都发生延迟，而其他订单都不延迟。普通 logistic 输出可能表现为巨大系数而不是简单报错。

解决方向包括增加数据、重新定义稀有类别、使用 penalized logistic 或适合 separation 的估计方法。

## 类别不平衡不能只看 Accuracy

若只有 3% 样本为正类，全部预测 0 就有 97% accuracy，却完全没有业务价值。

此时更需要关注 recall、precision、PR curve、cost-sensitive threshold 和概率校准。训练阶段也要避免把 re-sampling 后的人工类别比例直接当成真实概率基准。

## Logistic Regression 与解释边界

即使加入多个控制变量，odds ratio 仍然是条件关联，不自动形成因果结论。若变量本身由事件之后才产生，还可能发生 target leakage。

例如使用“取消后产生的工单状态”预测取消，模型性能再高也无法提前决策。

## 一条完整建模流程

二元回归应形成：业务事件定义 → 时间窗口与观察单位 → 探索类别比例 → 特征时间可用性 → logistic 估计 → 系数/OR 与预测概率解释 → calibration 与 discrimination → 阈值成本 → 样本外验证 → 监控概率漂移。

## 常见错误

- 把 Logistic 系数直接解释成概率变化。
- 把 odds ratio 误写成 probability ratio。
- 默认 0.5 是最优阈值。
- 类别极不平衡时只报 accuracy。
- 用训练集选择阈值并同时报告最终性能。
- 忽略 separation 和巨大标准误。
- 新数据 factor level 与训练集不一致。
- 把事件之后的信息放进预测特征造成 leakage。

## 系列收束

从简单线性回归到 Logistic Regression，这条路径的核心并不是记忆更多 R 函数，而是不断明确五件事：**估计对象是什么、模型条件是什么、诊断信号说明什么、复杂度为何增加、输出如何连接业务决策。**

当这五个问题能够稳定回答，回归模型才从代码练习变成可复查的分析工具。