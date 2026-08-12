---
translationKey: stat-data-types-scales
locale: en
slug: stat-data-types-scales
title: Data Types and Measurement Scales
summary: Start with the business meaning of each field, distinguish quantities, categories, ordered levels and dates, then choose defensible summaries, visualisations and models.
tags:
  - statistics
  - data types
  - R
topics:
  - R and Statistics
  - Data Understanding
  - Data Quality
tools:
  - R
  - Base R
  - ggplot2
series: R and Statistics
seriesSlug: r-statistics
order: 2
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - descriptive-statistics
---

## Why determine the variable type first?

A column that looks numerical does not necessarily support arithmetic. Customer number `10017`, warehouse code `3`, satisfaction level `1–5`, and monthly sales `125000` may all be stored as numbers while representing fundamentally different concepts.

The first questions are: **What does this field record? Which comparisons are valid? Do differences or ratios have a practical meaning?** The answers determine whether a mean is meaningful, whether ordering is valid, which chart fits and how a statistical model should interpret the field.

Suppose there is a table of customer service data:

```r
service <- data.frame(
  customer_id = c(1001, 1002, 1003, 1004, 1005),
  channel = c("Web", "Store", "Web", "Phone", "Store"),
  satisfaction = c(4, 2, 5, 3, 4),
  waiting_minutes = c(6.4, 18.2, 4.8, 11.1, 7.6),
  resolved = c(TRUE, FALSE, TRUE, TRUE, TRUE),
  visit_time = as.POSIXct(c(
    "2026-07-01 09:10:00", "2026-07-01 10:25:00",
    "2026-07-01 13:40:00", "2026-07-02 08:55:00",
    "2026-07-02 16:20:00"
  ))
)
```

This table already contains identifiers, unordered categories, ordered levels, continuous values, logical variables, and time variables. Whether subsequent analysis is reasonable depends on whether these roles are clearly distinguished.

## Begin by separating categorical and numerical variables

The most commonly used first-level divisions in statistical analysis are categorical and numeric.

**Categorical variables** place records into a finite set of groups, such as channels, regions, product categories or membership levels. Their basic summaries are frequencies and proportions.

```r
table(service$channel)
prop.table(table(service$channel))
```

**Numerical variables** record quantities or measurements, such as order value, waiting time, demand and delivery distance. Common summaries include the mean, median, standard deviation, quantiles and range.

```r
mean(service$waiting_minutes)
median(service$waiting_minutes)
sd(service$waiting_minutes)
```

Mistaking category codes for numerical values can lead to results that are mathematically computable but meaningless from a business perspective. For example, the average of `channel = 1, 2, 3` is equal to 2, which does not mean that "the average channel is the second type".

## Nominal variables have no natural order

Nominal variable only has categorical differences, not high or low order. Channels, cities, payment methods, and product categories all fall into this category.

Factor is usually expressed in R:

```r
service$channel <- factor(service$channel)
levels(service$channel)
```

The internal encoding of factor is integers, but these integers are just storage and cannot be interpreted as numerical distances.

```r
as.integer(service$channel)
```

The above results might be 1, 2, 3, but that doesn't mean 3 is "two units more" than 1. If factor is added to the model, R will establish contrast coding by category, and the coefficient represents the difference relative to a reference category.

### The reference category changes how coefficients are expressed

For example, set Web as the reference category:

```r
service$channel <- relevel(service$channel, ref = "Web")
```

This does not change the data facts, only the direction in which the model coefficients are compared. When you see regression coefficients for categorical variables, you must first confirm the reference level.

## Ordinal variables have an order, but not necessarily equal intervals

Ordinal variables can be sorted, but the distance between adjacent levels is not necessarily the same.

Satisfaction 1–5, credit ratings of low/medium/high and delivery priorities of normal/expedited/urgent are common ordinal variables.

```r
service$satisfaction <- ordered(
  service$satisfaction,
  levels = 1:5
)
```

Ordinal information means that "higher" or "lower" can be discussed, and median and quartile positions can be calculated. But whether the mean should be calculated directly depends on the business explanation.

For example, the psychological gap in satisfaction from 1 to 2 is not necessarily exactly the same as from 4 to 5. Average satisfaction 3.7 is common in reports, but scale spacing should not be assumed to be strictly physically equidistant.

When there are only a few classes, a frequency distribution is usually more informative than a single mean:

```r
prop.table(table(service$satisfaction))
```

## Discrete and continuous values answer different questions

Numeric variables can also be divided into discrete and continuous.

**Discrete values** typically come from counts, such as 17 orders received in a day, 4 equipment failures in a week, or 3 service calls made by customers. Theoretically they can only take on certain discrete values.

**Continuous values** come from measurements, such as 6.4 minutes, 12.7 kilometres, 84.3 kilograms. As long as the measurement accuracy allows, they can take any value within the interval.

This distinction affects probabilistic model and graph selection. Count data are often associated with discrete distributions such as Binomial and Poisson; continuous measurements more commonly use density, quantile, and continuous probability models.

```r
orders_per_day <- c(18, 23, 20, 16, 27, 21)
waiting_time <- c(6.4, 18.2, 4.8, 11.1, 7.6)

class(orders_per_day)
class(waiting_time)
```

R stores both as numeric, but **statistical type comes from the variable's meaning and cannot be determined by `class()` alone.**

## The identifier is not an analytical value

Customer numbers, order numbers, SKUs, and zip codes often consist of numbers, but they are identifiers.

```r
mean(service$customer_id)
```

R will return the results normally, but the mean has no analytical meaning. The primary role of identifiers is to uniquely locate records, connect tables, and track entities, rather than participating in numerical calculations.

It is best to explicitly exclude such fields before modelling to prevent the algorithm from mistaking the number size for some continuous relationship.

A practical check is: **Would the business meaning remain unchanged if the numbers were reassigned?** If so, the field is probably an identifier or category code rather than a quantitative feature.

## Date and time have both order and interval

Dates and times cannot be treated as just strings. The correct date type can do sorting, time difference, monthly summary and period feature construction.

```r
class(service$visit_time)
range(service$visit_time)
difftime(service$visit_time[2], service$visit_time[1], units = "mins")
```

Time variables often carry multiple layers of information at the same time:

- Absolute time point: when the order occurs;
- Time interval: how long it took from order placement to delivery;
- Cycle position: day of week, hour, month;
- Order: Which record is earlier.

Be especially careful when converting dates directly to regular integers and then interpreting the coefficients. The model may be exploiting "days from a point in time", whereas what the business really cares about may be seasonal or weekend effects.

## Measurement scales determine which operations are meaningful

Statistics texts commonly distinguish nominal, ordinal, interval and ratio scales. The framework is valuable because not all numbers support the same mathematical interpretation.

| scale    | Can compare categories | Able to sort | The difference is meaningful | Proportions make sense | Example                  |
| -------- | ---------------------: | -----------: | ---------------------------: | ---------------------: | ------------------------ |
| Nominal  |                    yes |           no |                           no |                     no | Channels, regions        |
| Ordinal  |                    yes |          yes |              not necessarily |                     no | Satisfaction level       |
| Interval |                    yes |          yes |                          yes |                     no | Celsius temperature      |
| Ratio    |                    yes |          yes |                          yes |                    yes | Amount, weight, duration |

Interval scale has equally spaced differences, but the zero point is not "completely absent". Celsius 20°C is 10 degrees higher than 10°C, but you cannot say "it is twice as hot".

The Ratio scale has meaningful zero points, so 20 minutes can indeed be interpreted as twice as long as 10 minutes.

In business data, many amounts, quantities, distances, and durations are close to ratio scale, but scores, indices, and coded fields often are not.

## Variable type determines the choice of chart

Different types of variables are suitable for different graphs.

### One categorical variable

```r
library(ggplot2)

ggplot(service, aes(channel)) +
  geom_bar()
```

The bar graph shows the frequency of each category. There is no continuous distance meaning between the horizontal axes.

### One continuous numerical variable

```r
ggplot(service, aes(waiting_minutes)) +
  geom_histogram(binwidth = 3)
```

Histograms show the shape of a distribution using intervals. It is not a simple category count plot because adjacent bins correspond to continuous numerical intervals.

### A category and a continuous value

```r
ggplot(service, aes(channel, waiting_minutes)) +
  geom_boxplot()
```

The question here becomes: whether the waiting time distribution is different across channels.

### Two continuous values

It is common to look at scatter plots first and then consider correlation or regression. Variable types actually provide a first-level roadmap before model selection.

## Do not convert types merely to make code run

After data is imported, it is often necessary to convert the type:

```r
service$customer_id <- as.character(service$customer_id)
service$resolved <- as.logical(service$resolved)
service$channel <- factor(service$channel)
```

But the reason for conversion should be semantics, not "this function reports an error, so change to a different type."

Common hazards include:

- Convert `"1", "2", "3"` to numeric without confirming whether these values are quantities or codes;
- Treat missing value codes `"N/A"`, `"unknown"` as real categories;
- Put the category factor directly into `as.numeric()`, and you will get the internal level number;
- Sorting date strings in lexicographic order but not parsing them into dates;
- Treat the ordered levels as unordered factors and lose the originally existing order information.

The goal of type cleaning is not to make each column "look neat", but to make the data structure consistent with business meaning.

## A practical data dictionary

Before formal analysis, a short data dictionary can be established for key fields.

| Field           | observation unit | Statistical role | R type         | allowed values  | missing meaning       |
| --------------- | ---------------- | ---------------- | -------------- | --------------- | --------------------- |
| customer_id     | client           | identifier       | character      | unique number   | should not be missing |
| channel         | Service records  | nominal          | factor         | Web/Store/Phone | Unrecorded channel    |
| satisfaction    | Service records  | ordinal          | ordered factor | 1–5             | Unfinished review     |
| waiting_minutes | Service records  | continuous ratio | numeric        | ≥ 0             | Unsuccessful timing   |
| resolved        | Service records  | binary           | logical        | TRUE/FALSE      | Status unknown        |
| visit_time      | Service records  | datetime         | POSIXct        | legal time      | No time recorded      |

This table affects almost all subsequent steps: data quality checks, descriptive statistics, graphics, inference, feature engineering, and model interpretation.

## Common misjudgments

**"If it is a number, calculate the mean."** Category codes make this mistake especially easy.

**"A 1–5 score must be continuous."** It is ordinal by construction. Treating it as approximately continuous requires justification from the scale design and analytical purpose.

**"R displays numeric, so it is a continuous variable."** R class describes the storage method and does not automatically replace statistical judgment.

**"A factor's integer encoding represents real distance."** The internal number is only an index.

**"Dates are only a formatting issue."** Time fields affect sorting, aggregation periods, windows and the risk of information leakage.

## From data type to subsequent statistical analysis

The variable type determines what questions should be asked later.

Continuous outcomes support questions about means, distributions, correlations and linear models. Binary outcomes lead to proportions, odds and logistic regression. Multi-category outcomes begin with frequencies, conditional proportions and contingency tables. Time-ordered records cannot be treated casually as exchangeable independent samples.

Therefore, data types are not a piece of grammatical knowledge at the introductory stage of R, but the first constraint for statistical analysis. Only by first confirming "how this column of data is allowed to be compared" can the following averages, confidence intervals and model coefficients have clear meanings.

## References

For the knowledge structure, refer to Rafael A. Irizarry's _Introduction to Data Science_, especially the data types and factors in R basics, and the distinction between categorical, ordinal, discrete and continuous variables in Data Visualization. The main text, business examples and code have been reorganized.

Reference site: <https://rafalab.dfci.harvard.edu/dsbook-part-1/> . Original material licensed under CC BY-NC-SA 4.0.
