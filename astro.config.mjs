import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { siteConfig } from "./src/config/site.ts";

const nonPublicProjectSlugs = [
  "inventory-optimisation",
  "sales-inventory-dashboard",
  "transportation-network",
];

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.basePath,
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        const isNonPublicProject = nonPublicProjectSlugs.some((slug) =>
          pathname.includes(`/projects/${slug}/`),
        );
        return !(
          /\/404\/?$/.test(pathname) ||
          /\/design-lab\/?$/.test(pathname) ||
          /\/(?:skills|resume|contact)\/?$/.test(pathname) ||
          /\/projects\/customer-churn-machine-learning\/(?:workflow|prediction-evaluation)\/?$/.test(
            pathname,
          ) ||
          isNonPublicProject
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
