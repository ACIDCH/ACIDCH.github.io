---
translationKey: r-data-analysis-prediction
locale: en
slug: r-data-analysis-prediction
title: Data Analysis and Predictive Modelling with R
summary: Build a coherent R workflow from data structures, visualisation and wrangling through statistical inference, regression, cross-validation, classification, supervised learning and clustering.
tags:
  - R
  - statistical inference
  - machine learning
  - predictive modelling
topics:
  - Data Understanding
  - Statistical Inference
  - Predictive Modelling
tools:
  - R
  - tidyverse
  - ggplot2
  - caret
series: Data Science with R
seriesSlug: data-science-r
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
  - regression-foundations
  - regression-feature-selection
  - logistic-regression
---

## What this note sets out to solve

The real difficulty in data analysis is usually not memorizing a function, but knowing what to do next. After getting a business table, should you check the variables first or draw a graph first? When a skewed distribution appears, should you change the statistics or directly transform it? The model performs very well on the training data, why does it get significantly worse when changing a batch of data? The classification accuracy is already very high, why do the business departments still think the model is not easy to use. These questions are interrelated and cannot be answered by just bits and pieces of code.

This note puts R, data visualization, data sorting, statistical analysis and predictive algorithms in the same workflow. The first half establishes the computational foundation required for data analysis, and the second half focuses on statistical inference and machine learning: how to generalize the patterns in the sample to the population, how to measure the uncertainty of estimates, how to build regression and classification models, how to control overfitting, and how to evaluate prediction algorithms using data that has not participated in model fitting.

The core teaching idea of ​​reference materials is to start from real problems and then introduce the statistical and computational tools needed to solve the problems. This idea is retained here, but the case is changed to data that is closer to business analysis: customers, orders, subscriptions, distribution and demand, rather than reproducing the classroom data in the reference materials paragraph by paragraph.

## Part One: R is an analytical language, not merely a calculator

### Objects, vectors, and data frames

The basic idea of ​​R is to save both data and analysis results as objects. An object can be a set of numbers, a character vector, a data table, a set of model parameters, or a complete fitting model.

```r
monthly_demand <- c(108, 121, 117, 132, 128, 141)
mean(monthly_demand)
sd(monthly_demand)
```

Vectors are the basis for many R operations. Compared with processing data one by one, vectorized expressions are often more concise and closer to the statistical problem itself.

```r
monthly_demand > 125
monthly_demand[monthly_demand > 125]
```

The more common data structure for actual analysis is the data frame or tibble. Each row represents a unit of observation and each column represents a variable. This structure of "rows are observations and columns are variables" also provides a unified interface for subsequent visualization, regression and machine learning.

```r
subscriptions <- tibble::tibble(
  customer_id = 1001:1006,
  tenure_months = c(4, 18, 9, 31, 7, 24),
  monthly_spend = c(59, 82, 65, 104, 52, 91),
  service_calls = c(5, 1, 3, 0, 6, 2),
  churned = c("Churn", "Stay", "Stay", "Stay", "Churn", "Stay")
)
```

These six lines are only used to make the syntax easy to see. When actually performing resampling, cross-validation, and model comparison, you need to use modeling data that is large enough to represent the target scenario, rather than treating this small table as a training set.

A habit worth establishing is to confirm the type, length, dimensions and missing conditions of objects at any time.

```r
class(subscriptions)
dim(subscriptions)
str(subscriptions)
summary(subscriptions)
```

### Indices and logical conditions

Logical vectors in R can be used directly for filtering. Next, first generate a set of TRUE/FALSE, and then use it to select high-spending customers.

```r
high_spend <- subscriptions$monthly_spend >= 80
subscriptions[high_spend, ]
```

Be especially careful when encountering missing values. The comparison operation may return `NA`, but `NA` is not FALSE. Before formal screening, you should first confirm how to deal with missing values. You cannot default to treating "unknown" as "conditions are not met".

### Functions, conditions, and recurring tasks

When the same processing needs to occur repeatedly, give priority to functions instead of copying and pasting multiple similar pieces of code.

```r
coefficient_of_variation <- function(x) {
  sd(x, na.rm = TRUE) / mean(x, na.rm = TRUE)
}

coefficient_of_variation(monthly_demand)
```

Conditional judgment is suitable for clearly written rules, such as making a simple classification of demand fluctuations.

```r
cv <- coefficient_of_variation(monthly_demand)

if (cv < 0.10) {
  "Low variability"
} else if (cv < 0.25) {
  "Moderate variability"
} else {
  "High variability"
}
```

The most valuable functions in an analysis script tend to be uncomplicated. Splitting "reading data, cleaning fields, calculating indicators, drawing graphs, and training models" into small functions can make the entire analysis easier to check and rerun.

### The tidyverse provides a consistent analytical grammar

`dplyr` organizes common data processing tasks into a set of verbs with clear semantics: `filter()` Select rows, `select()` Select columns, `mutate()` Create or modify variables, `summarise()` Calculates summary, `group_by()` defines grouping.

```r
library(tidyverse)

subscriptions |>
  filter(monthly_spend >= 60) |>
  mutate(call_rate = service_calls / pmax(tenure_months, 1)) |>
  group_by(churned) |>
  summarise(
    customers = n(),
    avg_spend = mean(monthly_spend),
    avg_call_rate = mean(call_rate),
    .groups = "drop"
  )
```

The purpose of the pipe character `|>` is not to make the code more complex, but to write the sequence of operations in a process that people can follow. Data enters from the left and is filtered, transformed, grouped and summarized in sequence.

### Resolve data types during import

After data from CSV, Excel and database enter R, you must first confirm whether the type is correct. Dates being read as characters, amounts being read as text, and categorical variables being mistaken for numbers can create hidden problems in subsequent analyses.

```r
orders <- readr::read_csv(
  "data/orders.csv",
  col_types = cols(
    order_id = col_integer(),
    order_date = col_date(),
    customer_id = col_integer(),
    order_value = col_double()
  )
)
```

Data import is not as simple as "opening a file". It determines what semantics are used for subsequent calculations, so column types, missing value encodings, and date formats should be considered part of the analysis.

## Part Two: Visualisation begins with the shape of the data

### Inspect the distribution before the mean

An average can only describe the center position and cannot tell the reader whether the distribution is skewed, has multiple peaks, has a long tail or extreme values. When beginning the analysis of continuous variables, histograms, density plots, and empirical cumulative distribution functions are often more informative than printing the mean alone.

```r
orders |>
  ggplot(aes(order_value)) +
  geom_histogram(bins = 30)
```

The shape of the histogram is affected by bin width. If the binning is too narrow, it is easy to amplify random fluctuations, and if the binning is too wide, multiple structures may be merged. Density maps have a similar problem, except that the control parameter becomes bandwidth.

```r
orders |>
  ggplot(aes(order_value)) +
  geom_density()
```

The vertical axis of the density curve is not "the probability of a certain value occurring." For continuous variables, the probability corresponds to the area under a certain interval, and the area under the entire density curve is 1.

### Use the eCDF to read cumulative proportions

The empirical cumulative distribution function is written as:

\[
F(a)=\frac{\#\{x_i\le a\}}{n}
\]

It directly answers "What proportion of the sample does not exceed the threshold \(a\)". eCDF is very suitable for answering SLA or quantile questions on business variables such as service time, delivery time, order amount, etc.

```r
orders |>
  ggplot(aes(order_value)) +
  stat_ecdf()
```

For example, when `F(500)=0.82`, it can be said that the order amount of approximately 82% is not higher than 500. This explanation is more straightforward than "What is the density near 500?"

### Quantiles, boxplots, and outliers

The median is the 50% quantile, interquartile range:

\[
IQR=Q_{0.75}-Q_{0.25}
\]

Able to describe the span of intermediate 50% data. Boxplots commonly use the \(1.5\times IQR\) rule to mark observations far away from the box, but these points can only be called "extreme observations that need to be checked" and cannot be automatically determined as erroneous data.

```r
orders |>
  ggplot(aes(x = region, y = order_value)) +
  geom_boxplot()
```

A large order may be an entry error, or it may be a real large customer transaction. Before removing outliers, you need to understand the data generation process.

### Use grouped graphics to expose aggregation effects

The overall data looks stable, but that doesn't mean it's stable for every customer segment, region or channel. Grouped boxplots, violin plots, and faceting can help determine whether the overall structure is a mixture of different subpopulations.

```r
subscriptions |>
  ggplot(aes(churned, monthly_spend)) +
  geom_boxplot()
```

If there are obvious differences between different groups, the subsequent regression model or classification model needs to consider this group information. Visualization is not a decoration at the end of the report, but a diagnostic tool before the model is set.

### Inspect the scatter plot before calculating correlation

The correlation coefficient can compress the linear relationship between two variables, but it cannot show nonlinearity, grouping structure, and extreme points.

```r
subscriptions |>
  ggplot(aes(tenure_months, monthly_spend, colour = churned)) +
  geom_point()
```

The same correlation coefficient can correspond to completely different scatter structures. After seeing a high correlation coefficient, you should still look at the scatter plot to decide whether a linear relationship is a reasonable summary.

## Part Three: Data preparation determines model credibility

### Tidy data provides a stable analytical interface

A data table suitable for analysis usually has one column for each variable, one row for each observation, and one table for each observation unit. This rule seems simple, but many business documents will spread the months horizontally, stuff multiple indicators into one field, or split the header into two or three layers.

`pivot_longer()` and `pivot_wider()` are used to convert between wide and long tables.

```r
monthly_sales_long <- monthly_sales |>
  pivot_longer(
    cols = starts_with("2026_"),
    names_to = "month",
    values_to = "sales"
  )
```

Long tables are generally better suited for `ggplot2`, group statistics, and model formulas because the same kind of variables are grouped together in the same column.

### Confirm the key and granularity before joining

The most dangerous problem with joining tables is often not syntax, but inconsistent granularity. The customer table has one customer per row, and the order table has one order per row. If you connect another table with "one order details per row", the number of rows may expand rapidly.

```r
customers |>
  left_join(orders, by = "customer_id")
```

At least three things should be confirmed before joining: whether the connection key is unique, what is the observation unit of the two tables, and how many rows are expected after the join. Otherwise duplicate rows can silently change the mean, total, and even training sample weights.

### Missing values are not one uniform problem

`NA` just means "a value is missing here" and does not explain why it is missing. Omissions may result from not being recorded, not occurring, not applicable, system errors or selective omissions. These mechanisms have completely different effects on statistical inference and predictive models.

The simplest analysis can start by checking:

```r
subscriptions |>
  summarise(across(everything(), ~ sum(is.na(.x))))
```

But in the formal model, `na.rm = TRUE` cannot be regarded as the default solution. Removing missing records changes the sample composition; imputing with the mean suppresses variation and may destroy the relationship between variables. The approach should be determined by the data generation process and the prediction scenario.

### Handle dates, text and categorical variables explicitly

Dates are not strings, and categories should not be arbitrarily encoded as consecutive numbers. Only after converting fields to the correct type can the meaning of models and charts be stable.

```r
orders <- orders |>
  mutate(
    order_month = lubridate::floor_date(order_date, "month"),
    channel = factor(channel),
    region = factor(region)
  )
```

For text fields, regular expressions are good for extracting information with a stable format, but don't write ad hoc string rules as uninterpretable black boxes. It is best to explain why each step of transformation is needed, what the input is, and what the output should look like.

### Check for information leakage before modelling

Data leaks occur when models are trained using information that is not available at the time of the actual prediction. For example, if you want to predict whether a customer will churn next month, but put the "account closure date" into the feature; or use all data to calculate the standardized mean before dividing the test set.

Leaky models tend to have exceptionally beautiful validation scores, but quickly expire after they go live. For each feature in the modeling table, one question should be asked: Is this field already available at the moment the prediction is actually issued?

## Part Four: Statistical analysis combines patterns with uncertainty

### Distinguish samples, populations, parameters and estimators

Statistical inference uses a sample to draw carefully qualified conclusions about a larger population.

Population quantities of interest that are usually unobservable are parameters, such as the population mean order value \(\mu\). The sample mean \(\bar X\) is an estimator of that parameter.

\[
\bar X=\frac{1}{n}\sum_{i=1}^{n}X_i
\]

A different random sample will usually produce a different \(\bar X\). An estimate therefore needs both a point value and a measure of uncertainty.

### Standard error describes sampling variation

If the observations are independently and identically distributed, the standard error of the sample mean can be approximately written as:

\[
SE(\bar X)=\frac{s}{\sqrt n}
\]

Here \(s\) is the sample standard deviation. As the sample size increases, the standard errors shrink by \(1/\sqrt n\). This also explains why quadrupling the sample size roughly cuts the standard error in half, rather than shrinking it to a quarter.

Standard deviation and standard error are often confused: standard deviation describes the dispersion of individual data, and standard error describes how much an estimator fluctuates across repeated samples.

### The central limit theorem connects sample means to normal approximation

Under wider conditions, when the sample size is large enough, the standardized sample mean will approach the standard normal distribution:

\[
\frac{\bar X-\mu}{\sigma/\sqrt n}\approx N(0,1)
\]

This result does not require that the original data itself must obey a normal distribution. It discusses the sampling distribution of the sample mean. When the raw data are highly skewed or have heavy tails, reaching a "large enough" sample size may require more observations, so the central limit theorem cannot be taken as a license to ignore the shape of the data.

### Confidence intervals express estimation precision

The common large sample 95% confidence interval is written as:

\[
\hat\theta \pm 1.96\times SE(\hat\theta)
\]

For the sample mean:

\[
\bar X \pm 1.96\frac{s}{\sqrt n}
\]

The frequentist interpretation of 95% is that if the same process of sampling and constructing intervals is performed repeatedly, approximately 95% of the interval will cover the true parameters in the long run. It is not a direct probability statement that "the true parameter has a probability of 95% falling within the calculated interval."

When the sample is small and the population variance is unknown, the mean interval usually uses the t distribution rather than the fixed 1.96. As the data structure becomes more complex, the standard errors and intervals will also change with the sampling design, model, and related structures.

### Hypothesis testing requires more than a p-value

Hypothesis testing usually starts with a null hypothesis, such as:

\[
H_0:\mu_A-\mu_B=0
\]

The test statistic measures how far an observation is from the null hypothesis, and the p-value measures the probability of obtaining the same or more extreme result if the null hypothesis is true and the test hypothesis is met.

A small p-value does not mean that the effect is large, nor does it mean that the model has practical value. When the sample is large enough, very small differences may reach statistical significance. A more complete report would look at both effect sizes, standard errors, confidence intervals, and operational scales.

If an analysis is examining dozens or even hundreds of hypotheses simultaneously, you also need to consider the false positive inflation caused by multiple comparisons, rather than continuing to use separate 0.05 thresholds for each test.

### Bootstrap approximates sampling distribution with data

When the theoretical standard error is difficult to derive directly, you can repeatedly sample from the original sample with replacement, calculate the statistics on each bootstrap sample, and use these repeated results to approximate the sampling distribution of the estimator.

```r
set.seed(2026)

boot_means <- replicate(
  2000,
  mean(sample(monthly_demand, replace = TRUE))
)

sd(boot_means)
quantile(boot_means, c(0.025, 0.975))
```

Bootstrap is useful, but it can't fix severely skewed original samples. If the original data are not representative of the target population, repeated sampling will simply replicate the same set of biases over and over again. Time series, cluster sampling, or strongly dependent data also cannot mechanically resample each row as an independent observation.

### Conditional expectation is central to regression

Simple linear regression writes the conditional mean of the outcome variable as:

\[
E(Y\mid X=x)=\beta_0+\beta_1x
\]

The fitted model gives:

\[
\hat Y=\hat\beta_0+\hat\beta_1X
\]

The slope \(\hat\beta_1\) indicates how much the average level of Y is expected to change for each unit increase in X, within the model specifications and data range.

```r
model <- lm(monthly_spend ~ tenure_months, data = subscriptions)
summary(model)
```

The regression line describes the average relationship and does not guarantee that every observation is close to the fitted line. Residuals:

\[
e_i=y_i-\hat y_i
\]

The parts that are not explained by the model are recorded and are also the main objects of subsequent diagnosis.

### R² is not a complete model-quality score

\[
R^2=1-\frac{SSE}{SST}
\]

R² describes how much of the variation in the outcome variable in the sample is explained by the current linear model. It cannot independently answer causality, residual structure, extrapolation risk, and out-of-sample forecast performance.

A high R² model may simply capture a time trend, or it may be driven by a few extreme points; a low R² model may still provide useful average effect estimates in noisy business scenarios.

### Multiple regression requires conditional interpretation

The multivariate linear model is written as:

\[
E(Y\mid X_1,\ldots,X_p)=\beta_0+\beta_1X_1+\cdots+\beta_pX_p
\]

One of the coefficients is interpreted with the condition that "other variables remain unchanged". For example:

```r
model_multi <- lm(
  monthly_spend ~ tenure_months + service_calls + region,
  data = subscriptions
)
```

The coefficient of `service_calls` describes the average correlation between the number of service contacts and monthly consumption when tenure and region are the same. This conditional interpretation is different from the simple correlation coefficient.

At the same time, you need to pay attention to collinearity. If two predictors are highly correlated, the model may still be good at "jointly predicting", but the individual coefficients will become unstable, the standard errors will increase, and the sign may even change across samples.

### Logistic regression maps linear predictions to probabilities

In a binary classification problem, conditional probabilities can be modeled through logit links:

\[
\log\left(\frac{p(x)}{1-p(x)}\right)
=\beta_0+\beta_1x_1+\cdots+\beta_px_p
\]

in:

\[
p(x)=P(Y=1\mid X=x)
\]

If the goal is to directly fit the probability of "customer churn", the clearest approach is to first explicitly encode the event class as 1:

```r
subscriptions <- subscriptions |>
  mutate(churn_flag = if_else(churned == "Churn", 1, 0))

logit_fit <- glm(
  churn_flag ~ tenure_months + monthly_spend + service_calls,
  data = subscriptions,
  family = binomial()
)
```

In this way, `predict(logit_fit, type = "response")` corresponds to `churn_flag = 1`, which is the churn probability. There is another advantage of explicitly using 0/1 here: the order of factor levels will not be mistaken for event definitions. If the two-level factor is directly passed to R's binomial `glm()`, the first level will be treated as failure, and the remaining levels will be treated as success, so the level order must be actively checked.

Logistic regression first gives probabilities and then becomes categories through thresholds. The threshold is not the "only right answer" automatically provided by the model, it should be chosen based on the business cost of false negatives and false positives.

### Association does not automatically imply causation

After controlling for some variables, regression still does not mean that all confounding factors have been eliminated. Coefficients in observed data should first be interpreted as conditional associations.

Causal inference requires stronger designs and assumptions, such as randomized trials, natural experiments, or explicit identification strategies. As long as the research question is "Does changing X cause Y to change?" you cannot make conclusions based on significant coefficients alone.

### High-dimensional data requires reduction or regularisation

Ordinary least squares becomes unstable when there are many predictors, even when \(p\) approaches or exceeds the sample size \(n\). High-dimensional analysis often requires matrix representation, dimensionality reduction, or regularization.

PCA finds the orthogonal direction with the largest explained variance from a linear combination of the original variables:

\[
Z_1=a_{11}X_1+a_{12}X_2+\cdots+a_{1p}X_p
\]

The function of principal components is to compress a large number of related variables into a few new coordinate axes, but "the largest explained variance" does not mean "the best prediction of the target variable". PCA itself is unsupervised dimensionality reduction and does not use the outcome variable Y.

Regularization directly modifies the fitting objective. For example, Ridge regression adds an L2 penalty in addition to the least squares loss:

\[
\sum_i(y_i-\hat y_i)^2+\lambda\sum_j\beta_j^2
\]

Lasso uses L1 penalty:

\[
\sum_i(y_i-\hat y_i)^2+\lambda\sum_j|\beta_j|
\]

As \(\lambda\) increases, the coefficients are more strongly shrunk. Ridge usually keeps all variables but reduces the coefficients; Lasso can push some coefficients to 0, so it also has a variable selection effect. The penalty intensity cannot be determined based on training error and should be selected using out-of-sample methods such as cross-validation.

Before regularization, you usually also need to pay attention to the feature scale. If the variables have very different dimensions, the penalty can have an unfair effect on the coefficients, so many implementations center and standardize the predictor variables first.

## Part Five: Predictive algorithms must generalise to new data

### Define the prediction task and loss function first

Machine learning is not about choosing an algorithm first and then looking for problems. It is necessary to first clarify: what the outcome variable is, at what point in time the prediction will occur, what decisions will be triggered by the prediction results, and which error is the most costly.

Commonly used mean square errors for continuous results:

\[
MSE=\frac{1}{n}\sum_{i=1}^{n}(y_i-\hat y_i)^2
\]

Classification problems require a confusion matrix. The second classification can be written as:

|                     | Actual Positive | Actual Negative |
| ------------------- | --------------: | --------------: |
| Prediction Positive |              TP |              FP |
| Predict Negative    |              FN |              TN |

Commonly used indicators include:

\[
Accuracy=\frac{TP+TN}{TP+TN+FP+FN}
\]

\[
Sensitivity=Recall=\frac{TP}{TP+FN}
\]

\[
Specificity=\frac{TN}{TN+FP}
\]

\[
Precision=\frac{TP}{TP+FP}
\]

\[
F_1=2\frac{Precision\times Recall}{Precision+Recall}
\]

Accuracy can be very misleading when there are few positive classes. A model that “predicts all negatives” may also achieve very high accuracy. At this time, you should look at the sensitivity, precision, F1, ROC or precision-recall curves, and interpret them in conjunction with the positive prevalence.

<div data-learning-slot="prediction-threshold-lab"></div>

### Training and test sets have distinct roles

The training data is used to estimate the model and select parameters, and the test data is used to simulate the model's performance when faced with real new data. Once a test set has been viewed frequently and participated in model tuning, it is no longer an independent test set.

The following code assumes that `customer_model_df` is a modeling table that has completed field definitions and has sufficient sample size. For two-category evaluation, the event class is explicitly placed at the first level of factor, and the subsequent caret indicators will use `Churn` as the attention category.

```r
library(caret)

customer_model_df <- customer_model_df |>
  mutate(churned = factor(churned, levels = c("Churn", "Stay")))

set.seed(2026)
index <- createDataPartition(
  customer_model_df$churned,
  p = 0.80,
  list = FALSE
)

train_df <- customer_model_df[index, ]
test_df <- customer_model_df[-index, ]
```

For time series, customer life cycle or data collected in batches, random segmentation may not be reasonable. If future data occurs after past data, chronological segmentation should be used first to avoid leaking future information into the training stage.

### Overfitting comes from "the model fits the training data too closely"

Training error generally decreases as model complexity increases, but test error does not decrease indefinitely. When the model is too simple, there will be a high bias; when the model is too flexible, random noise may be regarded as a rule, resulting in an increase in variance.

Many methods in machine learning deal with this set of trade-offs:

- kNN uses the number of neighbors \(k\) to control the smoothness;
- Decision trees use depth, leaf node size, etc. to control complexity;
- Random forest reduces the instability of a single tree by averaging multiple random trees;
- Ridge/Lasso uses penalty intensity to control coefficient scale;
- PCA controls the representation dimension by retaining the number of principal components.

So "more complex" does not equal "stronger". A new algorithm's complexity is only justified if it consistently outperforms a simple baseline in independent evaluations.

### Cross-validation supports model selection

k-fold cross-validation divides the training data into \(k\) parts. Each time one of them is used for verification, and the remaining \(k-1\) are used to train the model. After the rotation is completed, the verification results are averaged.

If you want to choose the number of neighbors for a kNN, you can compare multiple candidate values. Candidate k cannot be larger than the sample size actually available for each resampled training compromise, so the grid should be set according to the data size.

```r
control <- trainControl(method = "cv", number = 5)

grid <- data.frame(k = c(5, 9, 15, 21, 31))

knn_fit <- train(
  churned ~ tenure_months + monthly_spend + service_calls,
  data = train_df,
  method = "knn",
  preProcess = c("center", "scale"),
  tuneGrid = grid,
  trControl = control
)
```

The most important thing here is not the syntax of `train()`, but that each candidate k must be evaluated with "data not involved in this fitting". Directly selecting k with the highest training accuracy will naturally favor an overly flexible model.

### Learn preprocessing from the training data only

If complete data is used in steps such as standardization, missing value filling, PCA, and feature screening, it is possible to see the test set information in advance, forming a data leakage.

The correct procedure is to first split training/testing, then use only the training set to estimate the mean, standard deviation, imputation rule, or PCA loadings, and then apply the same transformation to the validation and test sets.

This is especially important in high-dimensional models. Even a simple-seeming “remove low-variance variables” contaminates the final evaluation if the threshold is determined by looking at the test set.

### Linear regression and logistic regression are also machine learning baselines

Machine learning does not exclude classical statistical models. Linear regression is suitable for continuous outcomes, and logistic regression is suitable for categorical probabilities. Their advantages are fast training, clear structure, and strong explanation.

If a complex model brings only small out-of-sample improvements but significantly increases deployment, interpretation, and maintenance costs, then linear or logistic regression is often still a better business choice.

### kNN predicts from local neighbourhoods

k-nearest neighbors does not establish a global equation. For a new observation \(x_0\), first find the k nearest observations in the training data, and then use the results of neighbors to do average or majority voting.

In binary classification, the proportion of positive classes among neighbors can be estimated:

\[
\hat p(x_0)=\frac{1}{k}\sum_{i\in N_k(x_0)}y_i
\]

When k is small, the model is more flexible and can easily follow local noise; when k is large, it is smoother and may erase the real local structure. Since distance calculations are scale-sensitive, it is often necessary to standardize predictors before using kNN.

### Naive Bayes, LDA and QDA start from probabilistic models

Another type of classification method calculates the posterior probability through the distribution of predictor variables under each category.

Naive Bayes uses the conditional independence assumption to simplify the joint distribution, so it is computationally efficient and may achieve good prediction results even if the assumption is not completely true.

LDA assumes that different categories share the same covariance structure, so a linear decision boundary is obtained; QDA allows each category to have different covariance matrices, and the boundary is more flexible, but requires the estimation of more parameters. QDA is more likely to produce high variance when the sample size is insufficient.

The starting point of these methods is different from that of logistic regression: Logistic regression directly models the category probability of a given X, while LDA/QDA first describes the distribution of X in each category, and then obtains the posterior probability through the Bayes rule.

### CART builds rules through recursive partitioning

Classification and regression trees divide the feature space into multiple regions by continuously selecting variables and split points. Each leaf node corresponds to a predicted value or class probability.

Tree models are easy to interpret, for example:

```text
service_calls >= 4
├── tenure_months < 10  → 高流失风险
└── tenure_months >= 10 → 中等风险
```

But individual trees are very sensitive to sample perturbations. A small number of record changes may produce different first-level splits, so the stability is usually less than that of ensemble models. Pruning or controlling the size of leaf nodes can limit model complexity.

### Random forests reduce variance with diverse trees

The core of random forest is to introduce two kinds of randomness at the same time: bootstrap samples and random feature subsets. First build many trees that are different from each other, and then average or majority vote their predictions.

The continuous result can be written as:

\[
\hat y=\frac{1}{B}\sum_{b=1}^{B}T_b(x)
\]

Classification tasks can vote on the category predictions of trees, or average the category probabilities output by each tree.

Random forests are generally more stable but less interpretable than individual trees. Variable importance can help understand which features are often involved in effective segmentation, but "important" does not mean "causal".

### caret provides a consistent training interface

Model function parameters vary greatly between different R packages. `caret::train()` provides a unified interface, allowing model comparison to focus more on data segmentation, preprocessing, resampling and hyperparameters, rather than being interrupted by syntax differences in each package.

In the following two-class setting, `Churn` has been placed at the first level of factor, so the Sensitivity, Specificity and ROC of `twoClassSummary` all focus on this event class.

```r
control <- trainControl(
  method = "cv",
  number = 5,
  classProbs = TRUE,
  summaryFunction = twoClassSummary
)

logit_cv <- train(
  churned ~ tenure_months + monthly_spend + service_calls,
  data = train_df,
  method = "glm",
  family = binomial(),
  metric = "ROC",
  trControl = control
)
```

For actual projects, the greatest value of a unified interface is to use the same resampling scheme for model comparison. Otherwise, model A uses 10-fold CV, model B uses training error, and model C uses a random split. The performance numbers in the final table are not comparable.

### Model diagnostics extend beyond a leaderboard

Model evaluation must answer at least four types of questions:

1. **Overall performance**: What is the MSE, AUC, F1 or other core indicators;
2. **Error structure**: Which customer groups, regions, amount ranges or categories are most prone to errors;
3. **Stability**: Whether the results change drastically after changing folds, samples or time windows;
4. **Usability**: Whether the output can be interpreted and executed in a real decision-making process.

For example, a churn model has a high AUC, but if it almost exclusively identifies high-spending customers and performs poorly on low-spending but high-volume customer segments, the overall metric may be masking important business issues.

### ROC and PR curves answer different questions

The ROC curve uses sensitivity and false positive rate at different thresholds to form a curve, and AUC measures the model's ability to sort random positive and negative samples.

The Precision-recall curve directly focuses on the quality of positive predictions and positive class recall. When positive classes are very rare, PR curves often better reflect the performance that the business really cares about than ROC.

Therefore, imbalanced classification cannot only report Accuracy, nor should it be mechanically believed that the higher the AUC, the better. Actual costs after the threshold still need to be assessed individually.

### Calibration and ranking ability are distinct properties

AUC mainly examines sorting ability. A model may do a good job of ranking high-risk customers higher, but outputting 0.8 may not actually mean that approximately 80% of similar customers will have an incident.

If the probabilities feed directly into pricing, resource allocation, or expected revenue calculations, calibration should also be checked. A common practice is to compare predicted probabilities with actual incidence by predicted probability grouping, or to look at calibration curves and Brier scores.

### Ensembles benefit from models that make different errors

Ensemble models combine multiple predictors. Simple methods can either vote for a majority of classes or average the predicted probabilities across models.

If two models almost always make the same judgment, combining them won't bring much new information. The conditions for ensembles to be truly valuable are usually when individual models have certain capabilities, but their errors are not exactly the same.

The reference material illustrates this idea with different supervised learning methods. In actual business, logistic regression, tree models and other methods can also be compared in the same verification framework to determine whether the combination really improves out-of-sample performance.

### Unsupervised learning still requires a definition of success

Clustering differs from supervised learning in that there are no known labels as training targets. The algorithm organizes observations based solely on similarities in feature space.

k-means finds K clusters by minimizing the squared distance within clusters:

\[
\sum_{k=1}^{K}\sum_{i\in C_k}\|x_i-\mu_k\|^2
\]

It is sensitive to scale and initial center, so numerical variables often need to be normalized and multiple random initial values ​​used.

```r
x <- scale(customer_features)
set.seed(2026)
km <- kmeans(x, centers = 4, nstart = 30)
```

K itself is not a truth automatically determined by the algorithm. You can refer to internal indicators such as within-cluster sum of squares and silhouette, but ultimately it still depends on whether the grouping is stable, interpretable, and corresponds to actual executable customer or operational strategies.

The clustering results cannot be directly labeled with business labels such as "high-value customers" and "lost customers" just because the algorithm runs successfully. First check the differences between each cluster on the real variables, and then judge whether this grouping is stable, interpretable and actionable.

### A reliable predictive-modelling sequence

When facing a new prediction task, you can proceed in the following order:

1. Clarify the prediction objects, prediction time points and outcome variables;
2. Check what each row represents and rule out obvious data leaks;
3. View distribution, missingness, outliers, and variable relationships;
4. First establish a simple baseline model;
5. Design training, validation and final testing protocols;
6. Put preprocessing into the training process;
7. Use cross-validation to select hyperparameters;
8. Compare multiple structurally different models;
9. Select classification thresholds based on business costs;
10. Only perform one final evaluation on a test set that has never participated in parameter tuning;
11. Examine errors on a population-by-population basis rather than just looking at aggregate metrics;
12. Save the data version, code, model parameters and evaluation results to ensure that you can rerun it later.

This order is much more reliable than "run all the algorithms first and then pick the one with the highest accuracy." What predictive modeling is really about optimizing is the quality of decisions on new data, not pretty numbers on a training set.

## Statistical analysis and machine learning form a continuum

Statistical analysis usually places more emphasis on parameters, estimates, uncertainties, and interpretation; machine learning places more emphasis on prediction errors, resampling, model selection, and generalization. But both share a lot of core ideas: conditional expectations, loss functions, bias and variance, sampling fluctuations, regularization, and model diagnosis.

Linear regression can be used to explain average relationships and can also be used as a prediction algorithm; Bootstrap can both estimate standard errors and become a sampling mechanism in ensemble learning; cross-validation can both adjust machine learning hyperparameters and compare the out-of-sample performance of regression models.

What really matters is not whether to label a method "statistical" or "machine learning," but rather what kind of evidence is required for the question at hand. When the effect of variables needs to be explained, coefficients and intervals are important; when it is necessary to predict future records, out-of-sample evaluation and data leakage control are more important; when the analysis needs to be handed over to others for review, a reproducible project structure becomes a core requirement.

Reliable analytics in production environments are often the result of these capabilities working together.

## References and licences

The knowledge structure of this note refers to Rafael A. Irizarry's _Introduction to Data Science: Data Analysis and Prediction Algorithms with R_ and its new two-volume online content, focusing on absorbing the teaching sequence about R, data visualization, statistical inference, linear models, high-dimensional data, model evaluation, resampling, supervised learning and clustering.

Reference site: <https://rafalab.dfci.harvard.edu/dsbook/>; New version of statistics and forecasting section: <https://rafalab.dfci.harvard.edu/dsbook-part-2/>. Original material licensed under CC BY-NC-SA 4.0. This page is a reorganized and rewritten study note. The cases, explanatory text and interactive content are all remade according to the knowledge system of this site; the adapted parts involving the ideas and structure of the original material follow the same licensing requirements.
