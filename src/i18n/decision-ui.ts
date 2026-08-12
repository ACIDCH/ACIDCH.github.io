import type { Locale } from "../config/site";

type StringShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly StringShape<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: StringShape<T[K]> }
      : T;

const en = {
  anatomy: {
    kicker: "Interactive lab · Model Anatomy",
    title:
      "How do you break one business problem into the four core parts of an optimisation model?",
    intro:
      "Switch business scenarios to see how the roles of the objective, parameters, decision variables and constraints stay consistent.",
    controlsLabel: "Choose an optimisation scenario",
    questionLabel: "Business question",
    objectiveLabel: "Objective",
    parametersLabel: "Parameters",
    decisionsLabel: "Decision Variables",
    constraintsLabel: "Constraints",
    scenarios: [
      {
        id: "mix",
        label: "Product mix",
        objective: "Maximise total contribution",
        parameters:
          "Unit contribution, material use, labour use and available resources",
        decisions: "Production quantities of Core Kit and Premium Kit",
        constraints: "Material ≤ 240; labour ≤ 250; production quantities ≥ 0",
        question:
          "How should the two products be combined to earn the highest contribution from limited resources?",
      },
      {
        id: "hub",
        label: "Hub location",
        objective: "Minimise fixed and transport costs",
        parameters:
          "Candidate-hub capacity, fixed opening cost, regional demand and transport costs",
        decisions: "Which hubs to open and how much each hub ships to each region",
        constraints: "Meet demand; respect capacity; closed hubs cannot ship",
        question:
          "How should network structure and flow allocation be decided together?",
      },
      {
        id: "carrier",
        label: "Carrier allocation",
        objective: "Minimise line-haul transport cost",
        parameters: "Unit cost, minimum commitment, maximum capacity and total demand",
        decisions: "Freight volume assigned to each carrier",
        constraints: "Total volume meets demand; each carrier's bounds are respected",
        question:
          "How should demand be split across carriers while meeting commercial commitments?",
      },
    ],
  },
  unconstrained: {
    kicker: "Interactive lab · Unconstrained Optimisation",
    title: "How far is the mathematical optimum from an executable operating choice?",
    intro:
      "Move capacity to see when marginal improvement in the net-value curve reaches zero, and compare the opportunity cost of the executable choices 575, 600 and 625.",
    capacityDecision: "Capacity decision",
    selectedCapacity: "Selected capacity",
    netValue: "Net value",
    marginalSlope: "Marginal slope",
    gapToOptimum: "Gap to optimum",
    chartLabel:
      "Capacity net value curve with the selected point and mathematical optimum",
    capacitySuffix: "capacity",
    optimumPrefix: "optimum",
    interpretation: "Decision interpretation",
    initialReading:
      "600 is the mathematical optimum; small deviations around it produce only a small loss in net value.",
    optimalReading:
      "600 is the mathematical optimum: the marginal slope is 0, and either increasing or decreasing capacity reduces net value.",
    nearReading:
      "{value} is close to the mathematical optimum, with a net-value loss of about {loss}; compare that gap with the operational convenience of batch sizes, staffing or standard specifications.",
    farReading:
      "{value} is well outside the optimal region and the net-value loss has grown to about {loss}; operational convenience now needs a stronger justification for the deviation.",
  },
  feasible: {
    kicker: "Interactive lab · Feasible Region + Sensitivity",
    title:
      "When resource bounds move, how do the feasible region, optimal mix and constraint slack change?",
    intro:
      "The model maximises total contribution from two products. Adjust material and labour capacity to re-enumerate the corner points and identify the best feasible solution.",
    managerialReading: "Managerial reading",
    initialReading:
      "Both resource constraints bind at the optimum, so additional resources may have marginal value.",
    bothBinding:
      "Both resource constraints bind at the optimum: material and labour are fully used, so the marginal value of either additional resource is worth examining.",
    materialBinding:
      "The material constraint binds, but labour still has {slack} units of slack; adding the idle resource alone will not improve the objective in the short term.",
    labourBinding:
      "The labour constraint binds, but material still has {slack} units of slack; the bottleneck has shifted to labour.",
  },
  milp: {
    kicker: "Interactive lab · Binary Decision + Fixed Charge",
    title:
      "Why does an opening decision need a binary variable and a linking constraint?",
    intro:
      "Toggle candidate hubs to see fixed cost, available capacity and the rule that a closed hub cannot ship change together.",
    close: "Close",
    open: "Open",
    logic: "Logic",
    initialReading:
      "With Central Hub open, y = 1 and up to 620 units may flow; when y = 0, the right-hand side automatically becomes 0.",
    noneOpen:
      "Every y is 0, so every candidate hub's shipping limit is also 0: the network cannot meet any positive demand.",
    insufficient:
      "Fixed cost is currently lower, but capacity is only {total}, below total demand of 860; the model still needs another hub, external supply or a shortage variable.",
    sufficient:
      "Total capacity of {total} covers demand of 860; whether opening multiple hubs is worthwhile still depends on transport savings versus the additional fixed cost.",
  },
  scale: {
    kicker: "Interactive lab · Sets, Indices & Model Scale",
    title:
      "Why do sets and indices become necessary when a model grows from a few variables to hundreds?",
    intro:
      "Change the numbers of plants, products, customer regions and periods to see decision variables grow multiplicatively, and map mathematical indices to PuLP dictionary variables.",
    mathNote: "A variable is not one cell, but an entire family of index combinations.",
    pulpNote:
      "Sets generate variable keys, while constraint loops generate structurally consistent limits in batches.",
    scaleReading: "Scale reading",
    initialReading:
      "2 × 3 × 4 = 24 flow variables; manual cell-by-cell naming is still possible, but maintainability is already starting to erode.",
    dynamicReading:
      "{formula} = {variables} variables. Scale comes from index combinations, not from the objective suddenly becoming more complex; sets, loops and parameter dictionaries keep the model readable and extensible.",
  },
  pulp: {
    kicker: "Interactive lab · Mathematical Model ↔ PuLP",
    title: "Which layer of mathematical notation should map to which part of the code?",
    intro:
      "Switch model layers one at a time instead of putting every rule in one code block. Clear structure makes scaling, debugging and auditing easier.",
  },
  horizon: {
    kicker: "Interactive lab · Planning Horizon",
    title:
      "What do strategic, tactical and operational models actually decide in the same supply chain?",
    intro:
      "Switch planning levels to see how the decision object, reversibility and constraint time scale change. The modelling methods may be similar, but the management meanings are not.",
    controlsLabel: "Choose a planning level",
    initialReading:
      "Strategic models usually emphasise fixed investment, capacity and network structure, and reversing a poor decision is costly.",
    cases: {
      Strategic: {
        horizon: "Strategic",
        decision: "Choose network footprint",
        example: "Open a distribution hub",
        reversibility: "Low",
        model:
          "Strategic → network footprint → binary/opening decisions + long-lived capacity",
        reading:
          "Strategic models usually emphasise fixed investment, capacity and network structure, and reversing a poor decision is costly.",
      },
      Tactical: {
        horizon: "Tactical",
        decision: "Allocate medium-term capacity",
        example: "Select carrier capacity",
        reversibility: "Medium",
        model:
          "Tactical → capacity allocation → contracts, sourcing and medium-term resource limits",
        reading:
          "Tactical models connect the long-term network to short-term execution, often through contracted capacity, carrier choice, capacity allocation and inventory policy.",
      },
      Operational: {
        horizon: "Operational",
        decision: "Execute short-term flows",
        example: "Set weekly production and fulfilment",
        reversibility: "High",
        model:
          "Operational → short-term flow → production, inventory, routing and fulfilment quantities",
        reading:
          "Operational models emphasise feasibility in the current cycle, such as this week's production, inventory carryover, deliveries and shortage handling.",
      },
    },
  },
  flow: {
    kicker: "Interactive lab · Supply Chain Flow",
    title:
      "Why can carrier allocation and multi-period inventory both be seen as flow conservation?",
    intro:
      "Switch between carrier allocation and multi-period production inventory. The first checks total freight and carrier bounds; the second checks production, demand and inventory carryover in each period.",
    initialCarrierReading:
      "Total allocation exactly covers demand and every carrier remains within its commitment range.",
    carrierBalanced:
      "Total allocation exactly covers demand of 860 and every carrier is between its minimum commitment and maximum capacity.",
    carrierMismatch:
      "Current allocation is {total}, a difference of {difference} from demand of 860; cost is comparable only after flow balance holds.",
    carrierBounds:
      "Total flow balances, but at least one carrier violates its commitment bounds; reallocate volume instead of comparing unit cost alone.",
    initialPeriodReading:
      "Matching demand period by period has no inventory cost, but production starts in all four periods, so setup cost is high.",
    planReadings: {
      match:
        "Matching demand period by period has no inventory cost, but production starts in all four periods, so setup cost is high.",
      smooth:
        "Smooth production reduces volume swings but still starts every period and carries inventory; it is not necessarily cheaper than matching demand.",
      batch:
        "Two large batches cut setups from 4 to 2 and use inventory to cover the following period; compare fixed setup savings with holding cost.",
    },
  },
} as const;

type DecisionUi = StringShape<typeof en>;

const zh = {
  anatomy: {
    kicker: "互动实验 · Model Anatomy",
    title: "同一个业务问题，怎样拆成优化模型的四个核心部分？",
    intro:
      "切换业务场景，观察 Objective、Parameters、Decision Variables 与 Constraints 的职责如何保持不变。",
    controlsLabel: "选择优化场景",
    questionLabel: "业务问题",
    objectiveLabel: "目标函数",
    parametersLabel: "参数",
    decisionsLabel: "决策变量",
    constraintsLabel: "约束",
    scenarios: [
      {
        id: "mix",
        label: "产品组合",
        objective: "最大化总贡献",
        parameters: "单位贡献、材料用量、人工用量、可用资源",
        decisions: "Core Kit 与 Premium Kit 的生产数量",
        constraints: "材料 ≤ 240；人工 ≤ 250；生产数量 ≥ 0",
        question: "在有限资源下，怎样组合两种产品才能获得最高贡献？",
      },
      {
        id: "hub",
        label: "枢纽选址",
        objective: "最小化固定成本与运输成本",
        parameters: "候选枢纽容量、固定开启成本、区域需求、运输成本",
        decisions: "哪些枢纽开启，以及各枢纽向各区域配送多少",
        constraints: "满足需求；不超过产能；未开启枢纽不能发货",
        question: "网络结构与流量分配应该怎样共同决定？",
      },
      {
        id: "carrier",
        label: "运输商分配",
        objective: "最小化干线运输成本",
        parameters: "单位成本、最低承诺量、最大承运量、总需求",
        decisions: "分配给每家运输商的货量",
        constraints: "总货量满足需求；各运输商上下限得到遵守",
        question: "怎样把需求分给不同运输商，同时满足商业承诺？",
      },
    ],
  },
  unconstrained: {
    kicker: "互动实验 · Unconstrained Optimisation",
    title: "数学最优点与可执行运营选择之间差多少？",
    intro:
      "拖动容量，观察净价值曲线的边际改善何时归零，并比较 575、600、625 三个可执行选择的机会成本。",
    capacityDecision: "容量决策",
    selectedCapacity: "所选容量",
    netValue: "净价值",
    marginalSlope: "边际斜率",
    gapToOptimum: "距最优点差值",
    chartLabel: "含所选点与数学最优点的容量净价值曲线",
    capacitySuffix: "容量",
    optimumPrefix: "最优点",
    interpretation: "决策解读",
    initialReading: "600 是数学最优点；在这个点附近，小幅偏离只产生较小的净价值损失。",
    optimalReading:
      "600 是数学最优点：边际斜率为 0，继续增加或减少容量都会降低净价值。",
    nearReading:
      "{value} 与数学最优点很接近，净价值损失约 {loss} 个价值单位；这类差距可以与整批容量、排班或标准规格的运营便利性一起比较。",
    farReading:
      "{value} 已明显偏离最优区域，净价值损失扩大到约 {loss}；此时运营便利性需要提供更强理由才能支持偏离。",
  },
  feasible: {
    kicker: "互动实验 · Feasible Region + Sensitivity",
    title: "资源边界移动时，可行域、最优组合与约束松弛怎样变化？",
    intro:
      "模型最大化两种产品的总贡献。材料与人工容量可以调整，页面会重新枚举角点并识别最优可行解。",
    managerialReading: "管理解读",
    initialReading: "两个资源约束都在最优点处绑定，额外资源可能具有边际价值。",
    bothBinding:
      "两个资源约束都在最优点处绑定：材料与人工都被完全利用，增加任一资源都值得进一步检查边际价值。",
    materialBinding:
      "材料约束绑定，但人工仍有 {slack} 的 slack；短期内增加闲置资源不会自动改善目标值。",
    labourBinding:
      "人工约束绑定，但材料仍有 {slack} 的 slack；瓶颈已经转移到人工资源。",
  },
  milp: {
    kicker: "互动实验 · Binary Decision + Fixed Charge",
    title: "开启决策为什么需要二进制变量与 linking constraint？",
    intro:
      "切换候选枢纽的开启状态，观察固定成本、可用容量与“未开启不能发货”的逻辑怎样同时变化。",
    close: "关闭",
    open: "开启",
    logic: "逻辑",
    initialReading:
      "Central Hub 开启时 y = 1，因此最多允许 620 单位流量；若 y = 0，右侧自动变成 0。",
    noneOpen:
      "所有 y 都为 0，因此所有候选枢纽的可发送流量上限也变成 0：网络无法满足任何正需求。",
    insufficient:
      "当前固定成本较低，但只有 {total} 容量，小于 860 的总需求；模型还需要额外枢纽、外部供应或缺货变量。",
    sufficient:
      "当前总容量 {total} 足以覆盖 860 的需求；是否值得同时开启多个枢纽，还要比较运输节省与新增固定成本。",
  },
  scale: {
    kicker: "互动实验 · Sets, Indices & Model Scale",
    title: "为什么模型从几个变量扩展到几百个变量后，集合与索引会变得必要？",
    intro:
      "调整工厂、产品、客户区和时期的数量，观察决策变量数量如何按维度乘法增长，并把数学索引映射到 PuLP 的字典变量。",
    mathNote: "一个变量不是“一格”，而是一整个索引组合族。",
    pulpNote: "集合负责生成变量键，约束循环负责批量生成结构一致的限制。",
    scaleReading: "规模解读",
    initialReading:
      "2 × 3 × 4 = 24 个流量变量；手工逐格命名仍可勉强管理，但已经开始失去可维护性。",
    dynamicReading:
      "{formula} = {variables} 个变量。规模增长来自索引组合，而不是数学目标突然变复杂；集合、循环与参数字典用于保持模型可读和可扩展。",
  },
  pulp: {
    kicker: "互动实验 · Mathematical Model ↔ PuLP",
    title: "从数学符号到代码，哪一层应该对应哪一段？",
    intro:
      "逐步切换模型层，避免把所有逻辑塞进一个代码块。结构清晰时，规模扩展、调试和审计都会更容易。",
  },
  horizon: {
    kicker: "互动实验 · Planning Horizon",
    title: "同一个供应链，战略、战术与运营模型到底在决定什么？",
    intro:
      "切换规划层级，观察决策对象、可逆性和约束时间尺度如何变化。模型方法相似，但管理语义并不相同。",
    controlsLabel: "选择规划层级",
    initialReading:
      "战略模型通常更重视固定投资、容量与网络结构，错误决策的撤销成本较高。",
    cases: {
      Strategic: {
        horizon: "战略",
        decision: "选择网络布局",
        example: "开设配送枢纽",
        reversibility: "低",
        model: "战略 → 网络布局 → 二进制/开启决策 + 长期容量",
        reading: "战略模型通常更重视固定投资、容量与网络结构，错误决策的撤销成本较高。",
      },
      Tactical: {
        horizon: "战术",
        decision: "分配中期容量",
        example: "选择运输商容量",
        reversibility: "中",
        model: "战术 → 容量分配 → 合同、采购与中期资源限制",
        reading:
          "战术模型连接长期网络与短期执行，常见问题是合同容量、运输商选择、产能分配与库存策略。",
      },
      Operational: {
        horizon: "运营",
        decision: "执行短期流量",
        example: "设定每周生产与履约",
        reversibility: "高",
        model: "运营 → 短期流量 → 生产、库存、路径与履约数量",
        reading:
          "运营模型强调当前周期的执行可行性，例如本周生产量、库存结转、配送量与缺货处理。",
      },
    },
  },
  flow: {
    kicker: "互动实验 · Supply Chain Flow",
    title: "运输分配与多期库存，为什么都可以看成“流量必须守恒”？",
    intro:
      "在同一个实验中切换运输商分配和多期生产库存。前者检查总货量与运输商上下限，后者检查每期生产、需求与库存结转。",
    initialCarrierReading: "总分配正好覆盖需求，并且所有运输商都在承诺区间内。",
    carrierBalanced:
      "总分配正好覆盖 860 的需求，并且每家运输商都在最低承诺量与最大承运量之间。",
    carrierMismatch:
      "当前分配为 {total}，与需求 860 相差 {difference}；成本数字只有在流量平衡成立后才具有可比性。",
    carrierBounds:
      "总量已经平衡，但至少一家运输商违反了承诺上下限；需要重新分配而不是只比较单位成本。",
    initialPeriodReading:
      "逐期匹配需求没有库存成本，但四期都需要启动生产，因此 setup cost 较高。",
    planReadings: {
      match: "逐期匹配需求没有库存成本，但四期都需要启动生产，因此 setup cost 较高。",
      smooth:
        "平滑生产减少了产量波动，但仍然每期启动，并产生跨期库存；它不一定比逐期匹配更便宜。",
      batch:
        "两次大批量生产把 setup 次数从 4 降到 2，同时用库存覆盖下一期需求；固定启动节省需要与持有成本比较。",
    },
  },
} satisfies DecisionUi;

export const decisionUi = { en, zh } satisfies Record<Locale, DecisionUi>;
