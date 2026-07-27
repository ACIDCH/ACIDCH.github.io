import type { Locale } from "./site";
import { siteConfig } from "./site";

export const profileConfig = {
  publicName: siteConfig.publicName,
  role: {
    en: "Business Analytics & Supply Chain Analytics",
    zh: "商业分析与供应链分析",
  },
  summary: {
    en: "Master of Business Analytics student at the University of Auckland, specialising in supply chain and building practical decision support with data, optimisation and clear communication.",
    zh: "就读于奥克兰大学商业分析硕士项目，专注供应链方向，关注如何通过数据、优化方法与清晰沟通支持可落地的商业决策。",
  },
  background: {
    en: [
      "University of Auckland",
      "Master of Business Analytics",
      "Supply Chain specialisation",
      "Economics undergraduate background",
      "Finance / securities-related internship experience",
    ],
    zh: [
      "奥克兰大学",
      "商业分析硕士",
      "供应链方向",
      "经济学本科背景",
      "金融 / 证券相关实习经历",
    ],
  },
} satisfies {
  publicName: string;
  role: Record<Locale, string>;
  summary: Record<Locale, string>;
  background: Record<Locale, string[]>;
};
