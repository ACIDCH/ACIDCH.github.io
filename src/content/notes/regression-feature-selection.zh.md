---
translationKey: regression-feature-selection
locale: zh
slug: regression-feature-selection
title: 特征选择与正则化：Adjusted R²、BIC、CV、Ridge 与 Lasso
summary: 把变量选择从“找显著变量”升级为模型选择问题，比较 adjusted R²、BIC、validation/CV、Ridge、Lasso、PCR 与 PLS 的目标差异，并说明解释模型与预测模型为何需要不同选择策略。
tags:
  - 特征选择
  - Ridge
  - Lasso
  - CrossValidation
topics:
  - 回归与统计建模
  - 机器学习
  - 模型选择
tools:
  - R
  - glmnet
series: 回归与统计建模
seriesSlug: regression
order: 6
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes:
  - multiple-regression-multicollinearity
  - logistic-regression
---

## 变量越多，训练拟合几乎总会更好

普通最小二乘中，只要加入新的解释变量，训练集 SSE 不会增加，R² 也不会下降。因此“挑 R² 最大的模型”几乎等于选择最复杂模型。

变量选择真正要解决的是：**新增信息带来的收益，是否值得额外复杂度、解释成本和样本外不稳定性？**

解释性模型更重视参数含义、理论一致性和稳健性；预测模型更重视未见数据上的损失。两类目标可以使用同一组算法，但最终选择标准不应完全一样。

<div data-learning-slot="model-selection-lab"></div>

## Adjusted R²给复杂度加入轻度惩罚

Adjusted R²：

\[
\bar R^2=1-(1-R^2)\frac{n-1}{n-p-1}
\]

其中 p 是解释变量数量。新增变量只有在改善拟合达到一定程度时，adjusted R² 才会上升。

它适合快速比较同一结果变量、同一样本上的线性模型，但惩罚相对温和，不应被当成唯一选择标准。

## BIC更偏向简洁模型

Bayesian Information Criterion 常写作：

\[
BIC=-2\log L+k\log n
\]

其中 k 是参数数量。BIC 越小越优。与 adjusted R² 相比，BIC 对复杂度的惩罚通常更强，因此在候选变量很多时更容易偏向较小模型。

BIC 的优势是把拟合与复杂度压缩为一个可比较指标，但它并不直接测量未来数据的预测误差。

## 为什么逐步回归容易让人过度自信

Forward、backward 和 stepwise selection 很方便，但数据驱动的重复试选会放大选择不确定性。最终模型的 p 值和标准误往往没有反映“变量本身是通过数据筛出来的”这一额外不确定性。

此外，两个高度相关变量可能互相替代，轻微样本变化就会让逐步算法选不同变量。因而逐步回归更适合作为探索工具，而不是自动生成最终解释模型的唯一流程。

## Validation set把选择目标转向样本外表现

将数据分成训练集和验证集后，每个候选模型都在训练集估计，再在验证集计算 MSE：

\[
MSE_{val}=\frac{1}{m}\sum(y_i-\hat y_i)^2
\]

这直接回答“哪个模型对未用于拟合的数据预测更好”。

单次切分的问题是结果受随机分组影响，因此更稳健的方法通常是 K-fold cross-validation。

## K-fold Cross Validation

K-fold CV 把数据分成 K 份。每次使用 K−1 份训练、剩余一份验证，循环 K 次后平均损失：

\[
CV=\frac{1}{K}\sum_{k=1}^{K}Loss_k
\]

常见 K=5 或 10。CV 不是完全免费的：如果同时搜索很多特征组合、超参数和变换，整个选择过程仍可能对 CV 结果过拟合，因此重要项目最好保留独立 final test set。

## Ridge：保留全部变量，但收缩系数

Ridge regression 优化：

\[
\min_{\beta}\sum(y_i-\hat y_i)^2+\lambda\sum_{j=1}^{p}\beta_j^2
\]

L2 penalty 会把系数向 0 收缩，但通常不会让它们精确变为 0。

当多个预测变量高度相关时，Ridge 往往比 OLS 更稳定，因为它不要求模型在高度重叠的信息之间做出极端系数分配。

## Lasso：收缩同时产生稀疏模型

Lasso 使用 L1 penalty：

\[
\min_{\beta}\sum(y_i-\hat y_i)^2+\lambda\sum_{j=1}^{p}|\beta_j|
\]

部分系数可能被压到恰好 0，因此 Lasso 同时完成正则化与变量选择。

但当一组变量高度相关时，Lasso 可能任意选择其中一个代表变量，导致选择结果对样本扰动敏感。此时“被选择”不应被解释为该变量具有唯一业务重要性。

## λ控制偏差与方差

\(\lambda=0\) 时回到无惩罚模型；\(\lambda\) 越大，系数收缩越强。

通常通过 cross-validation 选择 λ。常见有：

- `lambda.min`：CV 误差最低；
- `lambda.1se`：在最低误差一个标准误范围内选择更强收缩，往往更简洁。

对于预测项目，`lambda.1se` 常提供有吸引力的稳定性—复杂度折中，但仍应根据业务成本决定。

## 变量标准化为什么重要

Ridge 和 Lasso penalty 直接作用于系数大小。如果不同变量单位差异巨大，例如金额以万元、距离以 km、比例在 0–1 之间，未标准化会让惩罚失去可比性。

因此正则化通常先标准化数值变量。`glmnet` 默认会进行标准化，但实际流程仍应明确记录。

## PCR：先压缩 X，再回归 Y

Principal Components Regression 先对解释变量做 PCA，把多个相关变量转换成互相正交的主成分，再使用前几个主成分回归 Y。

优点是解决高维共线性并压缩维度。缺点是 PCA 只关注 X 中的方差，不关心哪些方向最能预测 Y。一个解释变量方向可能对 Y 很重要，却因为自身方差小而排在后面。

## PLS：降维时同时考虑 Y

Partial Least Squares 构造潜在成分时会同时考虑 X 与 Y 的关系，因此比 PCR 更偏向预测目标。

PCR 和 PLS 都会牺牲原始变量的直接系数解释。若项目需要清楚解释“哪个业务变量影响多少”，这类降维方法可能不如可解释的低维模型。

## R 中的一套选择框架

```r
full_model <- lm(balance ~ ., data = credit_data)

# regularisation
x <- model.matrix(balance ~ ., data = credit_data)[, -1]
y <- credit_data$balance

cv_lasso <- glmnet::cv.glmnet(x, y, alpha = 1)
cv_ridge <- glmnet::cv.glmnet(x, y, alpha = 0)
```

若进行 subset selection 或 CV，应固定随机种子并保存 fold assignment，以保证结果可复查。

## 解释模型与预测模型的选择逻辑

| 目标 | 更重要的证据 |
| --- | --- |
| 解释机制 | 理论、系数稳定、区间、共线性、诊断 |
| 预测新记录 | CV/test error、校准、稳定性 |
| 简化报告 | BIC、业务可解释性、最小必要变量集 |
| 高维预测 | Ridge/Lasso/降维 + 严格验证 |
| 变量发现 | 稳定选择、重复抽样、领域验证 |

模型选择没有脱离目标的“统一冠军”。

## 数据泄露会让选择结果虚高

特征筛选、标准化、缺失值处理、PCA 和超参数选择都必须在训练流程内部完成。如果先使用全数据选择变量，再进行 CV，验证折已经通过选择过程间接影响模型，CV 会过于乐观。

正确流程是把所有学习数据驱动规则放进每个训练 fold 内。

## 选择稳定性也是结果

如果重复不同训练样本时，某个变量有时被选、有时被丢弃，说明其“重要性”并不稳定。可以报告 selection frequency，而不是只展示一次最终集合。

对强相关变量组，变量组层面的稳定性往往比某一个变量是否入选更有意义。

## 常见错误

- 用最大训练 R²选择最终模型。
- 把逐步回归输出的 p 值当作未经过选择的普通推断。
- Ridge/Lasso 前忽略尺度差异。
- 用同一份 validation 数据反复调到满意，再把结果当无偏评估。
- 把 Lasso 选中的变量解释为因果重要因素。
- PCA/PCR 后仍按原始变量系数方式解释。
- 不保存随机 seed 和 fold，导致结果无法复现。

## 下一步

前六篇都以连续结果变量为主。REG07 将把结果换成二元事件，进入 **Logistic Regression**：重点从拟合数值变成建模概率，并区分 log-odds、odds ratio、预测概率与分类阈值。