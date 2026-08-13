# 数据分析项目集

[English](README.md) | [中文](README.zh-CN.md)

This repository contains the source code and content for a bilingual data analytics portfolio built with Astro and deployed to GitHub Pages. Chinese content is the current editorial priority; English pages follow the same content model and are maintained as corresponding translations.

The site includes Light/Dark/System themes, bilingual Content Collections, global search, project and Learning Note routes, reduced-motion support, SEO metadata, privacy checks, and automated GitHub Pages deployment.

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
npm run audit:i18n-sync:strict
npm run build
npm run audit:i18n-final
```

The CI pipeline also runs public-content privacy and security checks before deployment. Production output is generated in `dist/` and deployed through `.github/workflows/deploy.yml`.

## Content

Projects are stored in `src/content/projects/` and Learning Notes in `src/content/notes/`. A Chinese and English pair shares the same `translationKey`:

```yaml
translationKey: example-project
locale: zh
slug: example-project
```

```yaml
translationKey: example-project
locale: en
slug: example-project
```

Only verified project content is retained in the active portfolio. New projects will be added from completed coursework and independently verified work as they become ready for publication.

## Bilingual workflow

Chinese is treated as the current source editorial version. Published bilingual content is checked for route, search, sitemap, metadata, structural and protected-token parity.

`.github/workflows/i18n-translation.yml` can generate an English first-pass translation as a Draft PR. Code, formulas, URLs, numbers and structural tokens are protected during translation. Generated English content still requires editorial and semantic review before merge.

## Central configuration

- Site, language, account and repository settings: `src/config/site.ts`
- Public profile configuration: `src/config/profile.ts`
- Media, social, resume and external-note switches: `src/config/portfolio.ts`
- Navigation: `src/config/navigation.ts`
- Path and URL builders: `src/utils/paths.ts` and `src/utils/urls.ts`

## Privacy

This repository is public. Read `SECURITY.md` before adding personal, employer, university or project material. Do not commit private contact details, secrets, restricted coursework or unapproved project results.

## Deployment

The site is deployed to GitHub Pages through the repository CI/CD workflow. The pipeline validates the current commit before deployment and verifies the live deployment afterwards. No custom domain or paid hosting service is currently configured.
