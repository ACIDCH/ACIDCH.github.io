# Static hosting migration

The site has no server, database, remote font, paid API or runtime CMS. Any
static host that can publish the `dist/` directory can run it.

## Migration checklist

1. Install the locked dependencies with `npm ci`.
2. Run `npm run format:check`, `npm run check`, `npm run lint`,
   `npm run test` and `npm run build`.
3. Publish the generated `dist/` directory.
4. Update `siteUrl` in `src/config/site.ts` to the confirmed public origin.
5. For a project subpath, update `basePath`; internal assets and links use the
   central path helpers.
6. Rebuild and verify canonical, hreflang, sitemap, robots and social metadata.
7. Keep the existing GitHub Pages technical URL available unless a future
   migration decision explicitly replaces it.

## Portability limits

- GitHub Pages workflow files are host-specific and can be disabled or replaced
  on another platform.
- Security response headers must be configured in the destination host because
  static GitHub Pages does not provide repository-level header configuration.
- No custom domain is required. If one is approved later, DNS and ownership
  verification remain separate external operations.

Migration must not copy private source material or introduce paid services
without explicit approval.
