# Portfolio V3.4 — Search, Mobile Menu, Motion and Pagination Fix

> Project root: `D:\Github\ACIDCH.github.io`
> Scope: targeted bug fixing and completion.
> Do not perform another broad redesign.

## 1. Confirmed issues

1. Global search opens and returns results, but the result area cannot scroll to show all matches.
2. The mobile Menu button still does not produce a reliable usable menu.
3. The expected motion and visual treatment are not visibly working on the deployed site.
4. Projects and Learning Notes need visible pagination controls at the bottom.

## 2. Search dialog scrolling

Fix the search UI so that:

- the dialog fits within the viewport;
- the search input/header stays visible;
- the results region has its own vertical scroll;
- mouse wheel, touch scrolling, Page Up/Down, Home/End and keyboard navigation work;
- the last result can always be reached;
- mobile safe-area spacing is respected;
- opening the dialog may lock the page behind it, but must not lock the results panel;
- closing the dialog restores the page scroll position;
- no nested scroll trap prevents touch scrolling;
- the selected keyboard result is scrolled into view;
- Astro client navigation does not leave stale locks or duplicate handlers.

Suggested layout behaviour:

```text
dialog: max-height: min(88dvh, 760px)
dialog body: grid/flex with min-height: 0
results area: overflow-y: auto; min-height: 0
```

Do not solve this by expanding the modal beyond the viewport.

## 3. Mobile menu reliability

Treat the menu as a real stateful dialog/sheet.

Requirements:

- Menu button always opens and closes the panel.
- The panel must be visible above all page layers.
- Overlay covers the viewport.
- Background content is inert/non-interactive while open.
- Background scroll is locked while open.
- Internal menu content can scroll if necessary.
- Closing restores the exact previous scroll position.
- Close by:
  - Menu/Close button;
  - overlay tap;
  - Escape;
  - navigation selection;
  - route change.
- Focus moves into the menu when opened.
- Focus returns to the Menu button when closed.
- No `overflow: hidden`, `position: fixed`, `inert`, `aria-hidden` or stale class remains after closing.
- Reinitialise safely after `astro:page-load`.
- Clean up before route changes.
- Never bind duplicate listeners.

Test on:

```text
360px
390px
iPhone Safari-compatible viewport
Android Chrome-compatible viewport
```

Inspect z-index, pointer-events and transformed ancestors. Do not merely add a higher z-index without identifying the real issue.

## 4. Motion and visible visual treatment

Diagnose why the deployed site appears static.

Check:

- whether `prefers-reduced-motion` is incorrectly treated as enabled for everyone;
- whether reveal elements remain in their initial state;
- whether IntersectionObserver initialisation runs after Astro client navigation;
- whether motion CSS is included in the production build;
- whether classes are removed too early or never added;
- whether transparent/opacity states are overridden;
- whether page transitions are disabled by an implementation error;
- whether animations only work on hover and therefore appear absent on mobile.

Restore restrained, clearly visible motion:

### Home

- Hero background: subtle scale/parallax while scrolling.
- Hero copy: gentle fade and upward movement.
- Scroll indicator: subtle motion.
- First content section: clear but restrained entrance.

### Shared sections

- Section reveal: fade + translateY.
- Small stagger for cards/list items.
- Header surface transition after scrolling.
- Buttons/icons: small hover/press feedback.
- Cards: light lift on pointer-capable devices.
- Tag cloud: subtle active/hover transition.
- Search and menu: short fade/slide.
- About portrait/profile card: entrance transition.
- Page navigation: restrained fade/slide where Astro supports it.

Rules:

- primarily animate `opacity` and `transform`;
- no scroll-jacking;
- no continuous decorative loops;
- no heavy animation library;
- animations remain disabled or simplified only when the user actually requests reduced motion;
- content must be visible by default if JavaScript fails;
- avoid a flash of hidden content.

## 5. Visual completion check

Do not redesign the whole visual identity, but verify that the existing Southern Alpine Minimal design is visibly applied:

- landscape backgrounds load;
- photography overlay is balanced;
- Header spacing is not crowded;
- glass treatment is visible but restrained;
- card borders, surfaces and spacing are consistent;
- Light and Dark themes both look intentional;
- Project and Note pages are not plain unstyled text;
- Footer and empty states match the same system.

Fix missing CSS imports, specificity conflicts or component styles if the deployed result does not match the current brief.

## 6. Projects pagination

Add static, SEO-friendly pagination.

Recommended page size:

```text
6 projects per page
```

Routes:

```text
/projects/                 -> page 1
/projects/page/2/
/projects/page/3/

/zh/projects/              -> page 1
/zh/projects/page/2/
/zh/projects/page/3/
```

Requirements:

- pagination appears at the bottom;
- Previous / Next;
- numbered pages;
- current page has `aria-current="page"`;
- disabled controls are not links;
- preserve language;
- page 1 canonical remains `/projects/` or `/zh/projects/`;
- page 2+ has correct canonical;
- add rel prev/next metadata when appropriate;
- no duplicate page-1 route;
- 404 for invalid page numbers;
- project ordering remains deterministic;
- draft/noindex rules remain intact.

If there are currently fewer than 7 public projects, still implement the reusable pagination component and test it with fixture data, but hide unnecessary pagination controls in production until there is more than one page.

## 7. Learning Notes pagination

Recommended page size:

```text
9 notes per page
```

Routes:

```text
/notes/                    -> page 1
/notes/page/2/
/notes/page/3/

/zh/notes/                 -> page 1
/zh/notes/page/2/
/zh/notes/page/3/
```

Tag behaviour:

- selected tag filters the note collection first;
- then paginate the filtered result;
- keep tag state in the URL;
- preferred URL shape:

```text
/notes/?tag=sql
/notes/page/2/?tag=sql
```

Chinese equivalent:

```text
/zh/notes/?tag=sql
/zh/notes/page/2/?tag=sql
```

Requirements:

- changing a tag returns to page 1;
- Previous / Next and page numbers preserve `tag`;
- All/全部 clears the tag and returns to page 1;
- empty filtered state is clear;
- current page and total pages are visible;
- pagination controls are keyboard accessible;
- pagination works without a large client-side framework.

## 8. Reusable pagination component

Create one reusable component, for example:

```text
Pagination.astro
```

It should accept:

```text
currentPage
totalPages
basePath
locale
query parameters
```

Use the same visual system for Projects and Learning Notes.

## 9. Tests

Add or update tests for:

- search result panel has a scrollable region;
- keyboard-selected result scrolls into view;
- search close clears page locks;
- mobile menu opens, closes and clears all locks;
- mobile menu works after Astro route navigation;
- motion is not globally disabled;
- content remains visible without JavaScript;
- Projects page 1 and page 2 generation;
- Notes page 1 and page 2 generation;
- Previous/Next/page-number links;
- `aria-current`;
- tag + pagination URL preservation;
- invalid pagination route returns 404;
- bilingual pagination routes;
- page 1 canonical does not duplicate `/page/1/`.

## 10. Browser acceptance

Verify the deployed build at minimum on:

```text
Home mobile 390px
Search with enough results to require scrolling
Mobile menu opened and closed repeatedly
Projects page 1 and page 2
Learning Notes page 1 and page 2
Learning Notes filtered tag page
Light theme
Dark theme
Reduced motion on
Reduced motion off
```

Confirm:

- search can reach the final result;
- menu never leaves the page frozen;
- visible motion exists when reduced motion is off;
- no content is hidden when reduced motion is on;
- pagination is visible at the bottom when more than one page exists;
- no horizontal overflow;
- console has no application errors.

## 11. Scope limits

Do not:

- redesign the whole site again;
- change the public identity/privacy strategy;
- rewrite Git history;
- add React/Vue;
- add a heavy search or animation library;
- modify Pages Source;
- enable Jekyll;
- bind a domain;
- invent Projects or Notes merely to make pagination visible in production.

## 12. Completion

Run:

```text
npm run format:check
npm run check
npm run lint
npm run test
npm run build
npm audit
```

Commit:

```text
fix: repair mobile interactions and add content pagination
```

Push to existing `origin/main`, wait for the existing GitHub Actions workflow, and verify the live site.

Final response should include only:

1. six checks PASS/FAIL;
2. exact root cause of search scrolling;
3. exact root cause of mobile menu failure;
4. motion root cause and restored effects;
5. Projects and Notes pagination routes/page sizes;
6. commit and push status;
7. deployment status;
8. live verification;
9. remaining blockers.
