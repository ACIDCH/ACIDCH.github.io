export type HeroBackgroundMode = "video" | "image" | "aurora" | "network";

export const siteConfig = {
  publicDisplayName: "",
  siteTitle: "Business Analytics Portfolio",
  siteUrl: "https://ACIDCH.github.io",
  basePath: "/",
  github: {
    origin: "https://github.com",
    username: "ACIDCH",
    repositoryOwner: "ACIDCH",
  },
  language: {
    default: "en",
    supported: ["en", "zh"],
    storageKey: "portfolio-locale",
  },
  design: {
    direction: "southern-alpine-minimal",
    defaultTheme: "system",
    themeStorageKey: "portfolio-theme",
  },
  hero: {
    background: "aurora" as HeroBackgroundMode,
    image: "/backgrounds/hero-placeholder.svg",
    poster: "/backgrounds/hero-placeholder.svg",
    videoSources: {
      webm: null as string | null,
      mp4: null as string | null,
    },
    videoEnabled: true,
    networkEnabled: true,
  },
  seo: {
    defaultImage: "/brand/social-card.svg",
    themeColour: "#26302c",
  },
} as const;

export type Locale = (typeof siteConfig.language.supported)[number];
