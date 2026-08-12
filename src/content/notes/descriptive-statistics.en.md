---
translationKey: descriptive-statistics
locale: en
slug: descriptive-statistics
title: Statistics with R
summary: Statistical analysis should not begin with memorising formulas. This handbook starts with the shape of a dataset, then develops probability, estimation, hypothesis testing, regression, clustering and PCA through practical R examples.
tags:
  - statistics
  - probability
  - hypothesis testing
  - regression
  - clustering
topics:
  - R and Statistics
  - Data Understanding
  - Statistical Modelling
tools:
  - R
  - Base R
series: R and Statistics
seriesSlug: r-statistics
order: 1
publishedAt: 2026-08-10
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes: []
---

## Before you begin

The difficult part of statistics is rarely the formula itself. It is deciding which method fits the question and what the result can genuinely support.

After obtaining a piece of data, the more natural sequence is: first look at the distribution and outliers, and then determine whether there is a relationship between the variables; if it is necessary to infer the population from the sample, then proceed to probability, estimation, and hypothesis testing; when the problem is more complex, continue to regression, clustering, and dimensionality reduction.

R handles the calculations and visualisations. A function can quickly produce a p-value or model coefficient, but it cannot judge whether the data structure is appropriate, the assumptions are credible or the conclusion is overstated.

This manual therefore brings together "statistical concepts" and "how R does it". When reading a formula, first look at the question it answers. When reading code, first think about the expected results and then look at the output.

## Descriptive statistics

Before discussing populations, significance, or models, understand your sample.

Descriptive statistics mainly answer two types of questions: where the data are concentrated, and how dispersed the data are. Simply reporting an average is usually not enough, because two sets of data with the same mean may have completely different fluctuations, skewness, and outliers.

### Measures of central tendency

The **mean** adds all values and divides by the number of observations:

\[
\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i
\]

It is suitable for describing overall levels such as average cost, average waiting time, average order amount, etc., but is sensitive to extreme values.

**Median** is the middle position after sorting. A few particularly large values in right-skewed data will push the mean higher, and the median is usually closer to the "typical record".

The **mode** is the most frequently occurring value. It is particularly useful for categorical variables, such as the most common channel, product category or customer type.

In R:

```r
x <- c(6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
       18, 19, 20, 21, 23, 24, 25, 27, 29, 34, 52, 68)

mean(x)
median(x)
```

If the mean is substantially larger than the median, the distribution may have a long right tail. Inspect a histogram or box plot rather than stopping at the vague label "skewed data".

### Measures of dispersion

**Extremely poor range**:

\[
Range=max(x)-min(x)
\]

Easy to understand, but completely determined by two endpoints.

**Variance** and **standard deviation** use all observations.

Sample standard deviation:

\[
s=\sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}
\]

In R:

```r
var(x)
sd(x)
```

The standard deviation has the same units as the original variable, so it is usually more intuitive than the variance.

**Interquartile range IQR**:

\[
IQR=Q_3-Q_1
\]

Only look at the middle 50% data, which is more robust to extreme values:

```r
IQR(x)
quantile(x)
```

### Mean and standard deviation should be read together

Assume that both service teams have an average response time of 20 minutes:

```text
Team A: mean = 20, sd = 2
Team B: mean = 20, sd = 12
```

Looking only at the mean, the two teams are the same; after adding the standard deviation, Team B's service stability is significantly worse.

In Business Analytics, average performance and volatility are often equally important. Inventory, lead time, cost and demand forecasts should not report only one central value.

### Quartiles and box plots

Boxplots quickly display distributions with medians, upper and lower quartiles, and whiskers.

```r
boxplot(x, horizontal = TRUE)
```

The common 1.5 × IQR rule just helps flag potential anomalies:

\[
Lower=Q_1-1.5IQR
\]

\[
Upper=Q_3+1.5IQR
\]

Records outside this range are worth checking, but should not be automatically deleted. Extreme orders, unusually high wait times, or large customer transactions may be real business events.

### Visualising a distribution

Descriptive statistics are best used with graphs.

```r
hist(x)
boxplot(x)
plot(density(x))
```

Histograms are suitable for looking at the overall shape, box plots are suitable for quickly comparing outliers and interquartile ranges, and density plots emphasize distribution contours.

<div data-learning-slot="statistics-lab"></div>

## Probability and distributions

Descriptive statistics only deal with observed data. Probability begins with a discussion of “outcomes that have not yet occurred” and how random phenomena will behave in the long term.

### Random variables and probability distributions

Random variables map random results into numerical values.

For example:

```text
一天收到多少服务请求
一张订单是否延迟
客户月消费金额
```

The first two can be regarded as count variables and binary variables respectively, while the consumption amount is closer to a continuous variable.

Different data-generating processes support different distributions. The availability of a convenient function is not evidence that its distributional assumptions fit the problem.

### Binomial distribution

A binomial distribution is appropriate when there is a fixed number of independent trials, each trial has two outcomes, and the success probability p remains constant:

\[
X\sim Binomial(n,p)
\]

In R:

```r
dbinom(3, size = 10, prob = 0.2)
pbinom(3, size = 10, prob = 0.2)
```

`dbinom` gives the probability of a specific number of successes, and `pbinom` gives the cumulative probability.

If the probabilities of success vary widely between clients, or if events are significantly dependent, the binomial distribution should not be mechanically assumed.

### Poisson distribution

A Poisson distribution is often used for event counts within a defined period or area:

\[
X\sim Poisson(\lambda)
\]

For example, how many requests are received in an hour and how many equipment failures occur in a day.

In R:

```r
dpois(4, lambda = 3)
ppois(4, lambda = 3)
```

Poisson distribution often assumes that events are independent and the average occurrence rate is relatively stable. If peak periods or clustering effects are evident in the data, a single λ may not be sufficient.

### Continuous probability distributions

The normal distribution is one of the most common continuous distributions:

\[
X\sim N(\mu,\sigma^2)
\]

In R:

```r
dnorm(10, mean = 8, sd = 2)
pnorm(10, mean = 8, sd = 2)
qnorm(0.95, mean = 8, sd = 2)
```

`dnorm` corresponds to density, `pnorm` corresponds to cumulative probability, and `qnorm` inversely infers quantiles from probability.

A large sample does not make the underlying variable normally distributed. Suitability still depends on the data-generating process and the modelling purpose.

### Standardisation and z-scores

Standardisation converts values at different scales into relative positions:

\[
z=\frac{x-\mu}{\sigma}
\]

Commonly used in samples:

```r
z <- scale(x)
```

z=2 means that the value is approximately 2 standard deviations above the mean.

This is useful for anomaly detection, variable scale comparison, and some machine learning methods, but the interpretation of z-score depends on the distribution context, and not all z>2 should be treated as error values.

## Estimation

A sample is usually only a portion of a population. Estimate discusses how sample statistics are used to infer population parameters and how uncertain such inferences are.

### Point estimates

The sample mean \(\bar{x}\) can be used as a point estimate of the population mean \(\mu\); the sample proportion \(\hat p\) can be used to estimate the population proportion p.

The point estimate only gives a number, but does not tell how accurate the number is.

### Standard errors

Standard error of sample mean:

\[
SE(\bar{x})=\frac{s}{\sqrt{n}}
\]

As the sample size increases, the standard error decreases. This reflects an intuition: the more samples there are, the more accurate the position of the population mean is usually known.

But large samples don't automatically fix sampling bias. If the sample itself is not representative of the population, n may be very accurate in estimating a false target no matter how large it is.

### Confidence intervals

The confidence interval for the population mean is often written as:

\[
\bar{x}\pm t^*SE(\bar{x})
\]

In R:

```r
t.test(x)$conf.int
```

95% confidence interval does not mean "this fixed interval has a probability of 95% containing the fixed μ". The frequentist explanation emphasizes repeated sampling: intervals constructed in the same way will cover the real parameters in the long run by approximately 95%.

### Assessing normality

Small sample mean inference often requires checking whether the distribution deviates significantly from normality.

```r
shapiro.test(x)
qqnorm(x)
qqline(x)
```

The Shapiro-Wilk p-value should not independently determine everything. When the sample is large, a small deviation may be significant; when the sample is small, the test may lack power. Both graphics and business context need to be looked at together.

## Correlation analysis

Correlation is used to describe whether two variables change together but cannot automatically be interpreted as cause and effect.

### Pearson correlation

Pearson correlation coefficient:

\[
r=\frac{Cov(X,Y)}{s_Xs_Y}
\]

Range is -1 to 1.

```r
cor(x, y, method = "pearson")
cor.test(x, y, method = "pearson")
```

r close to 1 indicates a strong positive linear relationship, close to -1 indicates a strong negative linear relationship, and close to 0 indicates no obvious linear relationship.

However, r=0 does not mean that the variables are completely unrelated. An obvious U-shaped relationship may also result in a Pearson r close to 0.

### Spearman correlation

For monotonic relationships, ordinal data or greater resistance to outliers, use Spearman correlation:

```r
cor.test(x, y, method = "spearman")
```

It is based on ranking and is more robust than Pearson to extreme values and non-linear monotonic relationships.

### Visualising correlation

Any correlation coefficient is best paired with a scatter plot:

```r
plot(x, y)
abline(lm(y ~ x), col = "red")
```

Scatter plots can directly expose outliers, groupings, nonlinearity, and heteroskedasticity. Given just one r, it's easy to squeeze completely different data shapes into the same number.

## Comparing one or two means

The key to mean comparison is not to find the t-test first, but to first determine how many groups there are, whether the samples are independent, whether the data are paired, and whether the question really cares about the mean or the distribution position.

### One-sample means

To test whether the mean response time equals 20:

\[
H_0:\mu=20
\]

In R:

```r
t.test(x, mu = 20)
```

Output includes t statistic, p-value, and confidence interval.

A small p-value indicates that the data is less consistent with H0, but should still be combined with how far the means are apart, how wide the confidence interval is, and whether the difference is operationally important.

### Two independent samples

For example comparing two independent service teams:

```r
t.test(response_time ~ team, data = service_df)
```

R uses the Welch t-test by default, which does not require that the variances of the two groups are exactly equal.

If the business problem really requires the classic pooled variance t-test, the corresponding premise needs to be clearly set and checked, instead of defaulting to equal variances because the textbook formula is simple.

### Paired samples

When the same batch of objects is measured at two time points before and after, the records are not independent.

For example, the processing time of the same customer before and after process optimization:

```r
t.test(before, after, paired = TRUE)
```

Pairwise analysis actually focuses on each pair of differences.

If paired data is treated as two independent samples, the correspondence within the object will be lost.

### Non-parametric alternatives

The Wilcoxon method can be considered when the mean model is inappropriate, the distribution is extreme, or the data is closer to rank information:

```r
wilcox.test(x, mu = 20)
wilcox.test(x, y)
```

Non-parametric methods are not "completely hypothesis-free", they just rely on different distribution conditions. Method selection should still come back to the data structure and research question.

## Comparing several means

Doing many pairwise t-tests in a row increases the Type I error rate when comparing three or more groups.

### One-way ANOVA

For example, compare the average response times of three service channels:

```r
model_aov <- aov(response_time ~ channel, data = service_df)
summary(model_aov)
```

The null hypothesis of ANOVA is that the population means of each group are the same:

\[
H_0:\mu_1=\mu_2=\cdots=\mu_k
\]

The overall F test is significant, which only shows that at least one group of means is different, and does not directly tell which two groups it is.

### Post-hoc comparisons

After a significant omnibus ANOVA, Tukey HSD provides adjusted pairwise comparisons:

```r
TukeyHSD(model_aov)
```

It controls the overall error rate when multiple comparisons are made, which is more reliable than just doing a bunch of unadjusted t-tests.

### ANOVA also needs diagnostics

Independence, residual structure, and variance issues still need to be checked.

```r
plot(model_aov)
```

If the differences in variance between groups are significant, Welch ANOVA or a more appropriate robust method may also be considered.

Statistical testing is not about choosing a function and forcing the data to fit it.

## Analysing proportions

If the outcome variable is "success/failure", "churn/not lost", or "delay/on time", the focus is usually on the proportion rather than the mean.

### One-sample proportions

For example, 30 of the 200 orders are delayed:

\[
\hat p=30/200=0.15
\]

The overall delay rate can be compared with a benchmark:

```r
prop.test(x = 30, n = 200, p = 0.10)
```

### Comparing two proportions

For example, compare the conversion rates of two channels:

```r
prop.test(
  x = c(45, 60),
  n = c(300, 320)
)
```

Alongside the p-value, report the difference in proportions and its interval. A statistically significant result still requires a separate judgement about whether the improvement warrants action.

### Contingency table and chi-square test

A contingency table can assess the association between two categorical variables:

```r
tab <- table(customer_df$segment, customer_df$churn)
chisq.test(tab)
```

The chi-square test focuses on the difference between observed frequencies and expected frequencies under independent conditions.

If the sample is small and the expected frequency is too low, Fisher's exact test may be more appropriate.

## Common advanced methods

The previous statistical methods mainly answer description, comparison and inference. After the data has more dimensions, modelling, grouping and dimensionality reduction will also be entered.

### Regression analysis

Regression relates an outcome variable to one or more explanatory variables.

Simple linear regression:

```r
model <- lm(response_time ~ workload, data = service_df)
summary(model)
```

Multiple regression:

```r
model <- lm(response_time ~ workload + priority + channel,
            data = service_df)
```

Regression coefficients should be interpreted in conjunction with variable units, control variables, and confidence intervals. R² is only one piece of fitting information, and residual diagnosis is equally important.

Binary outcomes can use logistic regression:

```r
logit_model <- glm(
  churn ~ tenure + monthly_charge,
  data = customer_df,
  family = binomial()
)
```

The coefficients output by Logistic Regression are on the log-odds scale and are often converted into odds ratio through `exp(coef(logit_model))`.

<div data-learning-slot="regression-line-lab"></div>

### Cluster analysis

Clustering is unsupervised learning and does not have a pre-specified result label. The goal is to divide observations into groups based on variable similarity.

#### k-means

k-means tries to keep the distance within the group as small as possible:

```r
set.seed(42)
km <- kmeans(scale(customer_features), centers = 3)
km$cluster
```

Standardisation is important because distances are affected by variable scale. When income is expressed in units of ten thousand yuan while visits are single-digit counts, using raw values may allow income to dominate the distance.

The choice of k can refer to elbow, silhouette and business interpretability, rather than just pursuing a mathematical indicator.

#### Hierarchical Clustering

Hierarchical clustering first calculates distances and then gradually merges or splits objects:

```r
d <- dist(scale(customer_features))
hc <- hclust(d, method = "ward.D2")
plot(hc)
```

The tree diagram can show the grouping structure at different cutting heights.

The results of hierarchical clustering are affected by distance measures and linkage methods, so "the tree looks beautiful" does not mean that the classification naturally exists.

### Principal component analysis

PCA summarizes multiple related numerical variables using a small number of linear combinations.

```r
pca <- prcomp(customer_features, scale. = TRUE)
summary(pca)
```

The first principal component explains the maximum variance, and the second principal component explains the remaining maximum variance in the direction orthogonal to the first.

PCA is often used for:

- Dimensionality reduction;
- visualisation;
- Dealing with highly correlated variables;
- Construct a low-dimensional representation for subsequent models.

However, principal components are combinations of original variables, and the interpretation is usually not as direct as the original business fields. The simplicity brought by dimensionality reduction must be weighed against interpretability.

## Do not choose a method by its function name

For a new analytical question, begin by asking:

```text
结果变量是什么类型？
有几组？
记录是否独立或配对？
问题是在描述、比较、解释还是预测？
数据分布和样本量怎样？
```

Then decide to use mean, proportion, correlation, t-test, ANOVA, regression or other methods.

Choosing the function is the final step, not the first.

## The p-value is not the whole story

The p-value answers how unusual it is to observe the current data or more extreme results if the null hypothesis holds.

It doesn't directly answer:

```text
效果有多大？
业务上值不值得行动？
结果能不能推广到总体？
模型能不能预测新数据？
```

Therefore, a formal analysis would ideally also report:

- effect size；
- confidence interval；
- sample size;
- Data and method limitations;
- Actual business implications.

## A practical statistical workflow

1. First confirm what a row of data represents and what type the variable is;
2. Use descriptive statistics and graphics to look at distributions, fluctuations, and outliers;
3. If random outcomes are involved, identify appropriate probabilistic models;
4. Report estimates and uncertainties when inferring from a sample to a population;
5. Confirm independence, paired and sample structure before comparing groups;
6. Examine the shape of the relationship and potential confounders before entering regression;
7. For multivariate unlabeled problems, consider clustering or PCA;
8. After the R output is complete, roll the numbers back to the original business problem.

Statistics is not a problem-function table. The truly stable ability is to first understand the data and problems, then choose a sufficiently suitable method, and finally express the results into a conclusion with scope, evidence, and boundaries.
