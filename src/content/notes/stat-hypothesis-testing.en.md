---
translationKey: stat-hypothesis-testing
locale: en
slug: stat-hypothesis-testing
title: Hypothesis Testing
summary: Connect the null hypothesis, test statistic, p-value, error risks, power and effect size in one chain of evidence without confusing statistical significance with practical importance.
tags:
  - statistics
  - hypothesis testing
  - statistical inference
topics:
  - R and Statistics
  - Statistical Inference
  - Evidence Assessment
tools:
  - R
  - Base R
series: R and Statistics
seriesSlug: r-statistics
order: 5
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - stat-interval-estimation
  - descriptive-statistics
---

## Hypothesis testing does not decide who is right

Hypothesis testing is often reduced to "p < 0.05 is significant", but the real question is: **How unusual would these data be if the null hypothesis and test model were true?**

For example, the original average waiting time of a customer service process is 12 minutes. After the new process is launched, a batch of records are extracted to determine whether the average waiting time has changed.

can be written as:

\[
H_0:\mu=12
\]

\[
H_1:\mu\ne12
\]

Where \(H_0\) is the null hypothesis and \(H_1\) is the alternative hypothesis.

The test does not directly calculate "the probability that \(H_0\) is true". It first assumes that \(H_0\) is true, and then looks at how far the current sample statistics are from this assumption.

## Define the parameter before stating the null hypothesis

A well-formed testing question begins by defining the parameter.

If you study average waiting times, the parameter is the population mean \(\mu\); if you study punctuality, the parameter is the population proportion \(p\); if you compare two groups, the parameter might be \(\mu_A-\mu_B\) or \(p_A-p_B\).

Don't start with "which test should be used", but start with "what is the overall quantity you really want to judge".

For example, compare the average time of two delivery options:

\[
H_0:\mu_A-\mu_B=0
\]

If the business only cares about whether A is faster, it can also be set as a one-sided problem:

\[
H_1:\mu_A-\mu_B<0
\]

However, the unilateral direction should be defined by the problem before looking at the results, and the direction of the data cannot be temporarily modified later.

## The test statistic divides the difference by the random fluctuations

Many test statistics have a similar structure:

\[
\text{test statistic}=\frac{\text{observed estimate}-\text{null value}}{\text{standard error}}
\]

Single sample mean t statistic:

\[
t=\frac{\bar X-\mu_0}{s/\sqrt n}
\]

If the sample mean is only a little biased from the null value, but the standard error is very small, the statistic may still be large; if the mean is much different but the sample is small and the fluctuation is large, the statistical evidence may be weak.

```r
wait <- c(10.8, 11.6, 12.3, 10.9, 11.2, 12.0, 11.4, 10.7, 11.8, 11.1)
t.test(wait, mu = 12)
```

The estimate, confidence interval, t statistic and p-value in the R output should be read together, rather than just truncating the last number.

## A p-value depends on its assumptions

The p-value is **the probability, under the null hypothesis and test model, of observing the current result or a more extreme one.**

It is not:

- The probability that the null hypothesis is true;
- The probability that the outcome is due to random chance;
- The probability that the research conclusion is false;
- effect size;
- Model prediction accuracy.

Suppose a test yields `p = 0.03`. A reasonable statement is: If \(H_0\) holds and the model assumptions are appropriate, then the probability of getting the current or more extreme statistic is approximately 3%.

It should not be written as "The null hypothesis has only a probability of 3% being true".

## 0.05 is not a natural dividing line

The significance level \(\alpha\) is an artificially set decision threshold. The common 0.05 is just a convention, not an automatically generated truth from the data.

The evidence strength represented by `p = 0.049` and `p = 0.051` is almost continuous, but they are often written into completely different conclusions due to a fixed threshold.

A better approach is to report both:

- parameter estimation;
- confidence interval；
- p-value (when necessary);
- sample size;
- actual effect size;
- Business implications.

If a result only has two labels: "significant/not significant", too much information is usually lost.

## Confidence intervals and tests express the same evidence differently

For common two-sided tests, if the 95% confidence interval does not contain a null value, it usually corresponds to a two-sided p-value < 0.05.

For example, the 95% CI of the mean difference is:

```text
[-4.8, -1.1] minutes
```

If zero is not in the interval, the null hypothesis corresponding to "no mean difference" will be rejected at the 5% level.

If the interval is:

```text
[-3.2, 0.7] minutes
```

Zero is still compatible with the data.

Intervals often have more explanatory power than p-values alone because they also tell the reader how large the effect might be.

## Type I and Type II errors are two different risks

There are two types of errors that can be made in statistical decisions.

| true state     | Do not reject H0 | Reject H0    |
| -------------- | ---------------- | ------------ |
| H0 true        | correct          | Type I error |
| H0 is not true | Type II error    | correct      |

**Type I error**: Falsely announcing that an effect exists when there is actually no effect. Its long-term error rate is controlled by \(\alpha\).

**Type II error**: The effect actually exists but is not detected due to insufficient evidence. Often written as \(\beta\).

Power is defined as:

\[
Power=1-\beta
\]

That is, the probability that the test will detect a real effect when it exists.

## Why power depends on sample size and effect size

Power is not a fixed attribute. It is affected by the following factors:

- sample size;
- true effect size;
- data fluctuations;
- significance level;
- Unilateral or bilateral design;
- test method.

The same small true difference that might be hard to spot in 30 samples is easy to get a small p-value in 30,000 samples.

Basic power calculations can be done in R:

```r
power.t.test(
  n = 50,
  delta = 3,
  sd = 10,
  sig.level = 0.05,
  type = "two.sample"
)
```

The `delta` here should come from business differences worth detecting, rather than using observed effects to infer the so-called "observed power" afterwards.

## Large samples can make small differences significant

Suppose a new interface reduces the average processing time from 20.00 seconds to 19.85 seconds. With millions of samples, this 0.15 second difference can result in extremely small p-values.

Statistically strong evidence does not equal operational importance.

The analysis should therefore ask separately:

- How big the difference is;
- how wide the interval is;
- What is the unit;
- How much impact does it have when converted into customer experience, cost or capacity?
- Is the cost of implementation worth it?

Effect size and uncertainty are closer to actual decisions than "number of stars".

## Welch's t-test is a practical default for two independent means

When comparing the means of two independent groups, R's `t.test()` defaults to using the Welch t-test, which does not require that the population variances of the two groups be exactly equal.

```r
delivery <- data.frame(
  method = rep(c("Current", "New"), each = 15),
  hours = c(
    31, 29, 35, 34, 28, 33, 36, 30, 32, 37, 29, 34, 31, 35, 30,
    27, 26, 29, 28, 25, 30, 27, 29, 26, 28, 24, 30, 27, 26, 29
  )
)

t.test(hours ~ method, data = delivery)
```

In addition to the p value, what is more worthy of attention is the confidence interval of the means of the two groups, the difference between the means, and whether there is an abnormal structure in the data distribution.

```r
boxplot(hours ~ method, data = delivery)
```

It is usually safer to look at the picture first and then read the test results than to run the test first.

## Paired data cannot be treated as independent samples

If the same group of customers are tested once before and after the revision, the two observations are not independent.

```r
before <- c(18, 22, 20, 25, 19, 21, 24, 23)
after  <- c(16, 20, 19, 21, 18, 20, 22, 21)

t.test(before, after, paired = TRUE)
```

What a paired design really analyses is the within-subject difference:

\[
D_i=X_{i,before}-X_{i,after}
\]

If the independent samples test is used incorrectly, paired information is lost and the standard error calculation no longer corresponds to the actual design.

## Tests of proportions follow the same logic

Assume that the original on-time rate is 90%, and now extract 300 orders, of which 282 orders are on time:

```r
prop.test(
  x = 282,
  n = 300,
  p = 0.90,
  correct = FALSE
)
```

What is tested here is:

\[
H_0:p=0.90
\]

Proportional data belongs to a binary/count structure, and the method of continuous variables cannot be completely copied just because "there is also an average". When samples are small or events are rare, the exact binomial method needs to be considered:

```r
binom.test(282, 300, p = 0.90)
```

## Multiple testing can create false positives

If \(\alpha=0.05\) is used for each test, Type I errors are controlled when only one test is done at a time; but if many tests are done at the same time, the probability of at least one false positive will increase significantly.

Suppose an analysis performs 20 independent tests whose null hypotheses are all true:

\[
P(\text{至少一个假阳性})=1-(1-0.05)^{20}\approx0.64
\]

Therefore, it is easy to create accidental discoveries by "checking all fields with the result variables and then selecting variables with p < 0.05".

Common adjustments include Bonferroni and false discovery rate:

```r
p_values <- c(0.003, 0.018, 0.041, 0.12, 0.40)
p.adjust(p_values, method = "bonferroni")
p.adjust(p_values, method = "BH")
```

The choice of method depends on the cost of error and the research objectives, and adjustments cannot be treated as a fixed ritual.

## Violated assumptions change the meaning of a p-value

Each test depends on data and model conditions such as independence, sampling mechanism, distribution approximation, or variance structure.

Particularly common questions include:

- Multiple records for the same customer appear, but they are processed as independent samples;
- The time series has autocorrelation, but uses the independent error formula;
- Serious selection bias, but interpret the sample as a random sample;
- inspect the results before choosing the direction of the test;
- Repeatedly try many filtering rules and only report the smallest p-value.

These problems cannot be solved automatically by changing the test name.

## "There is no significant difference" does not mean "the two solutions are the same"

If `p = 0.30`, it only means that the data does not provide enough evidence to reject the current null hypothesis.

The reasons may be:

- The real effect is indeed small;
- The sample size is too small;
- The data fluctuates too much;
- Poor measurement quality;
- The study design was not sensitive enough.

If the real question is whether two options are close enough, use an equivalence or non-inferiority design built around an acceptable difference. An ordinary non-significant result does not establish sameness.

## A more reliable testing workflow

For a statistical test, work through the following sequence:

1. Clarify the overall, parameters and business issues;
2. Write null/alternative hypothesis;
3. Confirm whether it is unilateral or bilateral, and fix it before looking at the results;
4. Check sampling, independence, pairings, and data types;
5. First look at the graphs and descriptive statistics;
6. Choose statistics consistent with the design;
7. Also report effect estimate, confidence interval and p-value;
8. Check sample size and power;
9. Control overall error during multiple testing;
10. Finally, discuss the practical business implications.

This sequence can transform hypothesis testing from a "threshold judge" back to a set of statistical evidence tools.

## References

For knowledge structure, refer to Rafael A. Irizarry's _Introduction to Data Science: Statistics and Prediction Algorithms Through Case Studies_ in Hypothesis Testing, Power, and the connection between confidence interval and p-value. The text, business cases, code, and explanations have been reorganized.

Reference site: <https://rafalab.dfci.harvard.edu/dsbook-part-2/> . Original material licensed under CC BY-NC-SA 4.0.
