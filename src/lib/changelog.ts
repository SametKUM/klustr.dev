import { fetchReleases, type Release } from './github'
import { slugify } from './markdown'
import { RELEASES_URL } from './site'

export const CHANGELOG_PAGE = {
  title: 'Changelog',
  lede: 'Every tagged release, newest first, as published on GitHub. Homebrew, the AUR package and the .deb follow each tag automatically.',
  assets: 'Assets and install steps on GitHub',
  older: `Older releases are on [GitHub](${RELEASES_URL}).`,
  unavailable: `The release list could not be fetched while this page was built. The full history is on [GitHub Releases](${RELEASES_URL}).`,
}

export type ChangelogEntry = Release & {
  id: string
  date: string
  // The release notes as markdown, ready to render under a per-release H2.
  notes: string
}

// Every release ends with the same Install and Verify blocks; the landing
// page already covers those, so the changelog keeps only what changed.
function stripInstallBlock(markdown: string): string {
  const at = markdown.search(/^## Install\b/m)
  return at === -1 ? markdown : markdown.slice(0, at).trimEnd()
}

// Release notes carry their own headings ("What's changed"); push them below
// the per-release H2 so the page outline stays one level per release.
function demote(markdown: string): string {
  return markdown.replace(/^(#{1,4})\s/gm, '$1## ')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function changelogEntries(): Promise<ChangelogEntry[]> {
  const releases = (await fetchReleases()).slice(0, 20)
  return releases.map((r) => ({
    ...r,
    id: slugify(r.tag),
    date: formatDate(r.publishedAt),
    notes: demote(stripInstallBlock(r.body)),
  }))
}
