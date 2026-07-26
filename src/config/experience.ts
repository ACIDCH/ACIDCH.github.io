import type { Locale } from "./site";

export type TimelineEntry = {
  key: string;
  kind: "education" | "experience" | "learning";
  title: Record<Locale, string>;
  organisation: Record<Locale, string>;
  detail: Record<Locale, string>;
  period: Record<Locale, string>;
};

const datePending = {
  en: "Dates pending confirmation",
  zh: "日期待确认",
} as const;

export const timelineEntries: TimelineEntry[] = [
  {
    key: "masters",
    kind: "education",
    title: {
      en: "Master of Business Analytics",
      zh: "商业分析硕士",
    },
    organisation: {
      en: "University of Auckland",
      zh: "奥克兰大学",
    },
    detail: {
      en: "Supply Chain specialisation.",
      zh: "供应链方向。",
    },
    period: datePending,
  },
  {
    key: "economics",
    kind: "education",
    title: {
      en: "Economics undergraduate background",
      zh: "经济学本科背景",
    },
    organisation: {
      en: "Institution pending confirmation",
      zh: "院校信息待确认",
    },
    detail: {
      en: "Exact qualification details have not been supplied.",
      zh: "具体学位信息尚未提供。",
    },
    period: datePending,
  },
  {
    key: "finance",
    kind: "experience",
    title: {
      en: "Finance / securities-related internship experience",
      zh: "金融 / 证券相关实习经历",
    },
    organisation: {
      en: "Organisation pending confirmation",
      zh: "机构信息待确认",
    },
    detail: {
      en: "Responsibilities and outcomes will only be added after verification.",
      zh: "职责与成果将在核实后补充。",
    },
    period: datePending,
  },
];
