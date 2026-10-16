import { Marked, type Token, type Tokens } from 'marked'
import { absoluteUrl } from './site'

export type Heading = { depth: number; id: string; text: string }

export type Rendered = {
  html: string
  title: string
  description: string
  headings: Heading[]
}

// GitHub-compatible heading anchors, so the `guide.md#section` cross-links the
// guides already use keep resolving after they are rewritten to site routes.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const GUIDE_LINK = /^([a-z0-9-]+)\.md(#[\w-]*)?$/

function rewriteHref(href: string): string {
  const m = GUIDE_LINK.exec(href)
  return m ? `/docs/${m[1]}/${m[2] ?? ''}` : href
}

function plainText(tokens: Tokens.Generic[] | undefined): string {
  if (!tokens) return ''
  return tokens
    .map((t) => {
      if ('tokens' in t && Array.isArray(t.tokens)) return plainText(t.tokens as Tokens.Generic[])
      if (t.type === 'codespan' || t.type === 'text' || t.type === 'escape') return String(t.text ?? '')
      return String(t.raw ?? '')
    })
    .join('')
}

function createMarked(headings: Heading[]) {
  const marked = new Marked({ gfm: true })
  marked.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = plainText(tokens)
        const id = slugify(text)
        if (depth > 1) headings.push({ depth, id, text })
        const inner = this.parser.parseInline(tokens)
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`
      },
      link({ href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens)
        const target = rewriteHref(href)
        const external = /^https?:\/\//.test(target)
        const attrs = [
          `href="${escapeHtml(target)}"`,
          title ? `title="${escapeHtml(title)}"` : '',
          external ? 'rel="noreferrer"' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return `<a ${attrs}>${inner}</a>`
      },
    },
  })
  return marked
}

// Renders a guide-style document: the first H1 becomes the page title and is
// dropped from the body (the layout renders it), the first paragraph becomes
// the meta description, and H2/H3 anchors are collected for the sidebar.
export function renderDocument(markdown: string): Rendered {
  const headings: Heading[] = []
  const marked = createMarked(headings)
  const tokens = marked.lexer(markdown)

  let title = ''
  let description = ''
  const body: Token[] = []
  for (const token of tokens) {
    if (!title && token.type === 'heading' && token.depth === 1) {
      title = plainText(token.tokens)
      continue
    }
    if (!description && token.type === 'paragraph') {
      description = plainText(token.tokens).replace(/\s+/g, ' ').trim()
    }
    body.push(token)
  }

  const html = marked.parser(body)
  return { html, title, description, headings }
}

// Renders a fragment (an FAQ answer, a release note) with no title handling.
export function renderFragment(markdown: string): string {
  return createMarked([]).parse(markdown, { async: false })
}

// A line of UI copy outside .prose, where nothing styles a bare <code> or <a>:
// code spans and links carry the utility classes the page markup uses.
export function renderInline(markdown: string): string {
  const marked = new Marked({ gfm: true })
  marked.use({
    renderer: {
      codespan({ text }: Tokens.Codespan) {
        return `<code class="inline-code">${escapeHtml(text)}</code>`
      },
      link({ href, tokens }: Tokens.Link) {
        return `<a href="${escapeHtml(rewriteHref(href))}" class="text-accent">${this.parser.parseInline(tokens)}</a>`
      },
    },
  })
  return marked.parseInline(markdown, { async: false })
}

// Markdown served to agents is read away from the site, so its links have to
// stand alone: guide cross-links, site paths and in-page anchors (resolved
// against the page's own path) become absolute URLs. Fenced code is left as
// written.
export function absoluteLinks(markdown: string, pagePath: string): string {
  return markdown
    .split(/^(```[\s\S]*?^```)/m)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(/\]\(([^)\s]+)\)/g, (_, href: string) => `](${absoluteHref(href, pagePath)})`),
    )
    .join('')
}

function absoluteHref(href: string, pagePath: string): string {
  const target = href.startsWith('#') ? `${pagePath}${href}` : rewriteHref(href)
  return target.startsWith('/') ? absoluteUrl(target) : target
}

// The link and image targets in a markdown document outside fenced code,
// including links with a title that absoluteLinks leaves alone.
export function linkTargets(markdown: string): string[] {
  return [...markdown.replace(/^```[\s\S]*?^```/gm, '').matchAll(/\]\(\s*([^)\s]+)/g)].map((m) => m[1])
}

// Reads the text off the markdown tokens instead of stripping tags from
// rendered HTML: one regex pass can leave a `<script` behind, and the
// round-trip would also carry escaped entities into what callers treat as
// plain text.
export function stripMarkdown(markdown: string): string {
  return plainText(createMarked([]).lexer(markdown) as Tokens.Generic[])
    .replace(/\s+/g, ' ')
    .trim()
}
