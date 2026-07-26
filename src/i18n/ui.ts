import type { Locale } from "../config/site";

export const ui = {
  en: {
    siteDescription: "Bilingual portfolio foundation for Xintao Liu.",
    languageSwitch: "中文",
    placeholder: "Placeholder content",
  },
  zh: {
    siteDescription: "Xintao Liu 的双语作品集基础框架。",
    languageSwitch: "English",
    placeholder: "占位内容",
  },
} satisfies Record<Locale, Record<string, string>>;
