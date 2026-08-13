import type { Locale } from "./site";
import { siteConfig } from "./site";

type LocalisedString = Record<Locale, string>;

export const portfolioConfig = {
  media: {
    homeHero: {
      desktop: "/backgrounds/home-hero-desktop.webp",
      mobile: "/backgrounds/home-hero-mobile.webp",
      fallback: "/backgrounds/southern-alpine-placeholder.svg",
      available: true,
      overlay: 0.52,
      position: {
        desktop: "center 43%",
        mobile: "16% center",
      },
    },
    aboutHero: {
      image: "/backgrounds/about-hero.webp",
      fallback: "/backgrounds/southern-alpine-about-placeholder.svg",
      available: true,
      overlay: 0.42,
      position: "center 51%",
    },
    alternateLandscape: {
      image: "/backgrounds/wanaka-alternate.webp",
      available: true,
      position: "center 54%",
    },
    portrait: {
      image: "/profile/portrait.webp",
      fallback: "/brand/logo-monochrome.svg",
      available: true,
      position: "center",
    },
  },
  contact: {
    github: {
      enabled: true,
      url: `${siteConfig.github.origin}/${siteConfig.github.username}`,
    },
    linkedin: {
      enabled: true,
      url: "",
    },
    email: {
      enabled: false,
      address: "",
    },
    wechat: {
      enabled: true,
      id: "",
      qrImage: "/contact/wechat-qr-v2.svg",
      qrAvailable: true,
    },
    resume: {
      enabled: false,
      paths: {
        en: "/resume/resume-en.pdf",
        zh: "/resume/resume-zh.pdf",
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
