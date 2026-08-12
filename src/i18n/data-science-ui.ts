import type { Locale } from "../config/site";

export const dataScienceUi = {
  en: {
    threshold: {
      kicker: "Interactive chart · Classification assessment",
      title: "When the threshold changes, how do the model's errors move?",
      intro:
        "This uses a fixed set of customer-churn probabilities. Moving the classification threshold leaves the probability ranking unchanged, but TP, FP, FN, TN, sensitivity, specificity, precision and F1 all change together.",
      threshold: "Classification threshold:",
      matrixLabel: "Confusion matrix",
      actualPositive: "Actual churn",
      actualNegative: "Actual retained",
      predictedPositive: "Predicted churn",
      predictedNegative: "Predicted retained",
      chartLabel: "Customer churn probabilities and classification threshold",
      initialMessage:
        "A lower threshold usually recovers more actual churners but also increases false positives.",
      lowMessage:
        "Low threshold: sensitivity is high, but more retained customers are falsely flagged as churners.",
      highMessage:
        "High threshold: false positives fall, but some actual churners become false negatives.",
      midMessage:
        "A middle threshold trades off recovering churners against limiting false positives; whether it is suitable still depends on business costs.",
      probabilityAxis: "Predicted churn probability",
    },
    advanced: {
      bayesian: {
        title: "What Bayesian and hierarchical models add",
        p1: "Frequentist inference emphasizes repeated-sampling properties, while Bayesian analysis places unknown parameters inside the probability model. The central relationship is posterior ∝ likelihood × prior: the likelihood contributes evidence from the observed data, the prior encodes information or constraints available before the current sample, and their combination yields the posterior.",
        p2: "A prior should not be treated as an arbitrary opinion. It can come from historical periods, comparable markets, physical constraints, or previous studies. With abundant data a reasonable prior is often overwhelmed by the likelihood; with small samples prior sensitivity deserves explicit checking.",
        subtitle: "Why hierarchical models fit stores, regions and customer groups",
        p3: "Suppose return rates must be estimated for 30 stores. Estimating every store independently makes small stores unstable, while pooling all stores erases genuine heterogeneity. A hierarchical model uses partial pooling: store-level parameters remain distinct but are linked through a shared population distribution.",
        comparisons: [
          {
            title: "No pooling",
            text: "Estimate every group separately; flexible but noisy for small groups.",
          },
          {
            title: "Complete pooling",
            text: "Share one parameter across groups; stable but can hide heterogeneity.",
          },
          {
            title: "Partial pooling",
            text: "Share information while retaining group-specific differences.",
          },
        ],
      },
      evidence: {
        title: "Separate association, prediction and treatment effects",
        p1: "The same linear model can appear in three different tasks: describing conditional association, predicting new outcomes, or estimating what would happen if an exposure were changed. The formula can look similar while the evidential requirements are very different.",
        headers: ["Question", "Main evidence", "Common mistake"],
        rows: [
          [
            "Association",
            "Conditional relationships, intervals, diagnostics",
            "Calling a coefficient causal",
          ],
          [
            "Prediction",
            "Out-of-sample error, stability, calibration",
            "Selecting models by training fit",
          ],
          [
            "Treatment effect",
            "Randomization or an explicit identification strategy",
            "Assuming a few controls remove confounding",
          ],
        ],
        p2: "For example, higher spending among promoted customers does not by itself prove that the promotion caused the increase if high-value customers were more likely to receive the offer. Regression adjustment can address observed differences, but unobserved selection may remain.",
      },
      loss: {
        title: "Loss functions and bias–variance define what a model optimizes",
        p1: "An algorithm does not automatically know what counts as a good prediction. Regression often uses squared error, classification often uses log loss to evaluate full probabilities, and operational decisions may require an explicit cost function. The metric should match the decision.",
        cards: [
          {
            title: "MSE",
            text: "Continuous outcomes; penalizes large errors strongly.",
          },
          { title: "MAE", text: "Continuous outcomes; more robust to extreme errors." },
          {
            title: "Log loss",
            text: "Probabilistic classification; punishes confident wrong probabilities.",
          },
          {
            title: "Decision cost",
            text: "Maps FP, FN, or numerical error to operational cost.",
          },
        ],
        subtitle: "Bias and variance are practical model behaviors",
        p2: "A model that is too simple can be stable across training samples yet consistently miss real structure: high bias. A very flexible model can fit training data closely but change substantially when the sample changes: high variance. Cross-validation helps select complexity using observations not used in the current fit.",
        chartLabel:
          "Illustration of model complexity, training error and validation error",
        simple: "simple",
        complexity: "model complexity",
        complex: "complex",
        training: "training error",
        validation: "validation error",
        caption:
          "Training error usually falls with complexity; validation error often falls first and then rises as over-fitting grows.",
      },
      resampling: {
        title: "Feature selection must happen inside resampling",
        p1: "A subtle form of leakage in high-dimensional modelling occurs when features are selected on the full dataset before cross-validation. Even if test labels never enter the final model call, the feature set has already seen them. Selection, scaling, PCA, imputation and tuning should be re-learned inside each training fold.",
        pipeline: [
          "outer training data",
          "fold preprocessing",
          "fold feature selection / PCA",
          "fit and tune",
          "validation-fold score",
        ],
        p2: "When the search space is large, repeated comparison on the same cross-validation scores can itself become optimistic. Nested cross-validation separates selection in an inner loop from generalization assessment in an outer loop.",
      },
      calibration: {
        title: "Ranking, calibration and business value are different",
        p1: "A high AUC indicates useful ranking, but it does not guarantee that a predicted 0.8 corresponds to an 80% event rate, nor that a chosen threshold creates value. Assessment is clearer when separated into discrimination, calibration and decision analysis.",
        decision: "threshold · cost · capacity · value",
        p2: "If a retention team can contact only 100 customers per day, the operational question is not which threshold maximizes accuracy. It is how to rank customers by risk and expected value within the capacity constraint, and whether that ranking remains stable in future periods.",
      },
      checklist: {
        title: "Review the evidence chain, not the number of algorithms",
        items: [
          "Define the outcome, prediction time and available features.",
          "Use exploration to identify skew, groups, missingness and unusual observations.",
          "For inference, report effect size and uncertainty rather than significance alone.",
          "For prediction, establish a simple baseline and compare on independent data.",
          "Keep preprocessing, selection and tuning inside training information.",
          "Assess discrimination, calibration and threshold-dependent cost.",
          "Keep association, prediction and causal claims distinct.",
        ],
      },
    },
  },
  zh: {
    threshold: {
      kicker: "互动图表 · 分类评估",
      title: "阈值改变以后，模型的错误会怎样移动？",
      intro:
        "下面使用一组固定的客户流失概率。移动分类阈值后，模型本身的概率排序没有变化，但 TP、FP、FN、TN 以及 Sensitivity、Specificity、Precision 和 F1 会一起变化。",
      threshold: "分类阈值：",
      matrixLabel: "混淆矩阵",
      actualPositive: "实际流失",
      actualNegative: "实际留存",
      predictedPositive: "预测流失",
      predictedNegative: "预测留存",
      chartLabel: "客户流失概率与分类阈值",
      initialMessage: "阈值较低时通常能找回更多实际流失客户，但误报也会增加。",
      lowMessage: "阈值较低：Sensitivity 较高，但更多留存客户会被误报为流失。",
      highMessage: "阈值较高：误报减少，但部分实际流失客户会落到 FN。",
      midMessage:
        "中间阈值在召回流失客户和控制误报之间取得折中；是否合适仍取决于业务成本。",
      probabilityAxis: "预测流失概率",
    },
    advanced: {
      bayesian: {
        title: "Bayesian 与层次模型补上了哪些信息",
        p1: "频率学推断常从重复抽样的长期性质出发，Bayesian 分析则把未知参数本身放进概率模型。核心关系可以写成 posterior ∝ likelihood × prior：数据通过 likelihood 提供证据，prior 表达分析前对参数的约束或已有知识，两者结合形成 posterior。真正有用的地方不是换一套术语，而是让参数不确定性、预测不确定性和已有信息能够在同一模型中传播。",
        p2: "在业务分析里，prior 不应该被理解成随意加入主观判断。它可以来自历史月份、相似市场、物理边界或过去项目。样本很大时，合理 prior 对结果的影响通常会减弱；样本很小时，prior 的设定会更重要，因此需要做敏感性检查。",
        subtitle: "层次模型为什么适合门店、地区和客户群",
        p3: "假设需要估计 30 家门店的平均退货率。完全分开估计会让小样本门店非常不稳定；把所有门店合成一个总体又会抹掉真实差异。层次模型在两者之间做 partial pooling：每个门店保留自己的参数，同时这些参数又来自一个共同的上层分布。样本少的门店会更多地向总体信息收缩，样本多的门店则主要由自己的数据决定。",
        comparisons: [
          { title: "不合并", text: "每组独立估计；灵活，但小样本方差高。" },
          { title: "完全合并", text: "所有组共用一个参数；稳定，但可能掩盖异质性。" },
          { title: "部分合并", text: "组间共享信息，同时保留组别差异。" },
        ],
      },
      evidence: {
        title: "关联、预测和处理效应要分开",
        p1: "同一个线性模型可以出现在三种完全不同的问题里：描述 X 与 Y 的条件关联、预测新的 Y、估计改变 X 后 Y 会怎样变化。模型公式可能相似，但证据要求完全不同。预测任务只要求新数据上误差可接受；关联分析需要清楚说明条件变量和数据范围；处理效应则必须依赖随机化或可信的识别假设。",
        headers: ["问题", "核心证据", "最常见错误"],
        rows: [
          ["关联", "条件关系、区间、模型诊断", "把系数直接说成因果"],
          ["预测", "样本外误差、稳定性、校准", "用训练拟合度选模型"],
          ["处理效应", "随机化或明确识别策略", "认为控制几个变量就消除了混杂"],
        ],
        p2: "例如促销客户的平均消费更高，并不能直接证明促销提高了消费，因为促销可能本来就优先发给高价值客户。回归中加入历史消费可以减少一部分可观测差异，但看不到的选择机制仍可能存在。预测模型可以利用这种稳定关联，因果结论却需要更强的设计。",
      },
      loss: {
        title: "损失函数和偏差—方差决定模型在优化什么",
        p1: "算法不会自动知道业务里什么叫“预测得好”。回归常用平方误差，是因为大误差会受到更强惩罚；分类常用 log loss，是因为它评价完整概率而不只是阈值后的类别；真正的业务决策还可能需要直接使用成本函数。评价指标必须和决策目标对应。",
        cards: [
          { title: "MSE", text: "连续结果；对大误差惩罚更重。" },
          { title: "MAE", text: "连续结果；对极端误差更稳健。" },
          { title: "Log loss", text: "概率分类；错误且过度自信会受到强惩罚。" },
          { title: "业务成本", text: "把 FP、FN 或数值误差转换成真实代价。" },
        ],
        subtitle: "偏差和方差不是抽象术语",
        p2: "模型太简单时，重复换训练样本得到的结果很稳定，但会持续错过真实结构，这属于高偏差。模型太灵活时，训练误差很低，却会对样本中的随机波动产生反应，换一批数据参数或边界就明显变化，这属于高方差。交叉验证的价值之一，就是在真正没有参与当前拟合的数据上寻找更合适的复杂度。",
        chartLabel: "模型复杂度与训练误差、验证误差关系示意",
        simple: "简单",
        complexity: "模型复杂度",
        complex: "复杂",
        training: "训练误差",
        validation: "验证误差",
        caption: "训练误差通常随复杂度下降；验证误差常先下降、再因过拟合回升。",
      },
      resampling: {
        title: "特征选择也必须发生在 resampling 里面",
        p1: "高维建模最隐蔽的泄漏之一，是先用完整数据挑特征，再做交叉验证。即使测试标签没有直接进入模型函数，特征集合已经看过全部结果变量，验证折因此不再真正独立。正确做法是让筛选、标准化、PCA、缺失值处理和超参数选择都在每个 training fold 内重新学习。",
        pipeline: [
          "外层训练数据",
          "折内预处理",
          "折内特征选择 / PCA",
          "拟合与调参",
          "验证折评价",
        ],
        p2: "如果模型选择空间很大，例如同时尝试多个算法、很多超参数和大量特征工程方案，同一套 cross-validation 分数还可能因为反复比较而变得乐观。此时可以使用 nested cross-validation：内层负责选择方案，外层只负责估计整个选择流程的泛化误差。",
      },
      calibration: {
        title: "模型排序能力、概率校准和业务价值是三件事",
        p1: "AUC 高说明模型通常能把正类排在负类之前，但不保证 0.8 真的代表约 80% 的发生率，也不保证某个阈值下的决策赚钱。模型评价最好分成三层：discrimination 看排序；calibration 看概率是否可信；decision analysis 看在具体成本、容量和收益约束下是否值得采取行动。",
        decision: "阈值 · 成本 · 容量 · 收益",
        p2: "例如一个留存团队每天只能联系 100 名客户，那么最终问题不是“哪个阈值让 accuracy 最大”，而是“在 100 个名额内，应该按什么风险与预期收益排序，并且这种排序在未来月份是否仍然稳定”。这类约束会把模型评估从单一指标转成决策问题。",
      },
      checklist: {
        title: "最后检查的是证据链，不是算法数量",
        items: [
          "目标变量、预测时点和可用特征是否定义清楚。",
          "探索性分析有没有发现偏态、分组、缺失和异常结构。",
          "推断问题是否报告效应大小与不确定性，而不是只报显著性。",
          "预测问题是否有简单 baseline，并在完全独立的数据上比较。",
          "所有预处理、筛选和调参是否都限制在训练信息内。",
          "分类概率是否同时检查 discrimination、calibration 和阈值成本。",
          "最终结论是否明确区分关联、预测和因果。",
        ],
      },
    },
  },
} as const satisfies Record<Locale, unknown>;
