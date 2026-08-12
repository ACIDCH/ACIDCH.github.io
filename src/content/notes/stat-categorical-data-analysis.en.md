---
translationKey: stat-categorical-data-analysis
locale: en
slug: stat-categorical-data-analysis
title: Categorical Data Analysis
summary: Start with frequencies, proportions, and contingency tables, move on to conditional proportions, chi-square tests, odds and odds ratios, and naturally connect categorical data analysis to logistic regression.
tags:
  - statistics
  - categorical data
  - chi-square tests
topics:
  - R and Statistics
  - Statistical Inference
  - Classification Problems
tools:
  - R
  - Base R
series: R and Statistics
seriesSlug: r-statistics
order: 6
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - stat-data-types-scales
  - stat-hypothesis-testing
  - logistic-regression
---

## Categorical analysis starts with counts

The most direct information about categorical variables is not the mean, but how many times each category appears and what proportion it accounts for.

Suppose 400 customer-service outcomes were recorded in one month:

```r
service <- data.frame(
  channel = rep(c("Web", "Store"), each = 200),
  resolved = c(
    rep("Yes", 164), rep("No", 36),
    rep("Yes", 142), rep("No", 58)
  )
)
```

Start with frequencies:

```r
table(service$resolved)
```

Then calculate proportions:

```r
prop.table(table(service$resolved))
```

If you only know "resolved 306 times", you still don't know if there is a difference between Web and Store. The next step in categorical data analysis is usually to put the two categorical variables into the same contingency table.

## Contingency tables make two categorical variables visible at the same time

```r
tab <- table(service$channel, service$resolved)
tab
```

get:

| Channel |  No | Yes |
| ------- | --: | --: |
| Store   |  58 | 142 |
| Web     |  36 | 164 |

This table retains the joint frequencies of both variables.

If the question is "Do channels have different resolution rates?", compare **conditional proportions**, not raw counts.

```r
prop.table(tab, margin = 1)
```

After row standardisation:

- Web resolution rate: 82%;
- Store resolution rate: 71%.

This is already closer to the problem than an overall solution rate alone.

## The denominator of the conditional proportion must be stated clearly

`prop.table()` has different margins and answers different questions.

```r
prop.table(tab, margin = 1)  # 每个渠道内部的结果比例
prop.table(tab, margin = 2)  # 每种结果来自不同渠道的比例
prop.table(tab)              # 占全部记录的联合比例
```

For example "82% was solved in the Web" and "How many of all solved records came from the Web" are two completely different questions.

One of the most common errors in interpreting categorical data is to report only percentages without stating the denominator.

It is best to write down the complete proportion in the business report:

```text
Web 渠道的 200 次记录中，164 次被解决，解决率 82%。
```

This is less ambiguous than just writing "82%".

## Bar charts should use the same conditional denominator

Graphs for categorical variables are usually less complex, but the denominator of the proportion still needs to be consistent with the problem.

```r
library(ggplot2)

ggplot(service, aes(channel, fill = resolved)) +
  geom_bar(position = "fill") +
  labs(y = "Proportion")
```

`position = "fill"` scales each channel to 100%, making it suitable for comparing result composition within channels.

In an ordinary stacked bar chart, channels with larger samples are naturally taller, which obscures a direct comparison of proportions.

Graphs do not automatically solve statistical problems; they simply visualise selected denominators and comparisons.

## Independence means one variable does not change another's distribution

If channel is independent of resolved, then knowing which channel the customer came from should not change the probability distribution of the result categories.

In probability notation it can be written as:

\[
P(Resolved\mid Channel)=P(Resolved)
\]

If the Web resolution rate is 82%, and the Store resolution rate is 71%, a difference has occurred in the sample. The next question is whether this difference is so large that it cannot be explained by random sampling fluctuations.

The Chi-square test of independence provides a common testing framework for this kind of contingency table problem.

## Chi-square test compares observed and expected frequencies

The null hypothesis is that the two categorical variables are independent.

\[
H_0:\text{Channel 与 Resolved 独立}
\]

If independently true, the expected count for each cell can be calculated from the row and column totals:

\[
E_{ij}=\frac{(\text{row total}_i)(\text{column total}_j)}{N}
\]

Chi-square statistic:

\[
\chi^2=\sum\frac{(O-E)^2}{E}
\]

where \(O\) is the observed count and \(E\) is the expected count.

In R:

```r
chi <- chisq.test(tab, correct = FALSE)
chi
chi$expected
```

`chi$expected` is important because the chi-square approximation relies on the expected frequency not being too small.

## The p-value of the chi-square test does not tell how large the effect is

A small p-value indicates that the independence model fits the data poorly. It does not quantify the difference, identify its direction or establish practical value.

After the test, return to the underlying proportions:

```r
prop.table(tab, margin = 1)
```

In this example, the Web resolution rate is 82%, Store 71%, and the absolute difference is:

\[
0.82-0.71=0.11
\]

That's 11 percentage points.

If there are 50,000 services per month, this difference may correspond to a large operational impact; if there are only a few dozen records, the estimate uncertainty may be high.

Statistical evidence and practical effects need to be interpreted together.

## Consider Fisher's exact test for small or sparse tables

The chi-square test relies on large sample approximations. If some of the expected counts in the 2×2 table are small, the approximation may be unstable.

A common alternative in this case is Fisher's exact test:

```r
small_tab <- matrix(
  c(1, 9,
    6, 4),
  nrow = 2,
  byrow = TRUE
)

fisher.test(small_tab)
```

"Chi-square must not be used if the expected frequency is less than 5" is an overly mechanical rule. A safer bet is to check table size, sparsity, and approximation conditions; Fisher's method is particularly natural in very small 2×2 problems.

## Describe binary outcomes with risk differences and risk ratios

For a binary outcome, compare event probabilities directly as well as testing independence.

Web resolution rate:

\[
p_W=0.82
\]

Store resolution rate:

\[
p_S=0.71
\]

**Risk difference**：

\[
RD=p_W-p_S=0.11
\]

It answers "by how many percentage points absolutely?"

**Risk ratio**：

\[
RR=\frac{p_W}{p_S}=\frac{0.82}{0.71}\approx1.15
\]

It answers how many times the solution probability of Web is approximately that of Store.

The two indicators express different scales and cannot be substituted for each other.

## Odds and probability are not the same quantity

If the event probability is \(p\), odds are defined as:

\[
Odds=\frac{p}{1-p}
\]

Web odds:

\[
\frac{0.82}{0.18}\approx4.56
\]

Store odds:

\[
\frac{0.71}{0.29}\approx2.45
\]

probability 0.82 represents the probability of 82%; odds 4.56 represents the relative ratio between occurrence and non-occurrence of an event, which is approximately 4.56:1.

The numerical scales of the two are completely different.

## Odds ratio quantifies the relative odds of two groups

For the 2×2 table:

|         | Event | No event |
| ------- | ----: | -------: |
| Group A |     a |        c |
| Group B |     b |        d |

odds ratio：

\[
OR=\frac{a/c}{b/d}=\frac{ad}{bc}
\]

Using the current example:

```r
web_odds <- 164 / 36
store_odds <- 142 / 58
odds_ratio <- web_odds / store_odds
odds_ratio
```

OR > 1 means that the Web solution odds are higher; OR = 1 corresponds to the two groups having the same odds.

But OR cannot be directly translated into "how many times the probability is increased." When events are common, odds ratio and risk ratio can differ significantly.

## Why odds ratios connect naturally to logistic regression

Logistic regression uses log-odds:

\[
\log\left(\frac{p}{1-p}\right)
=\beta_0+\beta_1X
\]

If \(X\) is a binary group, \(e^{\beta_1}\) can be interpreted as the odds ratio under the adjusted premise.

This means that categorical data analysis and logistic regression are not two separate topics.

Contingency tables handle direct comparisons between a small number of categories; logistic regression can continue to include multiple explanatory variables, such as channel, customer class, waiting time and region, to estimate conditional associations in the same model.

```r
service$resolved_flag <- ifelse(service$resolved == "Yes", 1, 0)

fit <- glm(
  resolved_flag ~ channel,
  data = service,
  family = binomial()
)

exp(coef(fit))
```

The exponential form of the model coefficients is linked to the odds ratio, but the event class encoding and reference group must still be confirmed first.

## Simpson's paradox reveals the importance of stratification

Overall proportions may obscure key groupings.

Assume that Web customers come more from simple problems, while Store is exposed to more complex problems. Web resolution rates are higher overall, perhaps in part simply because of the different composition of question types.

Stratify the table by severity:

```r
with(service_detail, table(channel, resolved, severity))
```

Or compare separately using conditional proportions.

If the differences within each severity layer are small, but the overall differences are large, the composition effect may be dominating the results.

This is why “overall correlation” cannot automatically be interpreted as indicating that the channel itself caused the effect. Confounding in observational data requires separate treatment.

## Several categorical variables produce larger contingency tables

Categorical variables do not necessarily have only two categories.

For example, the region has the 4 class, the result has the 3 class, and the 4×3 table is obtained:

```r
tab_region <- table(customer$region, customer$outcome)
chisq.test(tab_region)
```

The overall chi-square test can only tell whether there is a correlation, not which cells contributed the most.

Inspect the standardised residuals:

```r
chi_region <- chisq.test(tab_region)
chi_region$stdres
```

A large absolute residual indicates that a cell's observed count differs materially from the count expected under independence.

However, if you then test many cells one by one, you must also pay attention to the problem of multiple comparisons.

## Preserve order information when categories are ordinal

If variables contain ordered categories such as Low / Medium / High, an ordinary chi-square test still treats them as unordered.

Sometimes this is exactly what is needed; sometimes the research question is concerned with monotonic trends.

For example, the escalation rate may increase as service priority moves from low to high. Alongside the full contingency table, inspect ordered conditional proportions or use a model that preserves this ordering.

The key is not to force a "higher" test, but not to mishandle ordinal into nominal during data entry and forget its original structure.

## Distinguish missing values from genuine categories

Commonly seen in categorical variables:

```text
Unknown
Not recorded
Not applicable
Other
```

These labels have different meanings.

`Other` may be a real category; `Unknown` may be missing; `Not applicable` means that the field is not applicable to some records.

If you combine them all into a common factor level, both the proportions and the test results will be mixed with data quality issues.

Before formal analysis it is best to check:

```r
table(customer$category, useNA = "ifany")
```

and treat missingness itself as a data phenomenon that needs to be explained.

## Common misunderstandings

**"After the categories are numerically encoded, the mean can be calculated."** Encoding only stores and does not change the semantics of the variables.

**"A larger percentage must be significant."** Significance also depends on sample size and random fluctuations.

**"A small p-value indicates a strong association."** The p-value is not the effect size.

**"OR=2 means the probability is doubled."** Odds and probability are not on the same scale.

**"A difference in overall proportions is a causal effect."** Group composition and confounding may change the overall results.

**"There is no need to look at the table after the chi-square test passes."** The real direction and business meaning still come from frequencies, conditional proportions and effect indicators.

## A practical categorical-analysis workflow

For two categorical variables, use the following sequence:

1. Be clear about what each line represents;
2. Check category definitions, order, and missing values;
3. Print frequency table;
4. Calculate the conditional proportion after clarifying the denominator;
5. examine the structure using a proportional bar chart;
6. Choose chi-square or exact methods when inference is required;
7. Look at the effect size, not the read-only p-value;
8. Binary questions may further report risk difference, risk ratio, or odds ratio;
9. Check whether the relationship changes after layering;
10. When multiple variables need to be controlled, enter logistic regression.

This route connects “categorical data” from simple counts all the way to subsequent classification models, while preserving the denominators, comparative scales, and uncertainties required for statistical interpretation.

## References

The knowledge structure refers to the visualisation and summary of categorical data in Rafael A. Irizarry's _Introduction to Data Science_, and the connection of chi-square, odds ratio and generalized linear models in the linear model section of the new version of _Statistics and Prediction Algorithms Through Case Studies_. The text, business examples, and code have been reorganized.

Reference sites: <https://rafalab.dfci.harvard.edu/dsbook-part-1/> and <https://rafalab.dfci.harvard.edu/dsbook-part-2/>. Original material licensed under CC BY-NC-SA 4.0.
