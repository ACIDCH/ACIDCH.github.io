---
translationKey: stat-interval-estimation
locale: en
slug: stat-interval-estimation
title: Interval Estimation
summary: Build and interpret confidence intervals from point estimates and standard errors, then examine how confidence level, sample size, the t distribution and bootstrap methods affect precision.
tags:
  - statistics
  - confidence intervals
  - statistical inference
topics:
  - R and Statistics
  - Statistical Inference
  - Uncertainty
tools:
  - R
  - Base R
series: R and Statistics
seriesSlug: r-statistics
order: 4
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - stat-sampling-estimation
  - descriptive-statistics
---

## Why is one point not enough?

"The average delivery time is 31.4 hours" seems clear, but it doesn't tell the reader how stable this number is.

If this average comes from 12 orders and from 12,000 orders, the degree of confidence is obviously different; if the order time itself fluctuates greatly, 31.4 will also be less accurate than the low volatility scenario.

Interval estimates report this information together. The most common forms are:

\[
\text{estimate}\pm\text{margin of error}
\]

The margin of error usually consists of the standard error multiplied by a critical value.

For the large sample mean, a common approximation is written as:

\[
\bar X\pm 1.96\times SE(\bar X)
\]

But `1.96` is not a fixed constant that can be used directly for all problems. Sample size, unknown variance, parameter type, and sampling structure all affect the actual interval.

## What does a 95% confidence interval mean?

A frequentist 95% confidence interval describes the long-run performance of the **interval-construction procedure**.

If you keep repeating the same sampling process, building intervals in the same way each time, then in the long run approximately 95% of intervals will cover the true population parameters.

This is not the same sentence as "the real parameter has 95% probability of falling within the currently calculated interval". After the current sample is drawn, the interval endpoints have been determined; the frequentist interpretation focuses on the coverage of this program in repeated sampling.

This can be checked directly using Monte Carlo:

```r
set.seed(2026)
B <- 5000
n <- 100
p <- 0.42

covered <- replicate(B, {
  x <- rbinom(n, size = 1, prob = p)
  p_hat <- mean(x)
  se <- sqrt(p_hat * (1 - p_hat) / n)
  lower <- p_hat - 1.96 * se
  upper <- p_hat + 1.96 * se
  lower <= p && p <= upper
})

mean(covered)
```

Under suitable approximate conditions, coverage will be close to 0.95.

## Where the margin of error comes from

For simple mean problems, the basic structure of margin of error is:

\[
ME=\text{critical value}\times SE
\]

The standard error reflects how unstable the estimator itself is, and the critical value reflects how conservative the coverage is expected to be.

If the sample mean is 31.4 hours and the standard error is 1.8 hours, use the normal approximation 95%:

```r
estimate <- 31.4
se <- 1.8
margin <- 1.96 * se
c(lower = estimate - margin, upper = estimate + margin)
```

The width of the interval here is mainly controlled by two things: the amount of information provided by the data, and the confidence level chosen.

<div data-learning-slot="sampling-precision-lab"></div>

## Higher confidence usually requires a wider interval

Increasing long-run coverage from 90% to 95% to 99% requires a wider interval.

Common standard normal critical values:

| confidence level | critical value z* |
| ---------------- | ----------------: |
| 90%              |             1.645 |
| 95%              |             1.960 |
| 99%              |             2.576 |

```r
z <- qnorm(c(0.95, 0.975, 0.995))
z
```

This is a basic trade-off: **higher coverage and greater precision cannot both be obtained for free.** With a fixed sample size, a higher confidence level requires a wider interval.

## How sample size changes interval width

The standard error of the sample mean satisfies:

\[
SE(\bar X)=\frac{s}{\sqrt n}
\]

Therefore, when other conditions remain unchanged, increasing the sample size will shrink the interval.

```r
s <- 12
n <- c(25, 100, 400)
se <- s / sqrt(n)
margin95 <- 1.96 * se

data.frame(n, se, margin95)
```

Increasing from 25 to 100 quadruples the sample size and roughly halve the standard error and margin of error.

This guides sample-size planning: halving interval width usually requires about four times as much information, not twice as much.

## Why does the t distribution appear when the population variance is unknown?

In reality, the population standard deviation \(\sigma\) is usually not known and can only be replaced by the sample standard deviation \(s\). This adds a layer of uncertainty.

Student's t distribution is commonly used in mean inference:

\[
\frac{\bar X-\mu}{s/\sqrt n}\sim t_{n-1}
\]

At the same 95% confidence level, the t-critical value for small samples is usually larger than 1.96.

```r
qt(0.975, df = 9)
qt(0.975, df = 29)
qnorm(0.975)
```

As the degrees of freedom increase, the t distribution gradually approaches the standard normal.

Establishing a t interval for a mean in R is straightforward:

```r
wait <- c(28, 31, 25, 34, 29, 38, 27, 33, 36, 30)
t.test(wait)$conf.int
```

Automatic calculation does not establish that a t interval suits the data. With a small, highly skewed sample, heavy tails or influential outliers, inspect the distribution and assumptions carefully.

## With small samples, inspect the distribution first

`t.test()` is generally robust to mild deviations from normality, but extreme skewness and long tails can make small sample intervals worse.

```r
hist(wait)
qqnorm(wait)
qqline(wait)
```

Don’t think of “doing a normality test” as the only entry point. Tests like Shapiro-Wilk are significantly affected by sample size; graphs, data generation mechanisms, and business reasons for exception logging are more important.

When it is unclear whether the approximation is reliable, simulations can help check whether a method can achieve expected coverage given the assumed data generation mechanism.

## Proportion intervals need more than a mechanical formula

The standard error of the sample proportion \(\hat p\) is approximately:

\[
SE(\hat p)=\sqrt{\frac{\hat p(1-\hat p)}{n}}
\]

So the simplest Wald interval is written as:

\[
\hat p\pm z^*\sqrt{\frac{\hat p(1-\hat p)}{n}}
\]

For example, in the 240 order, 216 sheets are on time:

```r
x <- 216
n <- 240
p_hat <- x / n
se <- sqrt(p_hat * (1 - p_hat) / n)
p_hat + c(-1, 1) * 1.96 * se
```

When the sample is small or the proportion is very close to 0/1, this simple interval may not perform well and even give endpoints lower than 0 or higher than 1.

Practical R analysis can be done using:

```r
prop.test(x, n, correct = FALSE)$conf.int
binom.test(x, n)$conf.int
```

The interval methods used by the two are different, so the results will not be completely consistent. It is better to be clear when reporting what method was used rather than just writing "95% CI".

## Report differences between groups as intervals

When comparing mean delivery times for channels A and B, the relevant quantity is usually an interval for the difference between the means.

```r
delivery <- data.frame(
  channel = rep(c("A", "B"), each = 12),
  hours = c(
    30, 29, 34, 32, 35, 28, 31, 33, 30, 36, 27, 32,
    26, 25, 29, 27, 24, 28, 30, 26, 27, 25, 29, 24
  )
)

t.test(hours ~ channel, data = delivery)
```

The output confidence interval corresponds to the mean difference between the two groups. It also conveys:

- direction of difference;
- the range of possible effect sizes;
- estimation accuracy;
- Whether zero is still within the range that is compatible with the data.

This is closer to an actual decision problem than just giving a p-value.

## Bootstrap intervals reduce reliance on analytical formulas

Some statistics do not have a simple standard error formula, or the theoretical approximation is inconvenient to use. The basic approach of Bootstrap is to resample with replacement from the original sample and recalculate the statistics each time.

For example, the median:

```r
set.seed(2026)
wait <- c(6, 7, 7, 8, 9, 10, 11, 13, 16, 22, 31, 44)

boot_median <- replicate(
  5000,
  median(sample(wait, replace = TRUE))
)

quantile(boot_median, c(0.025, 0.975))
```

This percentile interval constructs the interval using the 2.5% and 97.5% percentiles of the bootstrap distribution.

The advantage of Bootstrap is flexibility, but it still relies on the original sample to represent the target population. If the original sample has a selection bias, repeated resampling will only repeat the same bias.

In addition, dependent data such as time series, clustering within stores, and repeated measurements cannot simply be re-extracted independently by row.

## A wide interval does not mean the analysis failed

A wide interval means the current data does not support a precise estimate.

For example, there are only 18 customers in the first week of the launch of a new product. The estimated retention rate 95% CI is 42%–78%. This result may not lend itself to precise commitments, but it is very valuable: it directly demonstrates that the current evidence is insufficient to distinguish between "moderate performance" and "excellent performance."

In contrast, if only the point estimate 61% is reported, the reader can easily mistakenly believe that the data are sufficiently stable.

Uncertainty is a consequence in itself, not a shortcoming that needs to be hidden.

## Do not confuse confidence and prediction intervals

Two different intervals are common in regression:

**Confidence interval for the mean response**: estimates the average Y at a specified X.

**Prediction interval**: Predict where a new individual observation may fall.

Individual observations also contain individual noise, so the prediction interval is often significantly wider.

```r
fit <- lm(hours ~ distance_km, data = shipments)
predict(fit, newdata = new_route, interval = "confidence")
predict(fit, newdata = new_route, interval = "prediction")
```

If the question is "How soon is an order likely to arrive for this new route?" using the confidence interval of the average response would be overly optimistic.

## Common misunderstandings

**"A 95% CI means the parameter has a 95% probability of lying inside it."** That interpretation belongs to a Bayesian credible interval under its model; an ordinary frequentist confidence interval has a different definition.

**"The interval does not span 0, so the effect must be important."** Statistical evidence and business importance still need to be judged separately.

**"The narrower the interval, the better the model."** A very narrow but systematically biased interval may be more dangerous than a slightly wider, properly calibrated interval.

**"Increasing samples solves all problems."** It mainly improves random accuracy and does not automatically address selection bias, measurement errors, and data leakage.

**"Bootstrap requires no assumptions."** It reduces some of the analytic distribution assumptions, but still relies on sample representativeness and the plausibility of resampled units.

## Bringing intervals back to business decisions

Intervals are best suited to answer the question "What range does the data support?"

If the new service process reduces the average wait time estimate by 2.1 minutes, with a CI of 95% minutes of 0.3–3.9 minutes, both statistical evidence and practical value can be argued: even if the direction is more stable, the minimum improvement is 0.3 Whether minutes are enough to cover retrofit costs remains a business question.

If the interval is -1.8–6.0 minutes, the current data cannot rule out "no improvement" or even "slightly worse". It may be more reasonable to continue collecting data at this point than to rush to declare a conclusion.

The interval turns uncertainty into a readable range, and also provides a natural connection for the next step of hypothesis testing: whether a certain null value falls within the confidence interval is directly related to the corresponding significance test.

## References

The knowledge structure refers to the treatment of Estimates and Confidence Intervals, Data-Driven Models and Bootstrap in _Introduction to Data Science: Statistics and Prediction Algorithms Through Case Studies_ by Rafael A. Irizarry. The text, simulations, business examples and code have been reorganized.

Reference site: <https://rafalab.dfci.harvard.edu/dsbook-part-2/> . Original material licensed under CC BY-NC-SA 4.0.
