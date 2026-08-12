---
translationKey: regression-diagnostics
locale: en
slug: regression-diagnostics
title: Regression Diagnostics
summary: A plausible coefficient table does not establish that a model is appropriate. Use residual, Scale–Location and Q–Q plots to identify nonlinearity, heteroskedasticity, outliers and distributional problems.
tags:
  - regression diagnostics
  - residuals
  - Q–Q plots
  - heteroskedasticity
topics:
  - Regression Modelling
  - Model Diagnostics
  - Data Quality
tools:
  - R
  - Base R
series: Regression Modelling
seriesSlug: regression
order: 2
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes:
  - regression-foundations
  - influential-observations
---

## Fitting the model is only the beginning

A regression output can be neat: the coefficients are numerical, the R² is not low, and the p-values are even nice to look at. However, the premise for these results to be valid is that the model does not deviate significantly from the description of the data structure.

Regression diagnostics examine the residuals left unexplained by the model. Curves, funnels, clusters or extreme values in the residuals indicate that the fitted model may have missed important structure.

Common checks in linear regression include:

- Whether the functional form of the conditional mean is approximately correct;
- Whether the residual variance is similar under different fitting levels;
- Are there particularly extreme or high-impact observations?
- When small sample inference is required, whether the error distribution deviates too seriously;
- Whether the assumption of independence of the data is consistent with the sampling method.

These questions won't all be answered by one chart, so the diagnostic chart should be read in terms of "what it's checking" rather than treating the four default charts as a to-do list.

## Residuals are what the model leaves unexplained

The residual for observation i is:

\[
e_i=y_i-\hat y_i
\]

When the actual value is higher than the predicted value, the residual is positive; when the actual value is lower than the predicted value, the residual is negative.

A residual is not the unobservable population error \(\varepsilon_i\), but a sample-based estimate of it. Even so, residuals reveal where the model tends to under- or overestimate and whether error magnitude changes with the fitted value.

The most common plot is fitted values versus residuals:

```r
plot(fitted(model), residuals(model))
abline(h = 0, lty = 2)
```

The ideal state is not that "all points are close to 0", but that the point cloud is relatively random above and below 0, with no clear system shape.

<div data-learning-slot="regression-diagnostics-lab"></div>

## Curvature in residuals suggests the fitted line is too simple

If the residuals have a pronounced U-shape or inverted U-shape from left to right, a common reason is that the original linear form did not capture the curvature of the data.

For example, the real relationship is closer:

\[
Y=\beta_0+\beta_1X+\beta_2X^2+\varepsilon
\]

But it only fits:

\[
Y=\beta_0+\beta_1X+\varepsilon
\]

The model then tends to overestimate in some intervals and underestimate in others, leaving systematic curvature in the residual plot.

Do not respond to every curve by mechanically adding a squared term. First consider whether saturation, thresholds, scale effects or another domain mechanism could explain the pattern, then compare suitable functional forms.

## A funnel shape usually indicates heteroskedasticity

If the fitted values are larger, the residuals will fluctuate more up and down, and the graph will look like an open funnel, which usually indicates **heteroscedasticity**.

Heteroscedasticity does not necessarily render OLS coefficient point estimates immediately invalid, but it can affect the reliability of standard errors and inferences. The most direct problem is: the model assumes that "error fluctuations are about the same", but the data shows that the errors in high-level areas are significantly larger.

This is not uncommon among variables such as amount, scale, and sales volume. The absolute error increases with the size of the business and is sometimes more realistic than "all records maintain the same fluctuation".

The appropriate response depends on the cause. Options include transforming variables, respecifying the mean structure, using robust standard errors or choosing a different model. Confirm the pattern before applying a remedy.

## A Scale–Location plot clarifies variance patterns

Scale–Location diagrams usually put:

\[
\sqrt{|standardized\ residual|}
\]

Plot on the vertical axis and put fitted values on the horizontal axis.

Its function overlaps with the residual plot, but it emphasizes the size of the residual rather than the positive and negative directions. If the average trend on the graph is obviously upward, it often means that the larger the fitted value is, the larger the residual size will be.

This can be seen directly in R's basic diagnostic diagram:

```r
plot(model, which = 3)
```

This picture does not need to be "completely horizontal". Real data is rarely this ideal. What deserves more attention is whether there is a clear, sustained trend that is enough to affect the inference.

## A Q–Q plot reveals tails and distributional shape

QQ plot is often misunderstood as "the points are not on the straight line, so the model cannot be used". Actually be more cautious.

The standard normal QQ plot compares the sample residual quantiles to the theoretical normal quantiles:

```r
qqnorm(rstandard(model))
qqline(rstandard(model))
```

If most of the points in the middle are close to a straight line, but the two ends deviate slightly, it may not be a serious problem in a large sample. What's really worth looking out for is a systematic S-shape, a noticeable long tail, or a few points moving away from the whole.

normality mainly affects the classic inference based on the t/F distribution under small samples, and is not the premise of whether OLS can calculate a line. Equating "the errors are not completely normal" with "the model is completely invalid" will exaggerate the diagnostic problem.

## Separate individual extreme observations from structural problems

Points with large residuals are not necessarily the most influential. Whether an observation significantly changes the model also depends on its position in the explanatory variable space.

Therefore, it is best to separate three concepts when making a diagnosis:

```text
大残差
→ Y 方向上偏离模型

High leverage
→ X 组合位于数据边缘

High influence
→ 删除该点后模型结果明显改变
```

Cook’s distance combines residual and leverage information to identify observations that may change the overall fit. The next note, "Outliers and Influential Observations", develops this topic in detail.

## A diagnostic warning is not an instruction to delete data

When you see a point that is particularly far away, your first reaction should not be to delete it.

Begin with a few questions:

1. Is this record an entry error?
2. Are the units, time ranges, or field meanings wrong?
3. Is it a real but rare business situation?
4. Is the model missing a variable or nonlinear structure?
5. How much would the conclusion change if this record were kept or removed?

Deletion is a cleaning issue only when it is confirmed that the data itself is not trustworthy. A real but extreme business record is often better suited to be retained and a sensitivity analysis used to illustrate how much it affects the model.

## Interpret diagnostics alongside the business process

Some graphics problems arise from the form of the model, and some problems arise from the way the data is generated.

For example, if the residuals in the time series have the same sign continuously, it may be autocorrelation; the same customer is observed repeatedly, which may cause the records to be not independent; the fluctuation levels of different stores are completely different, which may mean that the grouping structure has not entered the model.

Default regression plots are often insufficient for dependence problems. The analysis must account for each row's origin, temporal ordering, group membership and any dependence created by the sampling process.

Where statistical diagnostics are really useful is in connecting the data-generated information and graphical evidence.

## A practical diagnostic workflow

After the model is fitted, it can be checked in the following order:

1. **Residuals vs Fitted**: First check whether there is curvature, grouping and obvious funneling;
2. **Scale–Location**: Confirm whether the residual scale changes with the fitted value;
3. **Q–Q plot**: Check the tails and overall distributional shape;
4. **Leverage / Cook’s distance**: Find observations that may change the overall results;
5. Go back to the original data to check suspicious records;
6. Adjust the model according to the source of the problem, and then redraw the diagnostic diagram.

The last step is important. After revising the model, it is necessary to see whether the original structure has really disappeared, rather than declaring that the problem is solved just by "changing to a more complex model."

## Summary

The core of regression diagnosis is not to describe the four pictures one by one, but to read out what structure is left in the residual:

- Curvature is often a reminder that the functional form is insufficient;
- Funnels often correspond to heteroskedasticity;
- QQ plot mainly helps determine the tail of the distribution;
- Large residuals, high leverage and influential observations are distinct concepts;
- Any decision to “delete points” should first be based on data and business.

A model that seems to fit well is just a starting point. The residuals leave no obvious explainable patterns, and the coefficients and predictions are more trustworthy.
