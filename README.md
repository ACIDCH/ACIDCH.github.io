# Xintao Liu Portfolio

[English](README.md) | [中文](README.zh-CN.md)

This repository contains the static Astro foundation for Xintao Liu's
bilingual portfolio. English is the default language and Simplified Chinese is
available under `/zh/`.

Phase 1 intentionally contains plain, accessible placeholder pages. Branding,
theme controls, dynamic backgrounds, animation, and supply-chain
visualisations are not part of this phase.

## Requirements

- Node.js 22.12.0 or later; Node.js 24 is the current project baseline
- npm 9.6.5 or later
- Git

## Local development

```powershell
npm install
npm run dev
```

## Validation

```powershell
npm run check
npm run lint
npm run test
npm run build
```

The production output is generated in `dist/`.

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

Content marked with `isPlaceholder: true` must not be presented as a completed
or verified result.

## Central configuration

- Site, language, account, and repository-owner settings:
  `src/config/site.ts`
- Public profile placeholders: `src/config/profile.ts`
- Navigation: `src/config/navigation.ts`
- Path and URL builders: `src/utils/paths.ts` and `src/utils/urls.ts`

Do not duplicate account names or complete technical URLs across components and
content files.

## Privacy

This repository is designed to be public. Read `SECURITY.md` before adding
personal, employer, university, or project material. Never commit private
contact information, secrets, restricted coursework, or unapproved project
results.

## Deployment status

No remote repository is configured and no deployment is performed in Phase 1.
