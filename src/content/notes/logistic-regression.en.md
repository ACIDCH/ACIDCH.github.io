---
translationKey: logistic-regression
locale: en
slug: logistic-regression
title: Logistic Regression
summary: For binary outcomes, connect probability and odds to logistic coefficients, odds ratios, predicted probabilities and classification thresholds without treating classification as the model's only purpose.
tags:
  - logistic regression
  - odds ratios
  - classification thresholds
  - binary outcomes
topics:
  - Regression Modelling
  - Classification Modelling
  - Machine Learning
tools:
  - R
  - glm
series: Regression Modelling
seriesSlug: regression
order: 7
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects:
  - customer-churn-machine-learning
relatedNotes:
  - regression-feature-selection
  - descriptive-statistics
---

## When an outcome is 0 or 1, the modelling problem changes

Many business outcomes have two states rather than a continuous value: a customer churns or stays, an order is delayed or on time, equipment fails or remains operational, and an applicant defaults or repays.

For these outcomes, Y takes only 0 and 1:

\[
Y\in\{0,1\}
\]

What really needs to be estimated is not a continuous mean that can increase or decrease infinitely, but the probability of an event occurring:

\[
P(Y=1\mid X)=p(X)
\]

Ordinary linear regression can produce predictions below 0 or above 1, and its error variance changes with the probability. It may support rough exploration, but it is not a natural model for binary outcomes.

The approach of logistic regression is to first convert the probability to a scale that can fall on the entire real axis.

## From probability to odds

Assume that the probability of a customer churn is 0.8, then the probability of not churn is 0.2.

Odds is defined as:

\[
odds=\frac{p}{1-p}
\]

so:

```text
p = 0.80
odds = 0.80 / 0.20 = 4
```

Meaning the relative chances of the event happening and not happening are 4:1.

The probability 0.5 corresponds to odds=1; when the probability is less than 0.5, odds<1; when the probability is greater than 0.5, odds>1.

Odds and probability can be converted to each other:

\[
p=\frac{odds}{1+odds}
\]

This transformation is the first step in understanding the logistic regression coefficients.

## Log-odds map probabilities from 0 to 1 onto the real number line

Probabilities lie between 0 and 1, while odds range from 0 to positive infinity. Taking the logarithm of the odds gives the log-odds:

\[
\log\left(\frac{p}{1-p}\right)
\]

It can take any real number.

Logistic regression writes this quantity as a linear combination of explanatory variables:

\[
\log\left(\frac{p}{1-p}\right)=\beta_0+\beta_1X_1+\cdots+\beta_pX_p
\]

This is the logit link.

The right side is still a linear predictor, but after the back transformation, the final probability forms an S-shaped curve and always stays between 0 and 1.

<div data-learning-slot="logistic-regression-lab"></div>

## A coefficient is not a constant change in probability

In linear regression, the slope can often be expressed directly as the average increase in Y. This is not the case with logistic regression.

\(\beta_j\) means that a 1-unit increase in Xj changes the **log-odds** by \(\beta_j\), holding the other predictors constant. Because this scale is difficult to interpret directly, coefficients are commonly exponentiated:

\[
OR=e^{\beta_j}
\]

Get odds ratio.

Suppose a coefficient is:

\[
\beta_j=0.693
\]

So:

\[
e^{0.693}\approx2
\]

It can be said that when other variables in the model remain unchanged, when Xj increases by 1 units, the corresponding odds become approximately 2 times.

Note that this is not "doubling the probability." Odds and probability are not on the same scale.

## The same odds ratio has different effects at different baseline probabilities

Suppose the odds double.

If the original probability is only 0.10:

```text
odds = 0.10 / 0.90 = 0.111
翻倍后 odds = 0.222
新概率 ≈ 0.182
```

The probability goes from 10% to about 18.2%.

If the original probability is 0.50:

```text
odds = 1
翻倍后 odds = 2
新概率 = 2 / 3 ≈ 0.667
```

The probability goes from 50% to about 66.7%.

So odds ratios are great for describing multiplicative changes, but if you end up making business decisions, you usually have to convert the results back into probabilities.

## From log-odds to predicted probability

First calculate the linear predictor:

\[
\eta=\beta_0+\beta_1X_1+\cdots+\beta_pX_p
\]

Then convert the probability back through the logistic function:

\[
p=\frac{1}{1+e^{-\eta}}
\]

Probabilities can be obtained directly in R:

```r
model <- glm(churn ~ tenure + monthly_charge,
             data = customer_df,
             family = binomial())

prob <- predict(model, type = "response")
```

`type = "response"` returns probabilities, not log-odds.

To inspect the model coefficients:

```r
coef(model)
```

To inspect the odds ratios:

```r
exp(coef(model))
```

## Probability and classification labels are two different things

The native output of logistic regression is probability. To turn the probability into the 0/1 classification, you also need to manually select the threshold.

The most common is 0.5:

```r
pred_class <- ifelse(prob >= 0.5, 1, 0)
```

But 0.5 has no natural business priority.

Assuming that when identifying churn customers, it is very costly to miss a customer who will actually churn, then the threshold may need to be lowered to make the model more willing to judge it as a positive category. Conversely, if every intervention is expensive, the threshold may need to be raised.

Therefore, the threshold is not the model's "calculated final answer," but rather the connection point between model probabilities and business costs.

## Thresholds trade one error type against another

The two classification results can be organized into a confusion matrix:

```text
                Actual 1   Actual 0
Predicted 1        TP         FP
Predicted 0        FN         TN
```

Lowering the threshold typically:

- As more positive classes are found, TP increases;
- At the same time, there will be more false alarms and FP will increase;
- FN usually decreases.

Raising the threshold tends to do the opposite.

This is a common trade-off between sensitivity/recall and specificity.

It is easy to ignore business costs simply by pursuing accuracy. If there are very few positive classes, and all predictions are 0, it is possible to obtain very high accuracy, but completely lose the recognition ability.

## Significant coefficients do not guarantee useful classification

Logistic regression still allows you to make statistical inferences about coefficients, viewing standard errors, z-statistics, p-values, and confidence intervals.

Statistical evidence for a coefficient and strong classification performance are different claims.

Coefficient inference focuses on whether there is evidence for the relationship between variables and log-odds; predictive evaluation is more concerned with classification results after probability ranking, calibration, and thresholding.

Therefore, classification models typically also need to look at:

- ROC / AUC；
- precision and recall;
- confusion matrix；
- calibration；
- Business costs at different thresholds.

These metrics answer different questions and should not be reduced to whichever number looks best.

## Separate probability calibration from ranking ability

A model might be very good at ranking high-risk customers at the top, but estimate overall probabilities too high or too low.

For example, the true churn rate is approximately 20%, but the model often gives a probability of 50% to 70%. Its ranking ability may be good, but the probabilities themselves are not trustworthy enough.

If probabilities are to go into budgeting, capacity planning, or risk pricing, calibration is important.

The evaluation method depends on whether the application needs only a risk ranking or well-calibrated probability estimates.

## Class imbalance requires more than default accuracy

If the proportion of positive classes is very low, for example, the failure rate is only 2%, both model training and evaluation need to be more careful.

At this time:

- Accuracy can easily be inflated;
- The default 0.5 threshold may barely predict positive classes;
- precision and recall are more worth looking at individually;
- PR curve sometimes reflects minority class performance better than ROC;
- The threshold needs to be set in conjunction with actual intervention capabilities.

Class imbalance cannot be solved simply by duplicating minority-class observations. Define the operational objective and evaluation metrics first, then decide whether resampling or class weighting is justified.

## A practical logistic-regression workflow

1. First confirm that Y is really a binary result and clarify what 1 represents;
2. Look at the direction of the coefficient, and then use odds ratio to explain the relative change;
3. Convert key cases into predicted probabilities to avoid just log-odds;
4. Check the confidence interval to confirm whether the coefficient estimate is stable;
5. Evaluate probabilistic models using AUC, precision, recall, and calibration;
6. Select the classification threshold based on the actual cost of FP and FN;
7. Finally check how the model performs on new data.

The most valuable part of logistic regression is not to separate 0 and 1, but to write the relationship between explanatory variables and event probability into a model that can be explained, evaluated, and can actually be used for decision-making.
