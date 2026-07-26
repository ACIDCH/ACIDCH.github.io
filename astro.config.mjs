import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { siteConfig } from "./src/config/site.ts";

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.basePath,
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  i18n: {
    defaultLocale: siteConfig.language.default,
    locales: [...siteConfig.language.supported],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
