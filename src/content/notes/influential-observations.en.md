---
translationKey: influential-observations
locale: en
slug: influential-observations
title: Outliers and Influential Observations
summary: Distinguish large residuals, high leverage and influence before using Cook's distance, DFBETAs and sensitivity analysis to assess unusual observations without deleting them reflexively.
tags:
  - outliers
  - high leverage
  - Cook's distance
  - DFBETAs
topics:
  - Regression Modelling
  - Model Diagnostics
  - Data Quality
tools:
  - R
  - Base R
series: Regression Modelling
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

## Separate three easily confused concepts

There will always be some points that are particularly conspicuous in the regression graph, but "conspicuous" does not mean "should be deleted". Before judging, at least separate outlier, high leverage and influential observation.

An **outlier** is unusually far from the fitted model in the Y direction and therefore has a large residual. A **high-leverage observation** has an unusual combination of predictor values. An **influential observation** materially changes coefficients, fitted values or conclusions when it is removed.

The three may overlap, or they may not be the same batch of records at all.

A point can have a large residual, but X is very common; it can also be very extreme, but it happens to fall on the regression trend. What is really easy to pull the regression line is usually the observation that the leverage is high and the residual is not small.

<div data-learning-slot="influence-diagnostics-lab"></div>

## Large residuals identify poor fit in the outcome direction

The residual is:

\[
e_i=y_i-\hat y_i
\]

If a record's actual value is far from the predicted value, it is a residual outlier worth checking.

However, the original residual is affected by the overall error scale, so it is more common to compare standardised residual or studentized residual. They put the residuals on a relatively uniform scale, making it easier to spot which records deviate significantly from the majority of the data.

Inspect these values in R:

```r
rstandard(model)
rstudent(model)
```

A large residual only means that "the Y of this record does not fit the current model very well", and does not alone mean that it will seriously change the coefficient.

## High leverage comes from X space, not Y

Leverage focuses on explanatory variable position.

In linear regression, the hat matrix is:

\[
H=X(X^TX)^{-1}X^T
\]

\(h_{ii}\) on the diagonal is the leverage of the i-th record.

If a record's X combination is far away from the majority of the sample, its leverage tends to be higher. Intuitively, this kind of record stands on the edge of the data cloud, and the regression line may need to turn more to accommodate it.

The idea is especially clear in simple regression: if most X values lie between 10 and 20 but one record has X=60, that record will usually have high leverage.

R can be viewed directly:

```r
hatvalues(model)
```

High leverage does not equal abnormal data. It might just be a real, rare, but informative business case.

## Influence asks what changes when an observation is removed

Influence measures how sensitive the fitted model is to an observation.

Suppose after deleting a record:

- The slope changes significantly;
- The sign of a certain coefficient is flipped;
- Forecasts move significantly;
- Variables that were originally significant become insignificant;
- Business conclusions change.

Then this record has a strong influence.

This question is closer to the underlying modelling risk than asking whether a point is far from a line: the central concern is whether the conclusion depends on a small number of observations.

## Cook's distance combines residual size and leverage

Cook’s distance is one of the most commonly used diagnostics of impact. It measures how much the overall fit will change if a record is deleted.

A common form can be written as:

\[
D_i=\frac{e_i^2}{p\cdot MSE}\frac{h_{ii}}{(1-h_{ii})^2}
\]

Both residual and leverage appear in the formula, so for a point to truly produce a larger Cook’s distance, it usually needs to have both a deviation in Y and a certain position advantage in the X space.

In R:

```r
cooks.distance(model)
```

Often people use `4/n` or 1 as an empirical reference line. These values are suitable for aiding screening and are not suitable as automatic deletion criteria. If a point exceeds the threshold, it means "worth watching", not "must be deleted".

## DFBETAs track changes in individual coefficients

Cook’s distance looks at the overall model change, while DFBETA is more detailed: it cares about how much a certain regression coefficient will change after deleting the i-th record.

If the business is most interested in the slope of a key variable, such as price elasticity, distribution distance effect, or risk coefficient, then DFBETA is often more targeted than an aggregate impact metric.

The impact of each record on each coefficient can be obtained in R:

```r
dfbeta(model)
```

Or standardised:

```r
dfbetas(model)
```

This distinguishes an observation with broad influence on the model from one that mainly changes a particular coefficient.

## Investigate unusual observations before deleting them

After discovering abnormal records, the most valuable first step is to return to the original data.

Check:

- Is the numerical value entered with the wrong digit?
- Are units mixed?
- Are the dates, currencies or categories consistent?
- Is this record a duplicate?
- whether it comes from different business mechanisms;
- Is there an omitted variable that could explain it.

If it is confirmed that it is an entry error, correction or deletion is data cleaning. If the record actually exists, it should be treated as modelling information rather than removed because it "doesn't look good".

Real extreme cases sometimes represent the riskiest business scenarios that are most worthy of study.

## Sensitivity analysis provides the strongest comparison

For an influential observation, direct model comparison is usually more informative than debating whether it “qualifies as an anomaly”.

```r
model_full <- lm(y ~ x1 + x2, data = df)
model_drop <- lm(y ~ x1 + x2, data = df[-suspect_row, ])

coef(model_full)
coef(model_drop)
```

Then compare:

- How much the key coefficient changes;
- Whether the confidence interval changes significantly;
- whether R² and forecast error change;
- Whether the business conclusion is flipped.

If the conclusion is almost unchanged, it means that the model is relatively robust to this record. If the conclusion relies heavily on it, it needs to be clearly stated in the report, rather than quietly deleted and only the "prettier" results will be displayed later.

## Influential observations may reveal missing structure

Sometimes a certain point looks abnormal, not because there is a problem with the data, but because the model is too simple.

For example, a customer belongs to a completely different channel, a device uses different technology, and a group of orders is in a special promotion period. If these structures do not enter the model, the corresponding records may exhibit large residuals or high impacts.

The appropriate response may be to add justified categorical variables or interactions, or to redefine the analysis population, rather than deleting observations.

So Impact Diagnostics is not just a tool to “clean up outliers” but also helps discover what the model is missing.

## Prediction and explanation have different sensitivities to influence

A high influence point is particularly important if the goal is to explain a certain coefficient, as it may change the coefficient magnitude or even direction.

For prediction, determine whether the observation represents a plausible future case. If a rare but genuine edge case can recur, omitting it does not remove the operational risk.

Conversely, if it belongs to an old process that no longer occurs, the modelling scope may need to be redefined.

Whether to retain a record ultimately depends on the data generation process and future usage scenarios.

## Common error handling methods

### Delete every large residual

Large residuals do not equal high impact, nor do they equal data errors.

### Use one threshold to delete observations automatically

Cook’s distance and leverage thresholds are screening tools, not deletion rules.

### Compare only R²

R² tends to get better after removing extreme points, but this does not justify the removal. What should be more important is whether the key coefficients and conclusions have changed.

### Do not record the results before and after deleting points

If the model is sensitive to a certain record, this is an important result in itself and should be retained.

## A robust influence-analysis workflow

1. Use the residuals to find anomalies in the Y direction;
2. Use leverage to find observations at the edge of X space;
3. Use Cook’s distance to see the overall impact;
4. Use DFBETA to see who affects the key coefficients;
5. Return to the original data to confirm whether the record is authentic;
6. Compare retained and removed models;
7. Decide whether you need to revise the model based on the scope of the business, rather than just revising the data.

Influence analysis does not ask how to delete inconvenient points. It asks how strongly the model's conclusions depend on a few observations and whether that dependence is defensible in context.
