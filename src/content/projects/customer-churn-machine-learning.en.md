---
translationKey: customer-churn-machine-learning
locale: en
slug: customer-churn-machine-learning
title: Customer Churn Prediction and Supervised Model Comparison
summary: Starting with 200,000 electric-vehicle charging customer records, this case study defines the modelling population, selects seven predictors, applies within-fold upsampling, compares five models and explains why Logistic Regression offers the best balance of discrimination, missed-churn control and interpretable risk signals.
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
  - Machine Learning
  - Supervised Learning
  - Classification
  - Predictive Modelling
  - Model Comparison
  - Customer Churn
  - Cross-validation
  - Confusion Matrix
updatedAt: 2026-08-09
---

## Project overview

The project begins with 200,000 electric-vehicle charging customer records and 25 original fields. It first excludes 4,000 Fleet records whose contracts and churn mechanism differ from those of individual customers, leaving a modelling population of 196,000. The objective is not to chase the highest Accuracy in isolation, but to choose a deployable model that balances discrimination, churn recall, false-positive control and risk interpretation.

## Data and predictors

The field audit removes identifiers, target-derived fields and redundant inputs, leaving 7 predictors. Signup tenure and weeks since the last charge have a correlation of 0.88, so only the latter is retained as the more direct measure of current inactivity. The hold-out set contains 12,114 churned and 27,086 retained records.

## Validation design

A stratified 80/20 split produces 156,800 training records and 39,200 hold-out records. Model comparison uses a stratified sample of 30,000 records drawn only from the training partition with 5-fold CV; preprocessing and upsampling occur inside each fold. The hold-out set remains isolated until the model has been selected.

## Model comparison

The same validation framework compares Logistic Regression, Naive Bayes, Random Forest, LightGBM and XGBoost. LightGBM records an Accuracy of 0.8199, Naive Bayes a Sensitivity of 0.8318, and XGBoost a Specificity of 0.8370. Logistic Regression has the highest CV AUC at 0.9024 while retaining coefficients that can be expressed as odds ratios.

## Final evaluation

On the 39,200 hold-out records, Logistic Regression achieves an Accuracy of 0.8142, AUC of 0.9053, Sensitivity of 0.8331 and Specificity of 0.8058. The confusion matrix contains 31,917 correct decisions and 7,283 errors, so the conclusion reports both missed churners and retained customers incorrectly flagged as churn rather than treating the 81.42% accuracy as the only criterion.

## Interpretation and limitations

The final model links service quality, commercial friction, usage recency and plan tier to the direction of risk, with uncertainty expressed through a 95% confidence interval. The output supports risk ranking and targeted follow-up; it does not prove that any predictor causes churn. Before deployment, time drift, threshold costs and performance on new customer groups still require review.
