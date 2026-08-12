# Bilingual sync metadata

`manifest.json` records the accepted Chinese source hashes for each `translationKey`.
It is internal build metadata and is never copied to the public site.

Commands:

- `npm run audit:i18n-sync` reports missing, stale, placeholder and integrity states without changing files.
- `npm run i18n:manifest` refreshes the manifest inventory without accepting stale translations.
- `node scripts/i18n-sync.mjs --write --accept=notes:<translationKey>` accepts one verified translation after protected-content and editorial review.
- `npm run audit:i18n-sync:strict` is the CI gate for published content. Explicit drafts and noindex placeholders remain tracked but do not count as public blockers.
- `npm run audit:i18n-final` runs the post-build completeness audit for routes, search, SEO, layout, protected content and published language parity.
- `npm run i18n:protected -- <zh-file> <en-file>` compares code, math, URLs, images, numeric tokens, component names, IDs and learning slots.
- `npm run i18n:translate -- --source=<zh-file> --target=<en-file>` creates a provider-generated draft by semantic block. Draft output still requires protected validation, terminology review and an editorial pass before acceptance.

Translation is performed by semantic Markdown block. Frontmatter identity, fenced code, inline code, formulae, URLs, image paths, component names, selectors, IDs, numbers and `data-learning-*` values remain protected. The validator intentionally allows natural differences in sentence count, paragraph length and heading wording.

The manually dispatched `Prepare bilingual translation draft` workflow can create or update a draft translation branch and pull request. Its provider-generated text must remain a draft until semantic and editorial review is complete; the production build never calls a translation provider.
