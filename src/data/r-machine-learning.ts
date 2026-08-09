export type MetricKey = "accuracy" | "auc" | "sensitivity" | "specificity";

export interface ModelResult {
  id: string;
  name: string;
  family: string;
  engine: string;
  parameters: string;
  recipe: string;
  accuracy: number;
  auc: number;
  sensitivity: number;
  specificity: number;
}

export const projectBasePath = "/zh/projects/customer-churn-machine-learning/";

export const metricLabels: Record<MetricKey, string> = {
  accuracy: "Accuracy",
  auc: "AUC-ROC",
  sensitivity: "Sensitivity",
  specificity: "Specificity",
};

export const modelResults: ModelResult[] = [
  {
    id: "logistic-regression",
    name: "Logistic Regression",
    family: "线性分类",
    engine: "glm",
    parameters: "默认逻辑回归规格",
    recipe: "Dummy 编码、零方差移除、折内上采样",
    accuracy: 0.8136,
    auc: 0.9024,
    sensitivity: 0.8281,
    specificity: 0.8071,
  },
  {
    id: "naive-bayes",
    name: "Naive Bayes",
    family: "概率分类",
    engine: "klaR",
    parameters: "Laplace smoothness = 1",
    recipe: "保留分类变量、零方差移除、折内上采样",
    accuracy: 0.8098,
    auc: 0.8996,
    sensitivity: 0.8318,
    specificity: 0.7999,
  },
  {
    id: "random-forest",
    name: "Random Forest",
    family: "Bagging 集成",
    engine: "ranger",
    parameters: "500 trees；min_n = 20",
    recipe: "保留分类变量、零方差移除、折内上采样",
    accuracy: 0.8187,
    auc: 0.8964,
    sensitivity: 0.7966,
    specificity: 0.8286,
  },
  {
    id: "lightgbm",
    name: "LightGBM",
    family: "Boosting 集成",
    engine: "lightgbm",
    parameters: "200 trees",
    recipe: "保留分类变量、零方差移除、折内上采样",
    accuracy: 0.8199,
    auc: 0.8955,
    sensitivity: 0.7994,
    specificity: 0.8291,
  },
  {
    id: "xgboost",
    name: "XGBoost",
    family: "Boosting 集成",
    engine: "xgboost",
    parameters: "200 trees；默认 depth 6、learn rate 0.3",
    recipe: "Dummy 编码、零方差移除、折内上采样",
    accuracy: 0.8142,
    auc: 0.8842,
    sensitivity: 0.7632,
    specificity: 0.837,
  },
];

export const pipelineSteps = [
  {
    number: "01",
    title: "数据理解",
    detail: "检查 200,000 条合成客户记录、25 个字段和约 31% 的流失比例。",
  },
  {
    number: "02",
    title: "字段清理",
    detail: "统一单位、百分比、分类字段和二元字段，删除记录标识并定义正类。",
  },
  {
    number: "03",
    title: "变量筛选",
    detail: "排除 Fleet 计划，保留 7 个输入变量，并移除高度相关的注册时长。",
  },
  {
    number: "04",
    title: "训练 / 测试划分",
    detail: "按流失状态进行 80/20 分层划分，测试集在模型选择前保持隔离。",
  },
  {
    number: "05",
    title: "交叉验证样本",
    detail: "从训练部分分层抽取 30,000 行，建立 5 折分层交叉验证。",
  },
  {
    number: "06",
    title: "折内预处理",
    detail: "按模型选择编码方式，并在每个训练折内部将流失类别上采样至 1:1。",
  },
  {
    number: "07",
    title: "五模型比较",
    detail: "用 Accuracy、AUC-ROC、Sensitivity 和 Specificity 比较固定结果。",
  },
  {
    number: "08",
    title: "留出集评价",
    detail: "选择 Logistic Regression 后，在 39,200 条测试记录上完成一次评价。",
  },
  {
    number: "09",
    title: "结果解释",
    detail: "结合混淆矩阵、ROC AUC 和 odds ratio 解释模型边界与主要变量。",
  },
];

export const predictors = [
  { name: "avg_wait_minutes", label: "平均等待时间", type: "数值" },
  { name: "app_crashes_30d", label: "30 天应用崩溃次数", type: "数值" },
  { name: "charger_fault_rate", label: "充电设备故障率", type: "数值" },
  { name: "plan_tier", label: "会员计划", type: "分类" },
  { name: "refund_request_last12w", label: "12 周退款申请", type: "分类" },
  { name: "payment_failure_last4w", label: "4 周支付失败", type: "分类" },
  { name: "weeks_since_last_charge", label: "距上次充电周数", type: "数值" },
];

export const confusionMatrix = {
  trueNegative: 21825,
  falsePositive: 5261,
  falseNegative: 2022,
  truePositive: 10092,
  total: 39200,
  accuracy: 0.8142,
  auc: 0.9053,
  sensitivity: 0.8332,
  specificity: 0.8058,
};

export const oddsRatios = [
  { label: "支付失败", value: 15.9, direction: "risk" },
  { label: "退款申请", value: 2.5, direction: "risk" },
  { label: "距上次充电周数", value: 2.01, direction: "risk" },
  { label: "应用崩溃次数", value: 1.18, direction: "risk" },
  { label: "平均等待时间", value: 1.1, direction: "risk" },
  { label: "设备故障率", value: 1.08, direction: "risk" },
  { label: "Plus 计划", value: 0.62, direction: "protective" },
  { label: "Pro 计划", value: 0.38, direction: "protective" },
] as const;

export const deepDives = [
  {
    slug: "workflow",
    title: "完整建模流程",
    eyebrow: "Technical Deep Dive 01",
    summary: "从字段清理、变量筛选到折内上采样与留出集评价，拆解数据如何进入五个模型。",
    keywords: "R workflow recipe data split preprocessing upsampling 建模流程 数据准备",
  },
  {
    slug: "model-comparison",
    title: "五模型比较",
    eyebrow: "Technical Deep Dive 02",
    summary: "用四项固定交叉验证指标比较线性、概率、Bagging 与 Boosting 模型。",
    keywords:
      "model comparison logistic regression random forest xgboost lightgbm naive bayes 模型比较",
  },
  {
    slug: "neural-network",
    title: "非线性分类神经网络",
    eyebrow: "Technical Deep Dive 03",
    summary:
      "独立二维分类实验：两个输入、一层两个隐藏节点和二分类输出，结构与客户流失模型结果分开。",
    keywords:
      "neural network nnet mlp supervised learning classification 神经网络 监督学习 分类",
  },
  {
    slug: "prediction-evaluation",
    title: "预测与评估",
    eyebrow: "Technical Deep Dive 04",
    summary: "检查 39,200 条留出记录的混淆矩阵、AUC 与 odds ratio，解释漏判和误报。",
    keywords:
      "prediction evaluation confusion matrix roc auc odds ratio 预测 评估 混淆矩阵",
  },
];

export const codeSnippets = {
  variableSelection: {
    title: "筛选 7 个输入变量",
    code: `PRED_VARS <- c(
  "avg_wait_minutes",
  "app_crashes_30d",
  "charger_fault_rate",
  "plan_tier",
  "refund_request_last12w",
  "payment_failure_last4w",
  "weeks_since_last_charge"
)

df_full <- data_model_prep |>
  select(all_of(c(PRED_VARS, "churn")))`,
  },
  split: {
    title: "分层训练 / 测试划分",
    code: `set.seed(404713359)

data_split <- initial_split(
  df_full,
  prop = 0.80,
  strata = churn
)

train_full <- training(data_split)
test_data <- testing(data_split)`,
  },
  crossValidation: {
    title: "30,000 行交叉验证样本",
    code: `train_cv <- train_full |>
  group_by(churn) |>
  slice_sample(prop = 30000 / nrow(train_full)) |>
  ungroup()

set.seed(404713359)
cv_folds <- vfold_cv(train_cv, v = 5, strata = churn)`,
  },
  recipes: {
    title: "按模型拆分预处理 recipe",
    code: `rec_lr <- recipe(churn ~ ., data = train_cv) |>
  step_impute_median(all_numeric_predictors()) |>
  step_unknown(all_nominal_predictors()) |>
  step_dummy(all_nominal_predictors()) |>
  step_zv(all_predictors()) |>
  step_upsample(churn, over_ratio = 1, seed = 404713359)

rec_rf <- recipe(churn ~ ., data = train_cv) |>
  step_impute_median(all_numeric_predictors()) |>
  step_unknown(all_nominal_predictors()) |>
  step_zv(all_predictors()) |>
  step_upsample(churn, over_ratio = 1, seed = 404713359)`,
  },
  modelSpecs: {
    title: "五个模型规格",
    code: `lr_model <- logistic_reg() |>
  set_engine("glm")

rf_model <- rand_forest(trees = 500, min_n = 20) |>
  set_engine("ranger", importance = "impurity") |>
  set_mode("classification")

xgb_model <- boost_tree(trees = 200) |>
  set_engine("xgboost") |>
  set_mode("classification")

lgbm_model <- boost_tree(trees = 200) |>
  set_engine("lightgbm") |>
  set_mode("classification")

nb_model <- naive_Bayes(smoothness = 1) |>
  set_engine("klaR") |>
  set_mode("classification")`,
  },
  metricSet: {
    title: "正类方向与评价指标",
    code: `churn_metrics <- metric_set(
  accuracy,
  roc_auc,
  metric_tweak("sens", sens, event_level = "second"),
  metric_tweak(
    "spec",
    yardstick::spec,
    event_level = "second"
  )
)`,
  },
  finalFit: {
    title: "选择模型并评价留出集",
    code: `best_model_row <- all_cv_res |>
  filter(.metric == "roc_auc") |>
  slice_max(mean, n = 1)

final_fit <- final_wflow |>
  last_fit(data_split, metrics = churn_metrics)

final_res <- collect_metrics(final_fit)
final_pred <- collect_predictions(final_fit)`,
  },
  confusion: {
    title: "混淆矩阵与 ROC AUC",
    code: `final_conf <- final_pred |>
  conf_mat(truth = churn, estimate = .pred_class)

roc_data <- final_pred |>
  roc_curve(
    truth = churn,
    .pred_churned,
    event_level = "second"
  )

auc_val <- roc_auc(
  final_pred,
  truth = churn,
  .pred_churned,
  event_level = "second"
)`,
  },
  oddsRatio: {
    title: "重估解释模型并提取 odds ratio",
    code: `rec_lr_interp <- recipe(churn ~ ., data = train_cv) |>
  step_impute_median(all_numeric_predictors()) |>
  step_unknown(all_nominal_predictors()) |>
  step_dummy(all_nominal_predictors()) |>
  step_zv(all_predictors())

lr_final_fit <- workflow() |>
  add_model(lr_model) |>
  add_recipe(rec_lr_interp) |>
  fit(data = train_full)

lr_coef <- lr_final_fit |>
  extract_fit_parsnip() |>
  broom::tidy(exponentiate = TRUE, conf.int = TRUE)`,
  },
  neuralNetwork: {
    title: "二维分类神经网络",
    code: `set.seed(6262)
data_split <- initial_split(
  quad_data,
  prop = 0.8,
  strata = class
)

nnet_recipe <- recipe(class ~ ., data = training(data_split)) |>
  step_normalize(all_predictors())

nnet_model <- mlp(epochs = 1000, hidden_units = 2) |>
  set_engine("nnet") |>
  set_mode("classification")`,
  },
} as const;
