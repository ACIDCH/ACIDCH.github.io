# Bilingual sync metadata

`manifest.json` records the accepted Chinese source hashes for each `translationKey`.
It is internal build metadata and is never copied to the public site.

Commands:

- `npm run audit:i18n-sync` reports missing, stale, placeholder and integrity states in warning mode.
- `npm run i18n:manifest` refreshes the manifest inventory without accepting stale translations.
- `node scripts/i18n-sync.mjs --write --accept=notes:<translationKey>` accepts one verified translation after protected-content and editorial review.
- `npm run audit:i18n-sync:strict` is reserved for Phase 6, after the historical backlog reaches zero.
- `npm run i18n:protected -- <zh-file> <en-file>` compares code, math, URLs, images, numeric tokens, component names, IDs and learning slots.
- `npm run i18n:translate -- --source=<zh-file> --target=<en-file>` creates a provider-generated draft by semantic block. Draft output still requires protected validation, terminology review and an editorial pass before acceptance.

Translation is performed by semantic Markdown block. Frontmatter identity, fenced code, inline code, formulae, URLs, image paths, component names, selectors, IDs, numbers and `data-learning-*` values remain protected. The validator intentionally allows natural differences in sentence count, paragraph length and heading wording.
