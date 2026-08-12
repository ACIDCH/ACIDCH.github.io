---
translationKey: customer-churn-machine-learning
locale: zh
slug: customer-churn-machine-learning
title: 客户流失预测与监督学习模型比较
summary: 以 20 万条电动车充电客户记录为起点，沿着总体限定、七变量筛选、折内上采样、五模型交叉验证和留出评估，说明为什么 Logistic Regression 在判别能力、漏判控制与风险解释之间成为最终选择。
tools:
  - R
  - tidymodels
  - Machine Learning
  - Supervised Learning
  - Classification
topic: analytics
status: completed
featured: true
tags:
  - R
  - 机器学习
  - Machine Learning
  - 监督学习
  - Supervised Learning
  - 分类模型
  - Classification
  - 预测建模
  - Predictive Modelling
  - 模型比较
  - Model Comparison
  - 客户流失
  - Customer Churn
  - 交叉验证
  - 混淆矩阵
updatedAt: 2026-08-09
---

## 项目概览

项目从 200,000 条电动车充电客户记录和 25 个原始字段出发，先排除合同与流失机制不同的 4,000 条 Fleet 记录，再将 196,000 条个人客户记录作为建模总体。目标不是追逐单一最高 Accuracy，而是在判别能力、流失召回、误报控制与风险解释之间选择可部署的模型。

## 数据与变量

字段审计把标识符、目标来源和冗余变量移出候选集，最终保留 7 个 predictor。注册时长与距上次充电周数的相关系数为 0.88，因此只保留更直接表示当前不活跃程度的后者。留出集包含 12,114 条 churned 和 27,086 条 retained 记录。

## 验证设计

总体按目标变量进行 80/20 分层切分，得到 156,800 条训练记录和 39,200 条留出记录。模型比较只从训练部分分层抽取 30,000 条记录并执行 5-fold CV；预处理与上采样均限制在每个 fold 内。留出集在模型确定前保持隔离。

## 模型比较

同一验证框架比较 Logistic Regression、Naive Bayes、Random Forest、LightGBM 与 XGBoost。LightGBM 的 Accuracy 为 0.8199，Naive Bayes 的 Sensitivity 为 0.8318，XGBoost 的 Specificity 为 0.8370；Logistic Regression 以 0.9024 取得最高 CV AUC，并保留可转换为 odds ratio 的系数解释。

## 最终评估

Logistic Regression 在 39,200 条留出记录上的 Accuracy 为 0.8142、AUC 为 0.9053、Sensitivity 为 0.8331、Specificity 为 0.8058。混淆矩阵包含 31,917 个正确判断和 7,283 个错误判断，因此结论同时报告漏判流失客户与误报留存客户，而不把 81.42% 正确率当作唯一依据。

## 解释与限制

最终模型把服务质量、商业摩擦、使用间隔和计划层级连接到风险方向，并以 95% confidence interval 表达不确定性。结果支持风险排序和定向跟进，不证明任何变量会导致流失；数据来自既定客户总体，部署前仍需检查时间漂移、阈值成本和新客群表现。
