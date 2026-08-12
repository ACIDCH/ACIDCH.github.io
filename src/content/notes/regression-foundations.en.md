---
translationKey: regression-foundations
locale: en
slug: regression-foundations
title: Simple Linear Regression
summary: Begin with scatter plots, then connect least squares, slopes, R², statistical evidence and prediction intervals while examining how noise and extreme observations affect the fitted model.
tags:
  - simple linear regression
  - least squares
  - confidence intervals
  - prediction intervals
topics:
  - Regression Modelling
  - Statistical Inference
  - Data Understanding
tools:
  - R
  - Base R
series: Regression Modelling
seriesSlug: regression
order: 1
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes:
  - descriptive-statistics
  - regression-diagnostics
---

## What question does regression answer?

Simple linear regression is most suitable for dealing with such problems: Will a continuous result show a relatively stable average trend as another variable changes?

For example, does delivery time generally increase with distance? Does order volume rise with advertising spend? Do more complex service requests take longer to resolve? The aim is not to place every observation on one straight line, but to determine whether the average relationship is useful and interpretable.

The model is written as:

\[
Y_i=\beta_0+\beta_1X_i+\varepsilon_i
\]

Among them \(Y_i\) is the result, \(X_i\) is the explanatory variable, \(\beta_0\) is the intercept, \(\beta_1\) is the slope, \(\varepsilon_i\) fits the part of the difference that is not explained by the model.

More precisely, the regression line describes:

\[
E(Y\mid X=x)=\beta_0+\beta_1x
\]

In other words, it describes the average level of Y at a given X rather than making a claim about an individual observation.

## Inspect the scatter plot before fitting a regression

The most worthwhile thing to look at before regression is often not the model output, but a scatter plot.

If the point cloud is distributed roughly along a straight line, a linear model usually has a reasonable starting point; if it is significantly curved, or the degree of fluctuation in different X intervals is much different, then directly fitting a straight line may be too forced.

Also pay attention to several very practical phenomena:

- Are there one or two points that are far away from the majority of the data;
- Are the values of X only concentrated in a narrow range?
- Are the point clouds clearly grouped?
- Are there almost no data in some intervals?

This information will not automatically appear in an R², but will directly affect the subsequent interpretation of coefficients and predictions.

## Finding the line with least squares

Many straight lines can be drawn on a set of data. The least squares method selects the one that minimizes the sum of squares of the residuals.

The residual for the ith observation is:

\[
e_i=y_i-\hat y_i
\]

Adding up all squared residuals:

\[
SSE=\sum_{i=1}^{n}(y_i-\hat y_i)^2
\]

OLS, also known as Ordinary Least Squares, looks for \(\hat\beta_0\) and \(\hat\beta_1\) that minimise SSE. The effect of squaring is intuitive: positive and negative residuals do not cancel each other out, and points that are particularly far away are penalised more heavily.

This is why extreme points deserve special attention. The contribution of an outlier observation to the squared loss can be large enough to pull the entire line toward itself.

## The slope carries the central interpretation

Assume that the model is estimated to be:

\[
\widehat{delivery\_time}=18.4+1.7\times distance
\]

The natural interpretation of the slope 1.7 is: within the observed data range and under this model, each 1-unit increase in delivery distance is associated with an average increase of about 1.7 units in delivery time.

Three qualifications matter here: **average, observed data range and model specification**.

Slope does not automatically imply causation. Even if there is an obvious relationship between distance and delivery time, it may also be affected by variables such as traffic, route type, order size, etc. Univariate regression can describe an association, but it cannot prove "X causes Y" from just one regression line.

## An intercept may be meaningful or merely mathematical

The intercept \(\beta_0\) represents the conditional mean of Y when X=0.

If X=0 makes operational sense and the sample covers values around 0, the intercept can be interpreted directly. If every observed X falls between 50 and 100, however, a prediction at X=0 is only a mathematical extension of the fitted line.

Do not force a business interpretation onto an intercept. First check whether 0 lies within a meaningful data range.

## R² answers only how much variation is explained

R² is often used to describe the degree of model fit:

\[
R^2=1-\frac{SSE}{SST}
\]

where SSE is the sum of squares not explained by the model, and SST is the total sum of squares of the outcome variable relative to its own mean.

If R²=0.68, the fitted linear model explains approximately 68% of the sample variation in Y. R² alone cannot answer the following questions:

- Is relationship causation?
- Is the model form correct?
- Does the residual have an obvious structure?
- Whether predictions based on new data are reliable;
- Whether a certain coefficient is important in business.

A high R² can result from a strong time trend or a few extreme observations, while a low R² does not make a model useless. Model adequacy cannot be judged from this statistic alone.

## Coefficient estimates need uncertainty intervals

The slope \(\hat\beta_1\) in the sample is just an estimate of the population slope. Change the batch of samples and the results will usually change.

The output therefore includes standard errors, t statistics, p values and confidence intervals. These are related summaries of the same underlying question: **how precisely does the sample locate each coefficient?**

Common tests are:

\[
H_0:\beta_1=0
\]

If the data are difficult to reconcile with zero slope, the p-value will become smaller. But "statistically significant" does not mean "significant business impact." When there are many samples, a very small slope may be significant; conversely, a relationship with a substantial actual impact may not be accurate enough when there are too few samples.

A more complete way to read it is to look at coefficient sizes, confidence intervals, and business scales together.

## Confidence intervals and prediction intervals are not the same thing

Suppose the goal is to estimate Y at \(X=x_0\).

If the question is "What is the approximate average result for this class of objects?" focus on the confidence interval for the average response. What it describes is:

\[
E(Y\mid X=x_0)
\]

If the question is "Where will the next specific record roughly fall", what is needed is a prediction interval. In addition to being affected by the regression line estimation error, individual observations also carry their own random errors, so the prediction intervals are usually wider.

These two intervals are often drawn on the same chart, but have completely different business meanings. Predicting the average demand of a group of customers and predicting the actual demand of the next customer cannot be answered in the same interval.

## Extrapolation is more dangerous than within-range forecasting

Assume that the delivery distance in the training data only covers 2 to 18 kilometres, and the model is then used to predict orders of 40 kilometres. Of course, the formula can also calculate a number, but this has left the scope of the data truly providing evidence.

The linear trend is established within the sample interval, but it does not mean that it will continue to maintain the same slope after leaving the interval. Long-distance orders may be switched to another shipping method, or new route restrictions may arise. Such predictions are called extrapolation, and the risk is often much higher than ordinary in-sample predictions.

Before reporting a prediction, inspect both the relevant interval and whether the new case's X value lies within the training range. Extrapolated results may support scenario analysis, but they should not be presented with the same confidence as interpolation.

## Separate fitting error from prediction error

The residuals are calculated on the data that has been fitted. The model itself uses this data to find the best-fitting straight line, so the training residuals will usually be more optimistic than the error on new future data.

If the model ultimately needs to make predictions, it is not enough to just look at the training R² or residual standard error. A more reliable approach is to retain the validation data, or use cross-validation to observe how big the error is when the model is faced with data that is not involved in the estimation.

This also explains why "the line is drawn closely" is not sufficient evidence of predictive ability. Statistical interpretation is primarily concerned with coefficients and their uncertainties; forecasting tasks also require additional examination of out-of-sample performance. The same regression model can be used for both purposes, but the evaluation focus is not exactly the same.

## How noise and extreme points change the model

When the error fluctuations become larger, the scatter points will be further away from the regression line. The slope point estimate may still be close to the original value, but the standard error will usually increase and the confidence interval will become wider.

The effects at extreme points are more complex. An observation with an extreme X value may have high leverage; if it also deviates from trend in the Y direction, it may significantly change the slope.

Even an apparently convincing regression line may be driven by a few observations. Diagnostics are therefore part of deciding whether the fitted relationship is trustworthy, not an optional finishing touch.

<div data-learning-slot="regression-line-lab"></div>

## Fitting and interpreting models in R

Fit the basic model with `lm()`:

```r
model <- lm(delivery_time ~ distance, data = delivery_df)
summary(model)
```

Common output includes:

```text
Coefficients
Residual standard error
Multiple R-squared
Adjusted R-squared
F-statistic
```

If you just want to get the coefficients:

```r
coef(model)
```

Predict new X:

```r
new_case <- data.frame(distance = 12)
predict(model, newdata = new_case)
```

Confidence interval for average response:

```r
predict(model, newdata = new_case, interval = "confidence")
```

Prediction interval for a single new observation:

```r
predict(model, newdata = new_case, interval = "prediction")
```

The code itself is very short. What really needs to be judged is whether the model is suitable for the current problem, whether the coefficients can be interpreted according to the current data range, and whether the interval corresponds to the question that really needs to be answered.

## A reliable interpretation workflow

A simple linear regression result can be reviewed in the following order:

1. First look at the scatter plot to confirm whether the linear relationship is barely reasonable;
2. Look at the direction and magnitude of the slope, and first explain the actual meaning;
3. Look at the standard error, confidence interval and p-value again to judge the accuracy of the estimate;
4. Use R² to understand how much of the sample fluctuation is explained by the model;
5. Distinguish between mean response intervals and prediction intervals for individual observations;
6. Check whether the new case has exceeded the training data range;
7. If the goal is prediction, look at the out-of-sample error;
8. Finally, check residuals and influential observations to confirm that no obvious structure undermines the conclusion.

The value of simple linear regression is not to "draw a line", but to clearly explain an average relationship, its uncertainty and its applicable boundary at the same time. The next article will specifically deal with the last step: how to determine what is wrong with the model from the residuals.
