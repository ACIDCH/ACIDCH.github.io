import type { Locale } from "../config/site";

export const ui = {
  en: {
    siteDescription:
      "Xintao Liu's bilingual business analytics and supply chain analytics portfolio.",
    languageSwitch: "中文",
    placeholder: "Placeholder content",
  },
  zh: {
    siteDescription: "Xintao Liu 的中英双语商业分析与供应链分析作品集。",
    languageSwitch: "English",
    placeholder: "占位内容",
  },
} satisfies Record<Locale, Record<string, string>>;
