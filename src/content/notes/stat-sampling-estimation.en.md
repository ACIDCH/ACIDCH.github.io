---
translationKey: stat-sampling-estimation
locale: en
slug: stat-sampling-estimation
title: Sampling and Estimation
summary: Connect populations, samples and parameters to random sampling, sampling distributions, standard errors and the central limit theorem, then assess how reliable a sample estimate is.
tags:
  - statistics
  - sampling
  - statistical inference
topics:
  - R and Statistics
  - Statistical Inference
  - Data Quality
tools:
  - R
  - Base R
series: R and Statistics
seriesSlug: r-statistics
order: 3
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - descriptive-statistics
  - stat-data-types-scales
---

## From observed data to the population of interest

Many analyses aim beyond describing the observed table: they use a subset of observations to learn about a larger population.

For example, it is impossible for a company to visit all customers at the same time, but it hopes to estimate the average waiting time of all active customers; it randomly checks a part of outbound orders, hoping to determine the on-time rate of the entire warehouse; it surveys a part of subscribers, hoping to estimate the overall churn ratio.

Four roles must be distinguished:

- **Population**: all units relevant to the question;
- **Sample**: the subset of units actually observed;
- **Parameter**: a population quantity of interest that is usually unobserved;
- **Statistic / estimator**: a quantity calculated from a sample and used to estimate a population parameter.

If the population average waiting time is denoted by \(\mu\) and the sample average waiting time by \(\bar X\), then \(\bar X\) is an estimate of \(\mu\).

\[
\bar X=\frac{1}{n}\sum_{i=1}^{n}X_i
\]

One sample produces one \(\bar X\). Statistical inference asks: **How would this estimate vary across repeated samples?**

## Why random sampling matters

The sampling method determines whether the sample is representative of the target population.

The ideal base case is a simple random sample: every unit in the population has a known and fair chance of being in the sample. Real business data is often less than perfectly random, but this benchmark can help identify sources of bias.

Suppose there are 10,000 customers, and only 200 are drawn:

```r
set.seed(2026)
customer_ids <- 1:10000
sample_ids <- sample(customer_ids, size = 200, replace = FALSE)
length(sample_ids)
```

Random sampling is not to "make the data look random", but to make the sample selection mechanism as less systematically related to the research results as possible.

If you only survey customers who are willing to take the initiative to respond to the questionnaire, the sample may over-represent people who are particularly satisfied or dissatisfied; if service data are only collected on weekday mornings, the evening peak may be missed.

These problems will not disappear because more complex formulas are used later.

## Representativeness and sample size are two different things

Large samples can usually reduce random errors, but cannot automatically repair selection bias.

Assume that an online channel has 50,000 records, but offline store customers have no access to the data at all. If the analysis target is "all customers", no matter how large the sample is, there is still one missing group.

Errors can be roughly divided into two categories:

**Random Sampling Error**: Even if the sampling mechanism is correct, different random samples will still produce different estimates; the sample size will usually shrink as it increases.

**Systematic bias**: Sample selection, measurement methods or missing mechanisms allow certain directions to be consistently overestimated or underestimated; simply adding similar samples is usually ineffective.

Standard errors in statistical inference mainly deal with the first type of problems, so the second type of problems must also be checked before formal reporting.

## Point estimate only gives one location

The most common point estimates include:

Estimate of the population mean \(\mu\):

\[
\hat\mu=\bar X
\]

Estimate of the population proportion \(p\):

\[
\hat p=\frac{x}{n}
\]

For example, 216 out of 240 sample orders are on time:

```r
n <- 240
on_time <- 216
p_hat <- on_time / n
p_hat
```

Obtain `0.90`, which is the sample on-time rate 90%. This number is a fact for the current sample, but overall on-time performance will not therefore be precisely determined as 90%.

Point estimation answers "where is the center", and the next step is to know "how stable is the center".

## Sampling distributions are the core of inference

Sampling distribution is not the distribution of the original data, but the distribution of a statistic in repeated sampling.

Assume that overall customer waiting times are right-skewed. If you continuously randomly select 100 people from the same population and calculate the average waiting time each time, you will get many different sample means:

```r
set.seed(2026)
population_wait <- rgamma(50000, shape = 3, scale = 4)

sample_means <- replicate(
  3000,
  mean(sample(population_wait, size = 100, replace = FALSE))
)

mean(sample_means)
sd(sample_means)
```

The distribution of `population_wait` describes individual customer wait times; the distribution of `sample_means` describes how the estimate of average wait time fluctuates.

These two distributions cannot be interpreted together.

## Do not mix standard deviation and standard error

Standard deviation describes variation among **individual observations**; standard error describes the sampling variation of an **estimator**.

The standard error of the sample mean is often written as:

\[
SE(\bar X)=\frac{s}{\sqrt n}
\]

where \(s\) is the sample standard deviation and \(n\) is the sample size.

Suppose the sample standard deviation of waiting time is 12 minutes:

```r
s <- 12
n <- 100
se <- s / sqrt(n)
se
```

The standard deviation is still 12 minutes, but the standard error of the mean is 1.2 minutes.

This does not mean that the differences between large samples of customers become smaller, but that the "sample mean" is more stable.

## Why precision improves with the square root of sample size

The formula shows that:

\[
SE\propto\frac{1}{\sqrt n}
\]

If the sample size increases from 100 to 400, the standard error is approximately halved; if you want the standard error to be halved again, the sample size usually needs to be increased four times.

```r
n_values <- c(25, 50, 100, 200, 400, 800)
se_values <- 12 / sqrt(n_values)

data.frame(n = n_values, se = se_values)
```

This square root relationship is important for data collection costs. If you continue to pursue a narrower uncertainty range in the later stage, you will usually have to pay more and more sample costs.

<div data-learning-slot="sampling-precision-lab"></div>

## The central limit theorem connects sample means to a normal approximation

The Central Limit Theorem shows that under fairly wide conditions, when the sample size is large enough, the sample means of independent observations will approach a normal distribution after standardisation:

\[
\frac{\bar X-\mu}{\sigma/\sqrt n}\approx N(0,1)
\]

It discusses the sampling distribution of the sample mean, not that the original data will automatically become normal.

Even if customer wait times are significantly right-skewed, after taking larger samples multiple times, the sample mean will tend to be closer to a bell shape than the original data.

```r
par(mfrow = c(1, 2))
hist(population_wait, main = "Individual waits")
hist(sample_means, main = "Sample means")
```

There is no fixed answer to "what is a sufficient sample size" that is independent of the shape of the data. The more skewed and tail-heavy the distribution, the more observations it usually requires. When there is strong dependence, clustering or time series structure, the simple version of independent and identical distribution cannot be directly applied.

## Proportion estimates also have standard errors

If each record has only two outcomes: success/failure, success can be recorded as 1 and failure as 0. The sample proportion is the average of these 0/1.

For independent Bernoulli observations, the standard error of the proportion estimate is approximately:

\[
SE(\hat p)=\sqrt{\frac{\hat p(1-\hat p)}{n}}
\]

```r
p_hat <- 0.90
n <- 240
sqrt(p_hat * (1 - p_hat) / n)
```

This formula illustrates that when the proportion is close to 0.5, random fluctuations are usually larger for the same sample size; when the proportion is very close to 0 or 1, the approximate method also needs to specifically check whether the number of successes/failures in the sample is sufficient.

## Monte Carlo simulation makes sampling theory tangible

When the formula is relatively abstract, simulation can be used to verify it.

Assume that the true overall on-time rate is 0.90, and 100 is drawn each time:

```r
set.seed(2026)
B <- 5000
n <- 100
p <- 0.90

estimates <- replicate(
  B,
  mean(rbinom(n, size = 1, prob = p))
)

mean(estimates)
sd(estimates)
sqrt(p * (1 - p) / n)
```

The simulated standard deviation will be close to the theoretical standard error. This experiment can clearly show that the "uncertainty" of a statistic is not added based on feelings, but is the result of repeated sampling behaviour.

Simulation also cannot fix incorrect population definitions or sampling mechanisms. It simply checks how the statistical method performs under the established data generation mechanism.

## Complex sampling designs need more than simple formulas

Real businesses often have natural hierarchies: customers belong to regions, orders belong to stores, employees belong to teams, and transactions belong to dates.

If the differences between different layers are significant, a simple random sample may not be the most efficient design. Common designs include:

- **stratified sampling**: divide the population into important groups, then sample within each stratum;
- **cluster sampling**: select stores, schools or regions first, then observe units within those clusters;
- **systematic sampling**: sample from an ordered list at fixed intervals.

These designs alter the standard error calculations. In particular, records within a cluster are often similar, and treating them all as independent observations will underestimate the uncertainty.

So "the sample has 10,000 rows" is not the same as "has 10,000 independent units of information".

## Missingness and non-response are part of the sampling problem

Drawing an object does not mean that a valid record will eventually be obtained.

If questionnaire response probability is related to satisfaction, complete cases may no longer represent the original sample; if peak equipment logs are more likely to be lost, missing values will also be relevant to the results.

A formal analysis should at least compare:

```r
with(customer_survey, table(response_status, region))
with(customer_survey, prop.table(table(response_status, region), margin = 2))
```

The point here is not a fixed function, but checking "who did not enter the final analysis table". The estimated target population is often quietly changed at this step.

## Common misunderstandings

**"The sample is large, so it must be accurate."** Large samples reduce random errors and do not guarantee the absence of systematic bias.

**"A small standard deviation means a small standard error."** They describe different objects; the standard error also depends on the sample size.

**"The central limit theorem states that the data will become normal."** It mainly describes the sampling distribution of the sample mean under appropriate conditions.

**"Random sampling is simply selecting a few lines at random from a file."** If the original file itself already misses part of the target population, randomisation within the file cannot restore representativeness.

**"Repeated sampling is just statistical imagination."** Monte Carlo can directly simulate this repeated process to help check theoretical approximations.

## From a point estimate to an interval

Sampling and estimation address two core questions: what statistic is used to represent the population, and why this statistic fluctuates.

The natural next step is to convert this fluctuation into a range. The point estimate gives the center, the standard error gives the sampling scale, and the confidence level determines how much margin needs to be left on either side of the center.

Therefore, the interval estimate is not an additional "error bar" added next to the point estimate, but an extrapolation that extends directly from the sampling distribution.

## References

For the knowledge structure, refer to _Introduction to Data Science: Statistics and Prediction Algorithms Through Case Studies_ by Rafael A. Irizarry, especially the sampling models and Central Limit Theorem in Probability, and the processing of estimates and standard errors in Statistical Inference. The text, simulations, and business cases have been reorganized.

Reference site: <https://rafalab.dfci.harvard.edu/dsbook-part-2/> . Original material licensed under CC BY-NC-SA 4.0.
