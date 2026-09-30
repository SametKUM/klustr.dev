import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

const REPO_DIR = path.dirname(fileURLToPath(import.meta.url))

// Last commit that touched any of the repository-relative paths, as an ISO
// timestamp, or undefined when git cannot answer.
function lastCommit(...paths) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...paths], {
      cwd: REPO_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return out || undefined
  } catch {
    return undefined
  }
}

// Sitemap <lastmod> follows the sources a page is rendered from, so a
// changed guide or comparison row moves its page, and the landing page moves
// with its data files. The changelog is rebuilt from the Releases API, so it
// carries the build time.
const SHARED = ['src/layouts', 'src/components', 'src/styles']
const PAGE_SOURCES = {
  '/': ['src/pages/index.astro', 'src/data', ...SHARED],
  '/install/': ['src/pages/install.astro', 'src/data/install.ts'],
  '/faq/': ['src/pages/faq.astro', 'src/data/faq.ts'],
  '/compare/': ['src/pages/compare/index.astro', 'src/data/compare.ts'],
  '/docs/': ['src/pages/docs/index.astro', 'src/lib/guides.ts', 'docs/guide'],
}

function lastmodFor(pathname) {
  if (pathname === '/changelog/') return new Date().toISOString()
  const docs = pathname.match(/^\/docs\/([^/]+)\/$/)
  if (docs) return lastCommit(`docs/guide/${docs[1]}.md`)
  if (/^\/compare\/[^/]+\/$/.test(pathname)) {
    return lastCommit('src/data/compare.ts', 'src/pages/compare/[slug].astro')
  }
  const sources = PAGE_SOURCES[pathname]
  return sources ? lastCommit(...sources) : undefined
}

export default defineConfig({
  site: 'https://klustr.dev',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = lastmodFor(new URL(item.url).pathname)
        if (lastmod) item.lastmod = lastmod
        return item
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
