import {
  COMPARE_HEADINGS,
  COMPARE_INDEX,
  COMPARE_PAGES,
  REVIEWED_ON,
  ROWS,
  ROW_GROUPS,
  TOOLS,
  type Cell,
  type ComparePage,
  type ToolId,
} from '../data/compare'
import { FAQ, FAQ_PAGE } from '../data/faq'
import { FEATURE_LIST } from '../data/features'
import { INSTALL_PAGE, INSTALL_PLATFORMS, INSTALL_REQUIREMENTS, INSTALL_UPDATE, INSTALL_VERIFY } from '../data/install'
import { CHANGELOG_PAGE, changelogEntries, formatDate } from './changelog'
import { latestRelease } from './github'
import { DOCS_PAGE, GUIDES, GUIDE_GROUPS, loadGuideMarkdown } from './guides'
import { absoluteLinks, linkTargets } from './markdown'
import { REPO_URL, SITE, SITE_REPO_URL, absoluteUrl } from './site'

// llms.txt (llmstxt.org) asks for a clean markdown version of every page an
// agent might need, at the page URL with index.md appended when the URL has
// no file name. Every page here is a directory URL, so /docs/helm/ is also
// served as markdown at /docs/helm/index.md, rendered from the same data and
// guide files as the HTML.
export function markdownPath(path: string): string {
  return `${path}index.md`
}

type MarkdownSource = {
  path: string
  // Release notes come from the GitHub API and may carry links this site
  // cannot resolve; every other document must stand alone.
  external?: boolean
  render: () => Promise<string>
}

const SOURCES: MarkdownSource[] = [
  { path: '/install/', render: installMarkdown },
  { path: '/docs/', render: docsIndexMarkdown },
  ...GUIDES.map((g) => ({ path: `/docs/${g.slug}/`, render: () => loadGuideMarkdown(g.slug) })),
  { path: '/faq/', render: faqMarkdown },
  { path: '/compare/', render: compareIndexMarkdown },
  ...COMPARE_PAGES.map((p) => ({ path: `/compare/${p.slug}/`, render: () => compareMarkdown(p) })),
  { path: '/changelog/', external: true, render: changelogMarkdown },
]

export const MARKDOWN_PATHS: ReadonlySet<string> = new Set(SOURCES.map((s) => s.path))

export function markdownRoutes() {
  return SOURCES.map((s) => ({ params: { page: `${s.path.slice(1)}index` }, props: { path: s.path } }))
}

export async function pageMarkdown(path: string): Promise<string> {
  const source = SOURCES.find((s) => s.path === path)
  if (!source) throw new Error(`no markdown version for ${path}`)
  const markdown = absoluteLinks((await source.render()).trim(), path)
  if (!source.external) {
    const loose = linkTargets(markdown).filter((href) => !/^(https?:|mailto:)/.test(href))
    if (loose.length) throw new Error(`markdown for ${path} has links that only resolve on the site: ${loose.join(', ')}`)
  }
  return `${markdown}\n`
}

const doc = (...blocks: (string | undefined)[]) => blocks.filter(Boolean).join('\n\n')
const list = (items: string[]) => items.map((item) => `- ${item}`).join('\n')
const link = (label: string, url: string, note: string) => `[${label}](${url}): ${note}`

// The heading each guide carries in docs/guide, so a list reads the way the
// page does rather than the way its slug is spelled.
async function guideTitle(slug: string): Promise<string> {
  const heading = (await loadGuideMarkdown(slug)).match(/^#\s+(.+)$/m)
  if (!heading) throw new Error(`guide "${slug}" has no H1 title`)
  return heading[1].trim()
}

// Command blocks are HTML for the copy-button component, built from the
// site's own constants. Agents get the commands without prompts, comments
// kept, in a fenced block.
function commandMarkdown(html: string): string {
  const lang = html.includes('PS&gt; ') ? 'powershell' : 'sh'
  const text = html
    .replace(/<span class="prompt">[^<]*<\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
  return `\`\`\`${lang}\n${text}\n\`\`\``
}

async function installMarkdown(): Promise<string> {
  const release = await latestRelease()
  const blocks = [`# ${INSTALL_PAGE.title}`, `> ${INSTALL_PAGE.lede(release?.tag)}`]
  for (const platform of INSTALL_PLATFORMS) {
    blocks.push(`## ${platform.title}`, platform.summary)
    for (const step of platform.steps) {
      if ('label' in step) blocks.push(`### ${step.label}`)
      else if ('command' in step) blocks.push(commandMarkdown(step.command))
      else blocks.push('lead' in step ? step.lead : step.note)
    }
  }
  blocks.push(`## ${INSTALL_UPDATE.title}`, INSTALL_UPDATE.intro)
  for (const channel of INSTALL_UPDATE.channels) blocks.push(`${channel.label}:`, commandMarkdown(channel.command))
  blocks.push(INSTALL_UPDATE.note)
  blocks.push(`## ${INSTALL_VERIFY.title}`, INSTALL_VERIFY.intro, commandMarkdown(INSTALL_VERIFY.command))
  blocks.push(`## ${INSTALL_REQUIREMENTS.title}`, list(INSTALL_REQUIREMENTS.items), INSTALL_REQUIREMENTS.note)
  return doc(...blocks)
}

async function docsIndexMarkdown(): Promise<string> {
  const groups = await Promise.all(
    GUIDE_GROUPS.map(async (group) => {
      const items = await Promise.all(
        group.guides.map(async (g) => link(await guideTitle(g.slug), absoluteUrl(`/docs/${g.slug}/`), g.summary)),
      )
      return doc(`## ${group.name.charAt(0).toUpperCase()}${group.name.slice(1)}`, list(items))
    }),
  )
  return doc(`# ${DOCS_PAGE.title}`, `> ${DOCS_PAGE.lede}`, ...groups)
}

async function faqMarkdown(): Promise<string> {
  return doc(`# ${FAQ_PAGE.title}`, `> ${FAQ_PAGE.lede}`, ...FAQ.flatMap((f) => [`## ${f.question}`, f.answer]))
}

function cellText(cell: Cell): string {
  return (cell.sub ? `${cell.text}. ${cell.sub}` : cell.text).replaceAll('|', '\\|')
}

// One table per row group, as on the page, with the sub-line folded into
// the cell after a full stop.
function compareTables(tools: ToolId[]): string {
  return doc(
    ...ROW_GROUPS.flatMap((group) => {
      const rows = ROWS.filter((row) => row.group === group.id)
      if (rows.length === 0) return []
      const table = [
        `| Criterion | ${tools.map((id) => TOOLS[id].name).join(' | ')} |`,
        `| --- | ${tools.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.label} | ${tools.map((id) => cellText(row.cells[id])).join(' | ')} |`),
      ]
      return [`### ${group.label}`, table.join('\n')]
    }),
  )
}

async function compareIndexMarkdown(): Promise<string> {
  const pages = COMPARE_PAGES.map((p) => link(p.heading, absoluteUrl(`/compare/${p.slug}/`), TOOLS[p.tool].summary))
  return doc(
    `# ${COMPARE_INDEX.title}`,
    `> ${COMPARE_INDEX.lede}`,
    `## ${COMPARE_HEADINGS.glance}`,
    `${ROWS.length} rows, reviewed ${REVIEWED_ON}.`,
    compareTables(Object.keys(TOOLS) as ToolId[]),
    `## ${COMPARE_HEADINGS.pages}`,
    COMPARE_INDEX.pagesLede,
    list(pages),
    `## ${COMPARE_HEADINGS.method}`,
    ...COMPARE_INDEX.method,
  )
}

async function compareMarkdown(page: ComparePage): Promise<string> {
  const tool = TOOLS[page.tool]
  return doc(
    `# ${page.title}`,
    `> ${page.description}`,
    ...page.intro,
    `## ${COMPARE_HEADINGS.glance}`,
    compareTables(['klustr', page.tool]),
    `[${tool.name} website](${tool.url})`,
    `## ${COMPARE_HEADINGS.different}`,
    list(page.different),
    `## ${COMPARE_HEADINGS.stronger(tool.name)}`,
    list(page.stronger),
    `## ${COMPARE_HEADINGS.which}`,
    page.verdict,
  )
}

async function changelogMarkdown(): Promise<string> {
  const entries = await changelogEntries()
  const releases = entries.flatMap((e) => [
    `## ${e.tag}${e.prerelease ? ' (pre-release)' : ''}`,
    `${e.date}. [${CHANGELOG_PAGE.assets}](${e.url})`,
    e.notes,
  ])
  return doc(
    `# ${CHANGELOG_PAGE.title}`,
    `> ${CHANGELOG_PAGE.lede}`,
    ...(entries.length === 0 ? [CHANGELOG_PAGE.unavailable] : [...releases, CHANGELOG_PAGE.older]),
  )
}

async function releaseLine(): Promise<string | undefined> {
  const release = await latestRelease()
  return release && `The latest release is ${release.tag}, published ${formatDate(release.publishedAt)}.`
}

export async function llmsTxt(): Promise<string> {
  const md = (path: string) => absoluteUrl(markdownPath(path))
  const docs = await Promise.all(
    GUIDE_GROUPS.map(async (group) => {
      const items = await Promise.all(
        group.guides.map(async (g) => link(await guideTitle(g.slug), md(`/docs/${g.slug}/`), g.summary)),
      )
      return doc(`## Docs: ${group.name}`, list(items))
    }),
  )

  return `${doc(
    `# ${SITE.name}`,
    `> ${SITE.description}`,
    "Klustr is a desktop application, not a service and not an in-cluster component. It reads the user's kubeconfig and drives the standard Kubernetes API directly, the way kubectl does, so there is no agent, operator, CRD or sign-in. The backend is Go with client-go; the window is Wails with a React frontend.",
    await releaseLine(),
    `What it does:\n\n${list(FEATURE_LIST)}`,
    `Every link below is the markdown version of a page on klustr.dev. Each of those pages serves it at its own URL plus \`index.md\` (${absoluteUrl('/docs/helm/')} is ${md('/docs/helm/')}) and points to it with \`<link rel="alternate" type="text/markdown">\`; links inside the documents go to the HTML pages. The install steps, every guide, the FAQ and the comparisons are also in one file at ${absoluteUrl('/llms-full.txt')}.`,
    '## Pages',
    list([
      link(
        'Install',
        md('/install/'),
        'Homebrew, the AUR package, the .deb, the tarballs, the Windows zip and building from source; updating, verifying a download and the requirements.',
      ),
      link('FAQ', md('/faq/'), 'What Klustr installs, which platforms it runs on, how it authenticates, telemetry and what it costs.'),
      link('Documentation index', md('/docs/'), 'All task-focused guides, grouped.'),
    ]),
    ...docs,
    '## Comparisons',
    list([
      link(
        'All comparisons',
        md('/compare/'),
        `Klustr next to Lens, k9s, Headlamp and Kubernetes Dashboard, row by row, reviewed ${REVIEWED_ON}.`,
      ),
      ...COMPARE_PAGES.map((p) => link(p.heading, md(`/compare/${p.slug}/`), TOOLS[p.tool].summary)),
    ]),
    '## Optional',
    list([
      link('Changelog', md('/changelog/'), 'Release notes for the 20 most recent releases, newest first.'),
      link('Full text', absoluteUrl('/llms-full.txt'), 'The install steps, every guide, the FAQ and the comparisons in one file.'),
      link('Source repository', REPO_URL, 'Go backend, React frontend, Apache-2.0 licensed.'),
      link('Site repository', SITE_REPO_URL, "The site's source, with the guides as markdown under docs/guide (CC-BY-4.0)."),
    ]),
  )}\n`
}

// The pages llms-full.txt carries in full. The docs index and the changelog
// are left out: one only lists the guides that follow, the other changes with
// every release and is linked from llms.txt instead.
const FULL_TEXT_PATHS = [
  '/install/',
  ...GUIDES.map((g) => `/docs/${g.slug}/`),
  '/faq/',
  '/compare/',
  ...COMPARE_PAGES.map((p) => `/compare/${p.slug}/`),
]

export async function llmsFullTxt(): Promise<string> {
  const sections = await Promise.all(
    FULL_TEXT_PATHS.map(async (path) =>
      (await pageMarkdown(path)).trim().replace(/^(# .+)$/m, `$1\n\nSource: ${absoluteUrl(path)}`),
    ),
  )
  const header = doc(
    `# ${SITE.name} documentation`,
    `> ${SITE.description}`,
    `This file is the full text of the Klustr site: the install steps, every user guide in the order of the documentation index, the FAQ and the comparisons, each under its own H1 with the page it comes from. The short index, with a markdown link for every page, is at ${absoluteUrl('/llms.txt')}.`,
    await releaseLine(),
    `The guides are licensed [CC-BY-4.0](${SITE_REPO_URL}/blob/main/docs/guide/LICENSE); the install, FAQ and comparison text is part of the site's [Apache-2.0](${SITE_REPO_URL}/blob/main/LICENSE) source.`,
  )
  return `${[header, ...sections].join('\n\n---\n\n')}\n`
}
