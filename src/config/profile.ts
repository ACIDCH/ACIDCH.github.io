import type { Locale } from "./site";
import { siteConfig } from "./site";

export const profileConfig = {
  publicName: siteConfig.publicName,
  professionalEmail: null,
  linkedInUrl: null,
  resume: {
    en: null,
    zh: null,
  },
  summary: {
    en: "Professional summary pending confirmation.",
    zh: "个人简介等待确认。",
  },
} satisfies {
  publicName: string;
  professionalEmail: string | null;
  linkedInUrl: string | null;
  resume: Record<Locale, string | null>;
  summary: Record<Locale, string>;
};
