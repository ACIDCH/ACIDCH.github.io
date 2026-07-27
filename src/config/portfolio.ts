import type { Locale } from "./site";
import { siteConfig } from "./site";

type LocalisedString = Record<Locale, string>;

export const portfolioConfig = {
  media: {
    homeHero: {
      desktop: "/backgrounds/home-hero-desktop.webp",
      mobile: "/backgrounds/home-hero-mobile.webp",
      fallback: "/backgrounds/southern-alpine-placeholder.svg",
      available: false,
      overlay: 0.48,
      position: {
        desktop: "center 52%",
        mobile: "58% center",
      },
    },
    aboutHero: {
      image: "/backgrounds/about-hero.webp",
      fallback: "/backgrounds/southern-alpine-about-placeholder.svg",
      available: false,
      overlay: 0.4,
      position: "center 48%",
    },
    portrait: {
      image: "/profile/portrait.webp",
      fallback: "/brand/logo-monochrome.svg",
      available: false,
      position: "center",
    },
  },
  contact: {
    github: {
      enabled: true,
      url: `${siteConfig.github.origin}/${siteConfig.github.username}`,
    },
    linkedin: {
      enabled: false,
      url: "",
    },
    email: {
      enabled: false,
      address: "",
    },
    wechat: {
      enabled: false,
      id: "",
      qrImage: "/contact/wechat-qr.webp",
      qrAvailable: false,
    },
    resume: {
      enabled: false,
      paths: {
        en: "/resume/xintao-liu-resume-en.pdf",
        zh: "/resume/xintao-liu-resume-zh.pdf",
      },
      available: {
        en: false,
        zh: false,
      },
    },
  },
  externalNotebook: {
    enabled: false,
    url: "",
    label: {
      en: "External Notebook",
      zh: "外部云笔记",
    } satisfies LocalisedString,
  },
} as const;
