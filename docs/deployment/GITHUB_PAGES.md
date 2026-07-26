# GitHub Pages activation guide

The repository is prepared for GitHub Pages, but this guide does not authorise
creating a remote, pushing, changing account settings, or deploying.

## Prerequisites

- Keep the future `ACIDCH.github.io` repository public so the site does not
  depend on GitHub Pro or GitHub Student benefits.
- Keep the default branch named `main`, or update the branch trigger in
  `.github/workflows/deploy.yml`.
- Keep `package-lock.json` committed.
- Confirm `src/config/site.ts` still describes the intended technical Pages URL.

## One-time GitHub settings

After the repository exists and deployment is explicitly authorised:

1. Open the repository **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. Keep the repository public.
4. Do not add a custom domain or `CNAME` unless separately approved.
5. Optionally restrict the `github-pages` environment to the `main` branch.

The prepared workflow installs from the lockfile, runs formatting, type,
linting, test, security and build checks, uploads only `dist/`, and then uses
the GitHub Pages deployment action. It grants read-only source access to the
build job and only `pages: write` plus `id-token: write` to the deployment job.

## Routine maintenance

- Review Dependabot pull requests; do not merge major upgrades automatically.
- Re-run the complete local acceptance suite before a release.
- Review Node, Astro and official GitHub Action major versions at least yearly.
- Keep personal files, credentials, restricted coursework and private data out
  of the repository.

No remote, Pages deployment or account setting was created while preparing
this guide.
