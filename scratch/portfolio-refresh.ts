import type { Locale } from "../src/config/site";
import { siteConfig } from "../src/config/site";
type LocalisedString = Record<Locale, string>;
export const portfolioConfig = {
  media: {
    homeHero: { desktop: "/backgrounds/home-hero-analytical.svg", mobile: "/backgrounds/home-hero-analytical-mobile.svg", fallback: "/backgrounds/home-hero-analytical.svg", available: true, overlay: 0.18, position: { desktop: "center", mobile: "center" } },
    aboutHero: { image: "/backgrounds/about-hero-analytical.svg", fallback: "/backgrounds/about-hero-analytical.svg", available: true, overlay: 0.12, position: "center" },
    alternateLandscape: { image: "/backgrounds/wanaka-alternate.webp", available: true, position: "center 54%" },
    portrait: { image: "/profile/portrait.webp", fallback: "/brand/logo-monochrome.svg", available: true, position: "center" },
  },
  contact: {
    github: { enabled: true, url: `${siteConfig.github.origin}/${siteConfig.github.username}` },
    linkedin: { enabled: true, url: "" },
    email: { enabled: false, address: "" },
    wechat: { enabled: true, id: "", qrImage: "/contact/wechat-qr-v2.svg", qrAvailable: true },
    resume: { enabled: false, paths: { en: "/resume/resume-en.pdf", zh: "/resume/resume-zh.pdf" }, available: { en: false, zh: false } },
  },
  externalNotebook: { enabled: false, url: "", label: { en: "External Notebook", zh: "外部云笔记" } satisfies LocalisedString },
} as const;
