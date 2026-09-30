# klustr.dev

Source of [klustr.dev](https://klustr.dev), the landing and documentation site for [Klustr](https://github.com/SametKUM/klustr), a cross-platform Kubernetes desktop client. The site is a static Astro 7 build with Tailwind v4, deployed to GitHub Pages from `main` by `pages.yml`; `site.yml` runs the same checks on pull requests. The app lives in its own repository and has no build-time dependency on this one.

## Project Structure

```
klustr.dev/
├── .mise.toml                Node version (kept in parity with the workflows and containers)
├── astro.config.mjs          site URL, sitemap integration + <lastmod> from git, Tailwind vite plugin
├── Dockerfile / .dockerignore  two-stage image: node build → static-web-server
├── compose.yaml              `site` (built image on :8080) + `dev` profile (hot reload on :4321)
├── og-template.html          source for public/og.png (render with Playwright)
├── docs/guide/               the user guides, one markdown file per page under /docs/<slug>/
├── public/                   CNAME, robots.txt, appicon.png, og.png, hero.mp4
└── src/
    ├── styles/global.css       paper / blueprint tokens + the components layer
    ├── layouts/                BaseLayout (SEO head, theme boot, analytics), DocsLayout, CompareLayout
    ├── components/             Nav, Footer, InstallTabs, CommandBlock, HeroSlider, CompareTable, BrandIcon
    ├── data/                   screenshots, install commands, comparison rows and pages, FAQ
    ├── lib/                    site constants, JSON-LD builders, GitHub fetch, marked-based
    │                           markdown, guide loader, git dates
    └── pages/                  index, install, docs/, compare/, faq, changelog, llms.txt, 404
```

## Conventions

- **Docs pages are the guides in `docs/guide/`.** `/docs/<slug>/` renders `docs/guide/<slug>.md` at build time through `marked` (`src/lib/guides.ts`), so the GitHub copy and the site never drift. Adding a guide means adding its card to `GUIDE_GROUPS` too; the build fails if a guide is missing from the index. `guide.md#anchor` links are rewritten to site routes and headings get GitHub-style ids. Links to files in the app repository are absolute GitHub URLs.
- **Guides follow the app.** They describe the released app, so a guide changes in its own pull request here when a feature lands in the app repository.
- **Comparison content is data.** `src/data/compare.ts` holds the table rows and the per-tool pages, with a `REVIEWED_ON` date. Cells state capabilities, not judgements, and cite nothing that has not been checked in the other tool's documentation. No memory or speed numbers unless measured side by side.
- **Numbers on the landing page are counts, not benchmarks** (resource kinds, integrations, themes, archive size). Do not add RAM or start-up claims without a measurement to back them.
- **Two exposures of one theme.** Paper (light) is the default; `data-theme="dark"` on `<html>` flips to the app's default-dark palette. Components read only the CSS variables in `global.css`, and component classes live in `@layer components` so Tailwind utilities keep winning.
- **GitHub data at build time.** The changelog page and the version label come from the app repository's Releases API (`src/lib/github.ts`); a failed fetch degrades to a GitHub link instead of failing the build. CI passes `GITHUB_TOKEN` to lift the anonymous rate limit.
- **Search-result limits are enforced in one place.** `BaseLayout` clamps every meta description to about 158 characters (ending on a sentence when it can) and drops the `· Klustr` title suffix when it would push a title past 60. The home page uses `SITE.title` and `SITE.metaDescription`, written to those limits by hand; `SITE.description` is the long form for structured data only. Headings name the product or integration they describe (`Helm: dry-run first, then apply.`), and the H1 contains the word Kubernetes.
- **`dependencies` is what the site redistributes.** The package is `private`, nothing is published to npm, and the deployed artifact is `dist/`. So `dependencies` holds only what actually reaches a visitor — the Geist fonts, the simple-icons paths and the Swetrix snippet — and every compiler, generator and asset pipeline lives in `devDependencies`, Astro and Tailwind included, which keeps the production tree an honest list of redistributed third-party material. `sharp` (libvips, LGPL) runs only during `astro build` and never reaches `dist/`. `npm ci` installs both sets, so the build is unaffected.
- **Machine-readable index.** `/llms.txt` is generated from the same data the pages use (guide headings and summaries, comparison pages, site constants), and `/llms-full.txt` concatenates every guide in full. Both are Astro endpoints, so a new guide appears in them without a second edit. Neither is in the sitemap.
- **Dates come from git.** `src/lib/git.ts` reads first and last commit dates; docs pages put them in `datePublished` / `dateModified`, compare pages use `REVIEWED_ON` as `dateModified`, the home page uses the first and latest release, and `astro.config.mjs` sets sitemap `<lastmod>` from the same commit dates. The workflows check out with `fetch-depth: 0` so those dates are real, not the clone time.
- `npm run typecheck` is `astro check`; TypeScript stays on 6.x until `@astrojs/check` accepts 7 (Dependabot ignores that major).
- The social card is rendered from `og-template.html`; regenerate `public/og.png` after changing the hero copy.
- **Containers are optional and local.** `docker compose up --build` builds the two-stage image (Node build, then `static-web-server` serving `dist/` as a non-root user with compression, cache headers, the 404 page and trailing-slash redirects) on `127.0.0.1:8080`; `docker compose --profile dev up dev` runs the hot-reload dev server on `127.0.0.1:4321` with `node_modules` in a named volume. Production stays GitHub Pages; the image is for local review and self-hosting.

## Licensing

- Site code is Apache-2.0 (`LICENSE`, `NOTICE`); the guides under `docs/guide/` are CC-BY-4.0 (`docs/guide/LICENSE`). Keep new code and new guides under the same split.
- Third-party material (fonts, icon paths, the analytics snippet) keeps its own license and arrives through npm, not copied into `src/`.

## Coding Conventions

- Default to no comments. Add one only when the why is non-obvious: a hidden constraint, a workaround, a deliberate deviation. Never reference issues, PRs or callers in comments.
- No marketing-style copy or emoji beyond what the existing pages use.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `build:`, `ci:`), many small, logically scoped commits.

## Verification Before Reporting Done

```bash
npm ci
npm run typecheck
npm run build
```

Both must pass, and a visual change must be checked in `npm run dev` or the built output, in both the light and dark theme.
