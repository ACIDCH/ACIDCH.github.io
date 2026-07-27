# Business Analytics Portfolio

[English](README.md) | [中文](README.zh-CN.md)

This repository contains a static bilingual business analytics and
supply chain analytics portfolio. English is the default language and
Simplified Chinese is available under `/zh/`.

The local implementation includes Light/Dark/System themes, configurable Hero
backgrounds, bilingual Content Collections, shareable project filters, a
synthetic supply-chain network demonstration, reduced-motion support, SEO
metadata, and deployment-ready GitHub Pages configuration.

## Requirements

- Node.js 22.12.0 or later; Node.js 24 is the current project baseline
- npm 9.6.5 or later
- Git

## Local development

```powershell
npm ci
npm run dev
```

## Validation

```powershell
npm run format:check
npm run check
npm run lint
npm run test
npm run build
```

`npm run build` also checks the generated site's internal links, core document
semantics and static assets. The production output is generated in `dist/`.

## Content

Projects are stored in `src/content/projects/` and notes in
`src/content/notes/`. Each translated pair uses the same `translationKey` and
has one entry per locale:

```yaml
translationKey: example-project
locale: en
slug: example-project
```

```yaml
translationKey: example-project
locale: zh
slug: example-project
```

Content marked with `isPlaceholder: true` or `isDemo: true` must not be
presented as a completed or verified real-world result.

## Central configuration

- Site, language, account, and repository-owner settings:
  `src/config/site.ts`
- Public profile placeholders: `src/config/profile.ts`
- Media, social, resume, and external-notebook switches:
  `src/config/portfolio.ts`
- Navigation: `src/config/navigation.ts`
- Path and URL builders: `src/utils/paths.ts` and `src/utils/urls.ts`

Do not duplicate account names or complete technical URLs across components and
content files.

## V2 visual system and media

The public Home and About pages use the Southern Alpine Minimal system with
local, replaceable landscape placeholders. Media paths, availability,
overlays, and object positions are centralised in `src/config/portfolio.ts`.
The earlier multi-background components remain available without loading
unconfirmed personal media.

## Privacy

This repository is designed to be public. Read `SECURITY.md` before adding
personal, employer, university, or project material. Never commit private
contact information, secrets, restricted coursework, or unapproved project
results.

## Deployment preparation

The Pages workflow is prepared in `.github/workflows/deploy.yml`. Activation
and migration instructions are in
[`docs/deployment/GITHUB_PAGES.md`](docs/deployment/GITHUB_PAGES.md) and
[`docs/deployment/STATIC_HOST_MIGRATION.md`](docs/deployment/STATIC_HOST_MIGRATION.md).

No remote repository is configured, and no push, deployment, domain binding or
paid service operation was performed during local preparation.
