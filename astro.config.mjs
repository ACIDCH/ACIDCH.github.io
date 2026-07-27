import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { siteConfig } from "./src/config/site.ts";

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.basePath,
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        return !(
          /\/404\/?$/.test(pathname) ||
          /\/design-lab\/?$/.test(pathname) ||
          /\/(?:skills|resume|contact)\/?$/.test(pathname) ||
          /\/(?:projects|notes)\/[^/]+\/?$/.test(pathname)
        );
      },
    }),
  ],
  i18n: {
    defaultLocale: siteConfig.language.default,
    locales: [...siteConfig.language.supported],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
