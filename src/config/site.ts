export const siteConfig = {
  publicName: "Xintao Liu",
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
    storageKey: "xintao-locale",
  },
  design: {
    direction: "data-aurora",
    defaultTheme: "system",
    themeStorageKey: "xintao-theme",
  },
} as const;

export type Locale = (typeof siteConfig.language.supported)[number];
