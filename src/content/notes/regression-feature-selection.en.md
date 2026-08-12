---
translationKey: regression-feature-selection
locale: en
slug: regression-feature-selection
title: Feature Selection and Regularisation
summary: Compare adjusted R², BIC, cross-validation, ridge and lasso to understand why explanatory and predictive models can reach different conclusions about which variables to retain.
tags:
  - feature selection
  - ridge regression
  - lasso
  - cross-validation
topics:
  - Regression Modelling
  - Machine Learning
  - Model Selection
tools:
  - R
  - glmnet
series: Regression Modelling
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

## More variables usually improve training fit

In linear regression, as long as a new explanatory variable is added, the SSE on the training set will not increase, and R² will not decrease. Therefore, if you choose a model based solely on training R², the most complex one will almost always win.

The problem is that a better fit on the training data does not mean that the model is really better. The new variables may simply remember accidental fluctuations in the sample, or they may make the coefficients difficult to interpret and more unstable to new data.

Feature selection really balances three things: information, complexity, and generalization ability.

If the model is mainly used to explain, the business meaning of the variables and the stability of the coefficients are important; if the model is mainly used to predict, the error on new data is usually more important. Both goals influence which variables are retained in the end.

<div data-learning-slot="model-selection-lab"></div>

## Adjusted R² applies a modest complexity penalty

Ordinary R² will only stay the same or rise as the variable increases. Adjusted R² considers the number of parameters in addition to the fit yield:

\[
\bar R^2=1-(1-R^2)\frac{n-1}{n-p-1}
\]

where n is the sample size and p is the number of explanatory variables.

If the R² improvement brought by the new variables is small, the penalty term may cause the Adjusted R² to decrease instead. This is more suitable for comparing linear models of varying complexity than looking at R² directly.

However, its penalty is not too strong, and it still mainly revolves around in-sample fit. Therefore it is suitable for quick comparison and should not be used as the only selection criterion.

## BIC prefers simple models

BIC, Bayesian Information Criterion, takes into account both the fit and the number of parameters. A common form can be written as:

\[
BIC=n\log\left(\frac{SSE}{n}\right)+k\log n
\]

where k is the number of parameters.

The smaller the BIC, the better. Compared with Adjusted R², it generally imposes a stronger penalty on complex models, so it is easier to select models with fewer variables.

This is often attractive in explanatory analyses: if two models fit similarly, the simpler model is usually easier to communicate and less likely to rely on sample noise.

However, BIC’s “simplicity” does not guarantee that the prediction will be the best. Prediction tasks should still look directly at out-of-sample performance.

## Cross-validation estimates performance on new data

Cross-validation, or CV for short, no longer only looks at the training data, but repeatedly sets aside part of the data for verification.

The basic process of K-fold CV is:

1. Divide the data into K parts;
2. Train with K-1 copies;
3. Use the remaining 1 parts to calculate the verification error;
4. Let each one be used as the verification set in turn;
5. Summarize K errors.

If the goal is prediction, CV is often closer to the real question than "which variable is significant?": How does the model perform when it encounters unseen data?

Note that CV also has random fluctuations. Especially when the sample size is small, it is best to use a fixed random seed or repeated cross-validation and compare whether the error difference is really meaningful.

## Why stepwise regression is easy to over-trust

Forward selection, backward elimination, and stepwise selection are all common. Their advantages are simplicity and automation, but their disadvantages also come from this automation.

If the model repeatedly selects variables based on the p-value or information criterion of the same sample, the final coefficients and significance will be subject to selection bias. Different samples may vary slightly and the paths may be completely different.

The stepwise method can be used as an exploratory tool, but it is not suitable for packaging the final result into "the only correct model". If there are control variables that must be retained in the business, the automatic algorithm should not be allowed to delete them at will just because of a single sample result.

## Ridge shrinks coefficients without removing predictors

Ridge regression adds an L2 penalty to the ordinary squared error:

\[
\min_{\beta}\left[\sum_{i=1}^{n}(y_i-\hat y_i)^2+\lambda\sum_{j=1}^{p}\beta_j^2\right]
\]

The larger \(\lambda\), the more strongly the coefficients are compressed.

Ridge is particularly suitable for situations where there are many variables and strong correlations with each other. It does not make the coefficients of collinear variables swing wildly like ordinary OLS, but distributes the weights more smoothly.

The price is that the model no longer pursues unbiased OLS coefficients, but trades a little bias for lower variance. For prediction tasks, this trade-off is often worthwhile.

## Lasso will push some coefficients to zero

Lasso uses L1 penalty:

\[
\min_{\beta}\left[\sum_{i=1}^{n}(y_i-\hat y_i)^2+\lambda\sum_{j=1}^{p}|\beta_j|\right]
\]

The biggest intuitive difference between it and Ridge is that Lasso can directly compress certain coefficients into 0, thus completing shrinkage and variable selection at the same time.

This makes the model look sparser and makes it easier to get a shorter list of variables.

But when a set of predictors is highly correlated, Lasso may choose to keep one among them and suppress the others, and this choice may vary from sample to sample. So "the coefficient is squashed to 0" does not mean that the variable has absolutely no business value.

## Standardise predictors before regularisation

Ridge and Lasso penalties act directly on the coefficient size. If one variable is measured in dollars and another in tens of thousands of dollars, the original scale will affect the severity of the punishment.

Therefore, regularized models usually standardize numerical variables first. `glmnet` will be processed accordingly by default, but you still need to be aware of what happens to the data scale when modelling.

In R, use:

```r
library(glmnet)

x <- model.matrix(y ~ ., data = df)[, -1]
y <- df$y

ridge_fit <- cv.glmnet(x, y, alpha = 0)
lasso_fit <- cv.glmnet(x, y, alpha = 1)
```

`alpha = 0` is Ridge and `alpha = 1` is Lasso. Cross-validation is often used to select \(\lambda\).

## PCR and PLS take a different route

Principal Components Regression (PCR) does not directly delete the original variables, but first compresses the highly correlated predictor variables into several principal components, and then uses these components for regression.

Its advantage is that it can handle high dimensions and collinearity, but the principal components are usually not as easy to interpret as the original business variables.

Partial Least Squares (PLS) will also construct new low-dimensional components, but the relationship between X and Y will be considered when constructing the components. Compared with PCR, it brings the prediction target into the dimensionality reduction process more directly.

PCR and PLS are more suitable for scenarios with many variables and complex related structures. For ordinary regressions with only a few clear business variables, it is often more natural to interpret the original variables directly.

## Explanatory and predictive goals lead to different choices

Suppose a variable contributes little to prediction error, but is an important confounding control variable. Explanatory models may still want to retain it, since deleting it would change the meaning of the other coefficients.

Conversely, a variable that is difficult to give a causal or business explanation can steadily improve out-of-sample predictions. Predictive models may be willing to leave it alone.

Therefore, it is very important to answer "what will the model ultimately be used for" before selecting variables.

```text
解释为主
→ 更关心变量含义、控制结构、系数稳定性

预测为主
→ 更关心 validation / CV loss 与泛化能力
```

If two different final models appear on the same set of data, it does not necessarily mean who did it wrong, it may just be that the goals are different.

## Do not restrict candidates to statistically significant variables

Screening variables with p-values is one of the most common practices, but it ignores several issues:

- p-values are greatly affected by sample size;
- Collinearity amplifies standard errors;
- Even if a certain control variable is not significant, it may affect other coefficients;
- Predictive performance and statistical significance are not the same goal.

A more robust selection process would look at both theoretical or business rationale, model diagnostics, information criteria, and out-of-sample performance, rather than letting one threshold determine whether or not all variables should be included.

## A practical model-selection workflow

The process can be compressed into the following steps:

1. Define the goal first: explain or predict;
2. Retain necessary variables based on business and data generation processes;
3. Check for collinearity, outliers, and obvious data quality issues;
4. Compare a set of reasonable candidate models using Adjusted R², BIC, etc.;
5. If the target is biased in prediction, use CV to compare out-of-sample errors;
6. When there are many variables or strong collinearity, compare Ridge, Lasso, PCR or PLS;
7. Finally, check whether the results are stable and interpretable.

Feature selection is not about “finding the right answer” from dozens of variables, but about making trade-offs between information, complexity, stability, and business use. A shorter model is only really better if it doesn't lose key structure.
