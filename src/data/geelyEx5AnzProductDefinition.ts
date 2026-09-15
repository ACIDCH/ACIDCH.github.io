export type MarketKey = "nz" | "au";

export type BenchmarkVehicle = {
  id: string;
  brand: string;
  model: string;
  variant: string;
  target?: boolean;
  price: number;
  priceBasis: "plus-orc" | "before-orc" | "drive-away";
  rangeKm: number;
  batteryKwh: number | null;
  dcKw: number | null;
  acKw: number | null;
  powerKw: number | null;
  drive: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type EvidenceTheme = {
  id: string;
  strength: "high" | "medium" | "directional";
  evidenceType: "expert-review" | "community" | "benchmark" | "mixed";
  title: { zh: string; en: string };
  finding: { zh: string; en: string };
  implication: { zh: string; en: string };
  sourceLabels: string[];
};

export type ProductRequirement = {
  priority: "Must" | "Should" | "Explore";
  market: "ANZ" | "NZ" | "AU";
  requirement: { zh: string; en: string };
  why: { zh: string; en: string };
  validation: { zh: string; en: string };
};

export const snapshotDate = "2026-09-15";

export const markets: Record<
  MarketKey,
  {
    name: { zh: string; en: string };
    currency: "NZD" | "AUD";
    note: { zh: string; en: string };
    vehicles: BenchmarkVehicle[];
  }
> = {
  nz: {
    name: { zh: "新西兰", en: "New Zealand" },
    currency: "NZD",
    note: {
      zh: "新西兰表内价格均为公开 MRP / RSP + ORC，可在同一价格口径下比较。",
      en: "NZ prices are public MRP/RSP figures excluding on-road costs, so the rows use a consistent price basis.",
    },
    vehicles: [
      {
        id: "nz-ex5-complete",
        brand: "Geely",
        model: "EX5",
        variant: "Complete",
        target: true,
        price: 49990,
        priceBasis: "plus-orc",
        rangeKm: 430,
        batteryKwh: 60,
        dcKw: 100,
        acKw: 11,
        powerKw: 160,
        drive: "FWD",
        sourceLabel: "Geely NZ specification sheet (Apr 2026)",
        sourceUrl:
          "https://assets.nordeast.nz/media/belhci3s/geely-ex5-specification-sheet-april-2026.pdf",
      },
      {
        id: "nz-ex5-inspire-er",
        brand: "Geely",
        model: "EX5",
        variant: "Inspire Extended Range",
        target: true,
        price: 56990,
        priceBasis: "plus-orc",
        rangeKm: 450,
        batteryKwh: 68,
        dcKw: 100,
        acKw: 11,
        powerKw: 160,
        drive: "FWD",
        sourceLabel: "Geely NZ specification sheet (Apr 2026)",
        sourceUrl:
          "https://assets.nordeast.nz/media/belhci3s/geely-ex5-specification-sheet-april-2026.pdf",
      },
      {
        id: "nz-byd-atto3",
        brand: "BYD",
        model: "ATTO 3",
        variant: "60.48 kWh",
        price: 49990,
        priceBasis: "plus-orc",
        rangeKm: 420,
        batteryKwh: 60.48,
        dcKw: null,
        acKw: null,
        powerKw: 150,
        drive: "FWD",
        sourceLabel: "BYD Auto NZ current ATTO 3 page",
        sourceUrl: "https://www.bydauto.co.nz/vehicles/atto-3",
      },
      {
        id: "nz-kia-ev3-sr",
        brand: "Kia",
        model: "EV3",
        variant: "Light SR",
        price: 55520,
        priceBasis: "plus-orc",
        rangeKm: 436,
        batteryKwh: 58.3,
        dcKw: 100,
        acKw: 10.5,
        powerKw: 150,
        drive: "FWD",
        sourceLabel: "Kia NZ EV3 specifications",
        sourceUrl: "https://kia.co.nz/vehicles/ev3/range-and-specifications/",
      },
      {
        id: "nz-kia-ev3-lr",
        brand: "Kia",
        model: "EV3",
        variant: "Light LR",
        price: 62220,
        priceBasis: "plus-orc",
        rangeKm: 605,
        batteryKwh: 81.4,
        dcKw: 128,
        acKw: 10.5,
        powerKw: 150,
        drive: "FWD",
        sourceLabel: "Kia NZ EV3 specifications",
        sourceUrl: "https://kia.co.nz/vehicles/ev3/range-and-specifications/",
      },
    ],
  },
  au: {
    name: { zh: "澳大利亚", en: "Australia" },
    currency: "AUD",
    note: {
      zh: "Geely、BYD、Kia 使用 before-ORC 公开定价；MG 当前公开的是 drive-away 优惠价，因此 MG 仅用于规格参照，不进入同口径价格效率结论。",
      en: "Geely, BYD and Kia use public pre-on-road pricing. MG publishes a current drive-away offer, so it is used for specification context but excluded from like-for-like price-efficiency conclusions.",
    },
    vehicles: [
      {
        id: "au-ex5-complete-er",
        brand: "Geely",
        model: "EX5",
        variant: "Complete Extended Range",
        target: true,
        price: 41990,
        priceBasis: "before-orc",
        rangeKm: 475,
        batteryKwh: 68.39,
        dcKw: 100,
        acKw: 11,
        powerKw: 160,
        drive: "FWD",
        sourceLabel: "CarExpert — 2026 EX5 price & specs",
        sourceUrl:
          "https://www.carexpert.com.au/car-news/2026-geely-ex5-price-and-specs-mid-size-electric-suv-gets-bigger-battery",
      },
      {
        id: "au-ex5-inspire-er",
        brand: "Geely",
        model: "EX5",
        variant: "Inspire Extended Range",
        target: true,
        price: 45990,
        priceBasis: "before-orc",
        rangeKm: 450,
        batteryKwh: 68.39,
        dcKw: 100,
        acKw: 11,
        powerKw: 160,
        drive: "FWD",
        sourceLabel: "CarExpert — 2026 EX5 price & specs",
        sourceUrl:
          "https://www.carexpert.com.au/car-news/2026-geely-ex5-price-and-specs-mid-size-electric-suv-gets-bigger-battery",
      },
      {
        id: "au-byd-evo-dynamic",
        brand: "BYD",
        model: "ATTO 3 EVO",
        variant: "Dynamic",
        price: 41990,
        priceBasis: "before-orc",
        rangeKm: 420,
        batteryKwh: 60.48,
        dcKw: 110,
        acKw: 7,
        powerKw: 150,
        drive: "FWD",
        sourceLabel: "CarExpert — 2026 ATTO 3 EVO price & specs",
        sourceUrl:
          "https://www.carexpert.com.au/car-news/2026-byd-atto-3-evo-price-and-specs",
      },
      {
        id: "au-byd-evo-premium",
        brand: "BYD",
        model: "ATTO 3 EVO",
        variant: "Premium",
        price: 46990,
        priceBasis: "before-orc",
        rangeKm: 510,
        batteryKwh: 74.88,
        dcKw: 220,
        acKw: 11,
        powerKw: 230,
        drive: "RWD",
        sourceLabel: "CarExpert — 2026 ATTO 3 EVO price & specs",
        sourceUrl:
          "https://www.carexpert.com.au/car-news/2026-byd-atto-3-evo-price-and-specs",
      },
      {
        id: "au-kia-ev3-sr",
        brand: "Kia",
        model: "EV3",
        variant: "Air SR",
        price: 47600,
        priceBasis: "before-orc",
        rangeKm: 436,
        batteryKwh: 58.3,
        dcKw: 100,
        acKw: null,
        powerKw: 150,
        drive: "FWD",
        sourceLabel: "CarExpert — Kia EV3 range review/pricing",
        sourceUrl: "https://www.carexpert.com.au/car-reviews/2026-kia-ev3-review",
      },
      {
        id: "au-kia-ev3-lr",
        brand: "Kia",
        model: "EV3",
        variant: "Air LR",
        price: 53315,
        priceBasis: "before-orc",
        rangeKm: 604,
        batteryKwh: 81.4,
        dcKw: 127,
        acKw: null,
        powerKw: 150,
        drive: "FWD",
        sourceLabel: "CarExpert — Kia EV3 range review/pricing",
        sourceUrl: "https://www.carexpert.com.au/car-reviews/2026-kia-ev3-review",
      },
      {
        id: "au-mg-s5-62",
        brand: "MG",
        model: "MGS5 EV",
        variant: "Essence 62 kWh",
        price: 46990,
        priceBasis: "drive-away",
        rangeKm: 425,
        batteryKwh: 62,
        dcKw: 150,
        acKw: 6.6,
        powerKw: 150,
        drive: "RWD",
        sourceLabel: "MG Australia current offer/specification",
        sourceUrl: "https://mgmotor.com.au/vehicles/mgs5-ev",
      },
    ],
  },
};

export const evidenceThemes: EvidenceTheme[] = [
  {
    id: "software-adas",
    strength: "high",
    evidenceType: "mixed",
    title: {
      zh: "日常软件与驾驶辅助设置",
      en: "Daily software and driver-assistance settings",
    },
    finding: {
      zh: "专业评测把易用性和驾驶辅助干预列为主要短板；车主讨论也反复提到驾驶配置保存、快捷设置与提醒逻辑。另一方面，后续 OTA 已改善部分操作，因此问题更适合定义为“持续本地化与默认设置优化”，而不是静态的软件缺陷。",
      en: "Professional review flags usability and intrusive assistance as key weaknesses, while owner discussions repeatedly mention profile persistence, shortcuts and alert logic. Later OTA updates appear to improve parts of the experience, so the requirement is best framed as continued local calibration and default-setting refinement rather than a fixed software defect.",
    },
    implication: {
      zh: "把高频安全/驾驶设置、用户配置持久化和多驾驶员切换放在 ANZ 软件本地化的第一优先级。",
      en: "Prioritise high-frequency safety/drive controls, persistent preferences and multi-driver switching in the ANZ software localisation backlog.",
    },
    sourceLabels: ["CarExpert review, Aug 2026", "Australian owner discussions, 2026"],
  },
  {
    id: "ride-calibration",
    strength: "high",
    evidenceType: "mixed",
    title: { zh: "起伏路面的车身控制", en: "Body control on undulating roads" },
    finding: {
      zh: "CarExpert 对 2026 EX5 的核心动态反馈是悬架整体偏软、起伏路面会产生明显上下浮动；社区反馈并不完全一致，说明舒适性主观差异较大，但足以支持开展本地道路验证。",
      en: "CarExpert's main dynamic criticism of the 2026 EX5 is an overly soft tune that becomes bouncy on uneven roads. Owner feedback is mixed, which makes this a validation question rather than proof of a universal problem, but it is strong enough to justify local-road testing.",
    },
    implication: {
      zh: "在澳新典型城市接缝、起伏郊区路与高速路面进行本地底盘标定验证，重点观察纵向车身控制与转向手感。",
      en: "Run local chassis validation on ANZ urban joints, undulating suburban roads and highways, focusing on primary body control and steering feel.",
    },
    sourceLabels: ["CarExpert review, Aug 2026", "Australian owner discussions, 2026"],
  },
  {
    id: "range-charge",
    strength: "high",
    evidenceType: "benchmark",
    title: { zh: "续航与快充的竞争窗口", en: "Range and fast-charging competitive window" },
    finding: {
      zh: "EX5 的入门版本仍有很强价格/续航组合，但高配竞争正在加速：澳大利亚 ATTO 3 EVO Premium 已到 510 km WLTP / 220 kW DC，Kia EV3 长续航版本约 604–605 km。EX5 100 kW DC 在长途场景的纸面优势变小。",
      en: "The EX5 entry variant retains a strong price/range combination, but upper-end competition is moving quickly: Australia's ATTO 3 EVO Premium reaches 510 km WLTP and 220 kW DC, while Kia EV3 long-range variants sit around 604–605 km. The EX5's 100 kW DC headline becomes less differentiated for road-trip use.",
    },
    implication: {
      zh: "短期不要牺牲入门价格锚点；中期评估更长续航版本的铺开方式与下一阶段 DC 充电能力。",
      en: "Protect the entry price anchor in the short term; evaluate broader long-range availability and the next DC-charging step for the medium term.",
    },
    sourceLabels: ["Geely NZ/AU specs", "BYD ATTO 3 EVO", "Kia EV3"],
  },
  {
    id: "shared-use",
    strength: "medium",
    evidenceType: "community",
    title: { zh: "家庭共享车辆的账户与实用性", en: "Shared-family account and utility needs" },
    finding: {
      zh: "车主社区出现多驾驶员配置、App 多用户、行程能耗可见性、杯架尺寸等高频日常诉求。这些样本不能代表全部用户，但适合作为下一轮结构化用户访谈的题库。",
      en: "Owner communities surface recurring asks around multi-driver profiles, multi-user app access, trip-energy visibility and small daily utility details such as cup-holder fit. These samples are not representative research, but they are useful hypotheses for structured user clinics.",
    },
    implication: {
      zh: "把社区反馈转成可验证的用户任务，而不是直接当作市场结论。",
      en: "Convert community feedback into testable user tasks rather than treating it as representative market evidence.",
    },
    sourceLabels: ["Australian owner discussions, 2026"],
  },
];

export const productRequirements: ProductRequirement[] = [
  {
    priority: "Must",
    market: "ANZ",
    requirement: {
      zh: "驾驶设置持久化 + 高频 ADAS 一键入口 + 多驾驶员配置",
      en: "Persistent drive preferences + one-step ADAS shortcuts + multi-driver profiles",
    },
    why: {
      zh: "直接影响每天第一次上车的操作负担，且专业评测与车主反馈均有证据；属于 OTA/交互层面可持续改善的问题。",
      en: "It affects the first minutes of everyday use and is supported by both professional and owner evidence; much of the opportunity sits in OTA and interaction design.",
    },
    validation: {
      zh: "澳新 12–15 名现有车主任务测试：重启后设置保持率、完成常用安全设置的点击次数、双驾驶员切换成功率。",
      en: "Task-test 12–15 ANZ owners: preference persistence after restart, taps to reach common safety settings, and successful switching between two drivers.",
    },
  },
  {
    priority: "Must",
    market: "ANZ",
    requirement: {
      zh: "澳新真实道路底盘与转向本地验证",
      en: "ANZ real-road chassis and steering validation",
    },
    why: {
      zh: "起伏路面车身控制是独立专业评测中的明确问题，而社区评价存在分歧；需要用本地路线和量化/主观评分确认是否需要区域标定。",
      en: "Body control on undulating roads is a clear professional-review issue while community sentiment is mixed; local routes and structured scoring are needed before changing calibration.",
    },
    validation: {
      zh: "Auckland/Wellington 与 Sydney/Melbourne 典型路线 A/B 评价：一次起伏后的余振、转向中心感、乘员舒适评分。",
      en: "A/B evaluation on representative Auckland/Wellington and Sydney/Melbourne routes: secondary oscillation, on-centre steering feel and occupant comfort rating.",
    },
  },
  {
    priority: "Should",
    market: "NZ",
    requirement: {
      zh: "验证“Complete Extended Range”中间版本，而不是直接替换 60 kWh 入门版",
      en: "Validate a Complete Extended Range step-up rather than automatically replacing the 60 kWh entry car",
    },
    why: {
      zh: "NZ$49,990 的 Complete 是重要价格锚点；澳大利亚已经使用 68.39 kWh Complete ER，说明硬件组合存在。NZ 当前从 430 km Complete 直接跳到带更多舒适配置的 450 km Inspire，存在“只想买更长续航、不需要豪华配置”的潜在空档。",
      en: "The NZ$49,990 Complete is an important entry anchor. Australia already carries a 68.39 kWh Complete ER, showing that the hardware combination exists. NZ currently jumps from a 430 km Complete to a 450 km Inspire with extra comfort features, leaving a potential gap for buyers who mainly want more range.",
    },
    validation: {
      zh: "价格敏感度 + 配置取舍联合分析：入门版、Complete ER、Inspire 三方案；同时评估 SKU 复杂度与进口协同。",
      en: "Run price sensitivity and feature trade-off research across entry, Complete ER and Inspire concepts, then test the demand gain against added SKU complexity and sourcing synergy.",
    },
  },
  {
    priority: "Should",
    market: "AU",
    requirement: {
      zh: "Inspire 高配的长途差异化：续航/快充路线图优先于继续叠加舒适配置",
      en: "Differentiate the Inspire for long trips: prioritise range/charging roadmap over adding more comfort equipment",
    },
    why: {
      zh: "EX5 Inspire 为 450 km / 100 kW，而 ATTO 3 EVO Premium 为 510 km / 220 kW，Kia EV3 Air LR 约 604 km；高配用户的可见技术差异正在从内饰配置转向长途能力。",
      en: "EX5 Inspire sits at 450 km / 100 kW while ATTO 3 EVO Premium reaches 510 km / 220 kW and Kia EV3 Air LR is around 604 km; upper-trim differentiation is visibly shifting from cabin equipment toward road-trip capability.",
    },
    validation: {
      zh: "对高频长途用户做离散选择/概念测试，比较更快 DC、额外续航、RWD 与豪华配置的边际支付意愿。",
      en: "Concept-test frequent road-trip users to compare willingness to pay for faster DC charging, added range, RWD and luxury equipment.",
    },
  },
  {
    priority: "Explore",
    market: "ANZ",
    requirement: {
      zh: "共享家庭用车与车内小型实用性优化包",
      en: "Shared-family ownership and small-utility refinement pack",
    },
    why: {
      zh: "多账户、行程能耗、杯架/收纳等来自社区的方向性信号，价值可能很高但样本偏差也大，不应直接升级为量产需求。",
      en: "Multi-user access, trip-energy visibility and storage/cup-holder details are directional community signals; they may matter in daily life, but the sample bias is too high to turn them directly into production requirements.",
    },
    validation: {
      zh: "先做家庭双驾驶员访谈与 7 天日记研究，再决定是软件更新、附件方案还是下一年型硬件改动。",
      en: "Start with two-driver household interviews and a seven-day diary study, then decide whether the response belongs in software, accessories or a later model-year hardware change.",
    },
  },
];

export const researchSources = [
  {
    label: "Geely Auto — ANZ launch & localisation strategy",
    url: "https://www.geely.com/en/news/2025/geely-auto-debuts-australia-new-zealand",
    type: "official",
  },
  {
    label: "Geely NZ — EX5 current model page",
    url: "https://www.geely.nz/ex5",
    type: "official",
  },
  {
    label: "Geely NZ — EX5 specification sheet, April 2026",
    url: "https://assets.nordeast.nz/media/belhci3s/geely-ex5-specification-sheet-april-2026.pdf",
    type: "official",
  },
  {
    label: "CarExpert — 2026 Geely EX5 price & specs (Australia)",
    url: "https://www.carexpert.com.au/car-news/2026-geely-ex5-price-and-specs-mid-size-electric-suv-gets-bigger-battery",
    type: "secondary",
  },
  {
    label: "CarExpert — 2026 Geely EX5 review",
    url: "https://www.carexpert.com.au/car-reviews/2026-geely-ex5-review-1",
    type: "secondary",
  },
  {
    label: "BYD Auto NZ — ATTO 3",
    url: "https://www.bydauto.co.nz/vehicles/atto-3",
    type: "official",
  },
  {
    label: "CarExpert — 2026 BYD ATTO 3 EVO price & specs",
    url: "https://www.carexpert.com.au/car-news/2026-byd-atto-3-evo-price-and-specs",
    type: "secondary",
  },
  {
    label: "Kia NZ — EV3 range & specifications",
    url: "https://kia.co.nz/vehicles/ev3/range-and-specifications/",
    type: "official",
  },
  {
    label: "MG Australia — MGS5 EV",
    url: "https://mgmotor.com.au/vehicles/mgs5-ev",
    type: "official",
  },
  {
    label: "Reddit r/AustralianEV — EX5 owner experience thread, May 2026",
    url: "https://www.reddit.com/r/AustralianEV/comments/1t748q0/geely_ex5_owners_hows_your_experience_been/",
    type: "community",
  },
  {
    label: "Reddit r/AustralianEV — EX5 owner experience thread, Aug 2026",
    url: "https://www.reddit.com/r/AustralianEV/comments/1vv3tth/geely_ex5_owners_how_are_you_finding_it_so_far/",
    type: "community",
  },
];
