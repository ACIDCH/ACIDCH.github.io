import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { siteConfig } from "./src/config/site.ts";
import { preserveTranslatedHeadingIds } from "./src/content-support/heading-ids.mjs";

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.basePath,
  output: "static",
  trailingSlash: "always",
  markdown: {
    processor: satteri({ hastPlugins: [preserveTranslatedHeadingIds] }),
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        return !(
          /\/404\/?$/.test(pathname) ||
          /\/design-lab\/?$/.test(pathname) ||
          /\/(?:skills|resume|contact)\/?$/.test(pathname) ||
          /\/projects\/customer-churn-machine-learning\/(?:workflow|prediction-evaluation)\/?$/.test(
            pathname,
          )
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
