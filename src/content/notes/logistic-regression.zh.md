---
translationKey: logistic-regression
locale: zh
slug: logistic-regression
title: 逻辑回归
summary: 当结果只有“是或否”时，普通线性回归就不太合适。这里从概率和 odds 开始，讲清 Logistic Regression 的系数、odds ratio、预测概率和分类阈值。
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

## 结果只有 0 和 1 时，问题已经变了

有些业务结果不是连续数值，而是两种状态：客户是否流失、订单是否延迟、设备是否故障、申请是否违约。

这时 Y 只有 0 和 1：

\[
Y\in\{0,1\}
\]

真正需要估计的不是一个可以无限增减的连续均值，而是事件发生的概率：

\[
P(Y=1\mid X)=p(X)
\]

如果直接套普通线性回归，预测值可能小于 0 或大于 1，而且误差方差会随着概率改变。这样的模型可以做粗略探索，却不是二元结果最自然的表达方式。

Logistic Regression 的做法是把概率先转换到一个可以落在整个实数轴上的尺度上。

## 从 probability 到 odds

假设某位客户流失的概率是 0.8，那么不流失的概率就是 0.2。

Odds 定义为：

\[
odds=\frac{p}{1-p}
\]

所以：

```text
p = 0.80
odds = 0.80 / 0.20 = 4
```

意思是“事件发生”和“不发生”的相对机会是 4:1。

概率 0.5 对应 odds=1；概率小于 0.5 时 odds<1；概率大于 0.5 时 odds>1。

Odds 和 probability 可以互相转换：

\[
p=\frac{odds}{1+odds}
\]

这个转换是理解逻辑回归系数的第一步。

## Log-odds 把 0 到 1 的概率拉到整条数轴

概率被限制在 0 到 1，odds 被限制在 0 到正无穷。再对 odds 取对数，就得到 log-odds：

\[
\log\left(\frac{p}{1-p}\right)
\]

它可以取任意实数。

逻辑回归把这个量写成解释变量的线性组合：

\[
\log\left(\frac{p}{1-p}\right)=\beta_0+\beta_1X_1+\cdots+\beta_pX_p
\]

这就是 logit link。

右边仍然是一条线性预测器，但经过反向转换以后，最终概率会形成一条 S 形曲线，并且始终留在 0 和 1 之间。

<div data-learning-slot="logistic-regression-lab"></div>

## 系数不能直接解释成“概率增加多少”

在线性回归里，斜率经常能直接说成 Y 平均增加多少。逻辑回归不是这样。

\(\beta_j\) 表示 Xj 每增加 1 个单位，**log-odds** 改变 \(\beta_j\)。这个尺度对业务读者通常不够直观，所以更常把系数指数化：

\[
OR=e^{\beta_j}
\]

得到 odds ratio。

如果某个系数是：

\[
\beta_j=0.693
\]

那么：

\[
e^{0.693}\approx2
\]

可以说，在模型中的其他变量保持不变时，Xj 增加 1 个单位，对应的 odds 大约变成原来的 2 倍。

注意，这不是“概率翻倍”。Odds 和 probability 不是同一个尺度。

## 同一个 odds ratio，在不同基准概率下影响不同

假设 odds 翻倍。

如果原来的概率只有 0.10：

```text
odds = 0.10 / 0.90 = 0.111
翻倍后 odds = 0.222
新概率 ≈ 0.182
```

概率从 10% 上升到约 18.2%。

如果原来的概率是 0.50：

```text
odds = 1
翻倍后 odds = 2
新概率 = 2 / 3 ≈ 0.667
```

概率从 50% 上升到约 66.7%。

所以 odds ratio 很适合描述乘法变化，但如果最终要做业务决策，通常还应该把结果转换回概率。

## 预测概率是怎么得到的

先计算线性预测器：

\[
\eta=\beta_0+\beta_1X_1+\cdots+\beta_pX_p
\]

再通过 logistic 函数转回概率：

\[
p=\frac{1}{1+e^{-\eta}}
\]

R 中可以直接得到概率：

```r
model <- glm(churn ~ tenure + monthly_charge,
             data = customer_df,
             family = binomial())

prob <- predict(model, type = "response")
```

`type = "response"` 返回的是概率，而不是 log-odds。

如果要看模型系数：

```r
coef(model)
```

如果要看 odds ratio：

```r
exp(coef(model))
```

## 概率和分类标签是两件事

逻辑回归原生输出的是概率。要把概率变成 0/1 分类，还需要人为选择阈值。

最常见的是 0.5：

```r
pred_class <- ifelse(prob >= 0.5, 1, 0)
```

但 0.5 并没有天然的业务优先级。

假设识别流失客户时，漏掉一个真正会流失的客户代价很高，那么阈值可能需要降低，让模型更愿意判为正类。反过来，如果每一次干预都很昂贵，阈值可能需要提高。

因此，阈值不是模型“算出来的最终答案”，而是模型概率和业务成本之间的连接点。

## 阈值变化会改变错误类型

二分类结果可以整理成 confusion matrix：

```text
                Actual 1   Actual 0
Predicted 1        TP         FP
Predicted 0        FN         TN
```

降低阈值通常会：

- 找到更多正类，TP 增加；
- 同时也会误报更多，FP 增加；
- FN 通常下降。

提高阈值往往相反。

这就是 sensitivity / recall 和 specificity 之间常见的权衡。

单纯追求 accuracy 很容易忽略业务成本。如果正类本来就很少，全部预测为 0 也可能得到很高 accuracy，却完全失去识别能力。

## 系数显著不代表分类效果一定好

逻辑回归仍然可以对系数做统计推断，查看标准误、z 统计量、p 值和置信区间。

但“某个变量显著”与“模型分类很好”是两件不同的事。

系数推断关注变量和 log-odds 的关系是否有证据；预测评估更关心概率排序、校准和阈值后的分类结果。

因此，分类模型通常还需要查看：

- ROC / AUC；
- precision 与 recall；
- confusion matrix；
- calibration；
- 不同阈值下的业务成本。

这些指标回答的问题不同，不应该只挑一个最好看的数字。

## 概率校准和排序能力也要分开

一个模型可能很擅长把高风险客户排在前面，却把概率整体估得太高或太低。

例如真实流失率大约 20%，模型却经常给出 50% 到 70% 的概率。它的排序能力可能不错，但概率本身不够可信。

如果概率要进入预算、容量规划或风险定价，calibration 就非常重要。

分类模型最终是只需要“谁更危险”的排序，还是需要“有多大概率”的数值，会影响评估方式。

## 类别不平衡时不要只看默认结果

如果正类比例很低，比如故障率只有 2%，模型训练和评估都需要更谨慎。

这时：

- accuracy 很容易虚高；
- 默认 0.5 阈值可能几乎不预测正类；
- precision 和 recall 更值得单独看；
- PR curve 有时比 ROC 更能反映少数类表现；
- 阈值需要结合实际干预能力设置。

类别不平衡不是简单地“把少数类复制几遍”就结束。先确定业务目标和评价指标，再决定是否需要重采样或权重调整。

## 一套更实用的逻辑回归阅读顺序

1. 先确认 Y 真的是二元结果，并明确 1 代表什么；
2. 看系数方向，再用 odds ratio 解释相对变化；
3. 把关键案例转换成预测概率，避免只停在 log-odds；
4. 检查置信区间，确认系数估计是否稳定；
5. 用 AUC、precision、recall 和 calibration 评估概率模型；
6. 根据 FP、FN 的实际代价选择分类阈值；
7. 最后检查模型在新数据上的表现。

逻辑回归最有价值的地方，不是把 0 和 1 分开，而是把解释变量和事件发生概率之间的关系写成一个可以解释、可以评估，也可以真正用于决策的模型。
