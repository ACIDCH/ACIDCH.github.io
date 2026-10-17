# Optional Cloudflare Pages preview (GitHub Pages remains canonical)

This is a **separate non-production comparison environment** motivated by a
cost-first, multi-project architecture. The current Astro website remains
hosted at https://ACIDCH.github.io; do not change DNS, base paths,
production workflows, project content, or any Supabase/Neon databases.

## What this change implements

- A reproducible static preview bundle: `npm ci && npm run build` then
  `node scripts/prepare-cloudflare-preview.mjs`.
- English and Chinese homepages must both exist in the bundle.
- The bundle includes a Cloudflare `_headers` rule with
  `X-Robots-Tag: noindex, nofollow` to prevent duplicate indexing.
- Pull requests run the preview build and retain an artifact for review.
- Only a **manual** GitHub Actions dispatch can attempt a Cloudflare Pages
  preview deployment. It does not publish automatically.

## Optional activation

1. Register/authorize your own Cloudflare account and manually provision
   a **Direct Upload** Pages project named `acidch-portfolio-preview`.
2. Configure GitHub Actions secrets `CLOUDFLARE_ACCOUNT_ID` and
   `CLOUDFLARE_API_TOKEN` with the minimum Pages deployment permission.
3. Once reviewed and merged, manually run the
   `Optional Cloudflare Pages portfolio preview` workflow.
4. Compare loading, route behavior, bilingual navigation and latency from
   Auckland and mainland China against the existing GitHub Pages site.
5. Keep GitHub Pages unless measured improvements justify a future switch.

Free domain `eu.cc` is **not** registered or validated by this commit.
A free domain is an optional vanity alias, not a guarantee of ownership,
renewal, DNS availability or reachability.

The static site does not need a dedicated Worker or database. Do not add
Better Auth, Clerk, Neon, D1 or R2 to the portfolio without a real dynamic
requirement. Cloudflare Workers/Pages and other Cloudflare services have
independent billing/usage constraints; no claim of unlimited free service.
