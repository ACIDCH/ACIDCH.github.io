---
translationKey: nonlinear-regression-interactions
locale: en
slug: nonlinear-regression-interactions
title: Nonlinear Terms and Interactions
summary: When a straight line is inadequate, use residuals to locate the problem, then add quadratic terms, categorical effects or interactions only where the data-generating structure requires them.
tags:
  - polynomial regression
  - interaction terms
  - categorical predictors
  - nonlinearity
topics:
  - Regression Modelling
  - Functional Form
  - Model Interpretation
tools:
  - R
  - Base R
series: Regression Modelling
seriesSlug: regression
order: 3
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes:
  - regression-diagnostics
  - multiple-regression-multicollinearity
---

## When a straight line is not enough

The name of linear regression is easily misleading. The linear model requires that the parameters enter the model in a linear manner, which does not mean that the explanatory variables can only appear once.

For example:

\[
Y=\beta_0+\beta_1X+\beta_2X^2+\varepsilon
\]

This relationship is curved on X, but still linear for \(\beta_0,\beta_1,\beta_2\), so it can continue to be estimated with OLS.

It is normal for curved relationships to appear in actual data. Promotional investment may bring significant growth at first, and then gradually saturate; the machine load has little impact at low levels, but the risk of failure increases rapidly when it approaches the upper limit. A straight line is good as a starting point, but not necessarily a good finish.

## Signals that a linear effect is inadequate

The most direct signal usually comes from the residual plot.

If residuals from a simple linear model form a U shape, an inverted U or another sustained curve, the model is overestimating in some intervals and underestimating in others. This is structured error rather than random noise: the chosen functional form does not capture the relationship.

Now go back to the business process to check:

- Is there saturation or diminishing marginality;
- Is there a threshold or inflection point;
- Will the influence of X be in different directions in different intervals?
- Is the curvature caused by a few extreme points.

It is more reliable to figure out why the curve is curved first, and then decide what terms to add, rather than just stacking high-order polynomials when you see the curve.

<div data-learning-slot="polynomial-regression-lab"></div>

## Quadratic terms are the most common nonlinear extension

One of the simplest ways is to add \(X^2\):

\[
Y=\beta_0+\beta_1X+\beta_2X^2+\varepsilon
\]

With this specification, \(\beta_1\) is no longer a constant effect for a 1-unit increase because the marginal effect of X changes with X.

Take the derivative with respect to X:

\[
\frac{dE(Y\mid X)}{dX}=\beta_1+2\beta_2X
\]

In other words, the same increase of 1 units of X can have different effects on Y at different positions.

If \(\beta_2<0\), the curve curves downward, which may correspond to diminishing marginal returns; if \(\beta_2>0\), the curve curves upward, which may indicate that the impact accelerates as X increases.

## Turning points are often clearer than individual coefficients

The turning point of the quadratic model is:

\[
X^*=-\frac{\beta_1}{2\beta_2}
\]

When the business question concerns "when does it start to decline" and "around which input level is the highest return", this position is often more intuitive than explaining \(\beta_1\) and \(\beta_2\) separately.

But turning points also have boundaries. If the calculated \(X^*\) is not within the sample range at all, it cannot be forced to be interpreted just because the formula gives a number. The model has evidence within the observation interval, but beyond the interval it is just extrapolation.

## A higher-order polynomial is not automatically better

Adding cubic, quartic or even higher order terms, the fit to the training data usually continues to get better. But the curve will also be more likely to swing with local noise.

Common problems with higher-order polynomials include:

- Unnaturally violent changes near borders;
- Coefficients are difficult to interpret in isolation;
- Different powers of X are highly correlated;
- Training error goes down, but performance gets worse on new data.

Therefore, the goal of polynomial regression is not to "fit the curve as tightly as possible", but to express the real structure in a simple enough form. Diagnostic plots, out-of-sample validation, and business implications should be viewed together.

In R, fit the model directly:

```r
model_quad <- lm(y ~ poly(x, 2, raw = TRUE), data = df)
```

`raw = TRUE` means explicit use of \(x\) and \(x^2\), which is more suitable for directly interpreting the original polynomial coefficients.

## Categorical predictors express differences between groups

Explanatory variables are not necessarily all continuous values. Variables such as region, channel, customer type, device category, etc. can also be entered into the regression.

Suppose `channel` has two levels: Store and Online. After selecting Store as the baseline group, it can be written as:

\[
Y=\beta_0+\beta_1X+\beta_2D_{Online}+\varepsilon
\]

in:

```text
D_Online = 0  → Store
D_Online = 1  → Online
```

Here, \(\beta_2\) represents the average difference between the Online and Store groups at the same value of X.

R usually handles dummy variable encoding of factors automatically:

```r
df$channel <- factor(df$channel)
model <- lm(y ~ x + channel, data = df)
```

What really matters is who the benchmark group is, since all category coefficients are interpreted relative to it.

## Interactions allow one effect to vary with another variable

If different channels not only have different average levels but also different slopes of X, then an interaction term is needed.

The model can be written as:

\[
Y=\beta_0+\beta_1X+\beta_2D+\beta_3(XD)+\varepsilon
\]

When D=0:

\[
E(Y)=\beta_0+\beta_1X
\]

When D=1:

\[
E(Y)=(\beta_0+\beta_2)+(\beta_1+\beta_3)X
\]

So \(\beta_3\) is not an isolated "extra effect", but is saying how much the two sets of slopes differ.

The most common way to write it in R is:

```r
model_interaction <- lm(y ~ x * channel, data = df)
```

`x * channel` would contain both `x`, `channel`, and `x:channel`.

## Interactions change the interpretation of main effects

This is the most easily misunderstood part of the interaction model.

When `x:channel` is present, the coefficient of `x` is the slope for the **reference channel**, not a common effect across all channels. The main effect of `channel` is likewise the between-group difference when X=0.

If X=0 is not meaningful, centre X before fitting the interaction:

```r
df$x_centered <- df$x - mean(df$x)
model <- lm(y ~ x_centered * channel, data = df)
```

This way the category main effect corresponds to the between-group difference "when X is at the mean" and is generally easier to interpret.

Centering does not change the predicted values fitted by the model, it just makes the reference points of the coefficients more reasonable.

## Do not add terms merely to improve in-sample fit

A model can easily incorporate square terms, cubic terms, a dozen categorical variables, and numerous interaction terms. The difficulty is not in writing these items in, but in deciding whether they are really necessary.

When comparing models, consider:

- Whether the residual structure is significantly improved;
- Is there a business explanation for the new items?
- Whether the out-of-sample error has decreased;
- Whether parameter uncertainty has become too large;
- Whether the model can still be communicated clearly.

If a complex model only adds a little more training R² but makes the results almost uninterpretable, it is not necessarily more valuable than a simple model.

## Be careful when extrapolating

Polynomial and interaction models may be very reasonable within the sample range but can quickly become ridiculous outside the sample range.

Especially for high-order polynomials, the curves outside the boundary are dominated by the highest-order terms, which may grow or decline much faster than the real business process. Therefore, it is best for the prediction chart to clearly draw the X interval covered by the training data, and do not regard the infinite extension of the mathematical curve as a reliable prediction.

Category interactions have similar boundaries. If a category only appears in a narrow range of

## A practical modelling checklist

1. First draw the original data and residual plot to confirm that the problem really exists;
2. Use the business process to determine whether it is a difference in curvature, between groups, or slope;
3. Start with the simplest extension, such as a quadratic term or a reasonable interaction;
4. Revisit residuals and forecast performance;
5. Check whether the coefficients still give a clear explanation;
6. Avoid taking curves outside the sample range as fact.

Nonlinear and interaction terms represent structure that an additive straight-line model cannot express. Retain the simpler model when it explains the relationship adequately; add complexity only when both the data and domain context support curvature or group-specific effects.
