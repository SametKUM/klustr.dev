import { SITE } from './site'

// Custom Umami events. Every name and payload is declared here so names stay
// consistent across components. Payloads carry fixed values from the site's
// own markup, never anything the visitor typed: Umami already records the
// page, referrer, country, browser and OS.
export type AnalyticsEvents = {
  download: { placement: string }
  'install-copy': { method: string; step: number }
  'install-tab': { tab: string; detected: string }
  'demo-play': { clip: string }
  outbound: { target: OutboundTarget; placement: string; host?: string }
}

export type OutboundTarget = 'repo' | 'issues' | 'releases' | 'source' | 'site-repo' | 'other'

type LinkEvent =
  | { name: 'download' }
  | { name: 'outbound'; target: OutboundTarget; host?: string }

declare global {
  interface Window {
    umami?: { track: (name: string, data?: object) => void }
  }
}

export function track<K extends keyof AnalyticsEvents>(name: K, data: AnalyticsEvents[K]): void {
  try {
    window.umami?.track(name, data)
  } catch {}
}

export function classifyLink(url: URL, origin: string): LinkEvent | null {
  if (url.origin === origin) return null
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.hostname !== 'github.com') return { name: 'outbound', target: 'other', host: url.hostname }

  const [owner = '', repo = '', section = '', sub = ''] = url.pathname.split('/').filter(Boolean)
  const slug = `${owner}/${repo}`.toLowerCase()
  if (slug === SITE.siteRepo.toLowerCase()) return { name: 'outbound', target: 'site-repo' }
  if (slug !== SITE.repo.toLowerCase()) return { name: 'outbound', target: 'other', host: url.hostname }

  if (section === 'releases') {
    return sub === 'latest' || sub === 'download' ? { name: 'download' } : { name: 'outbound', target: 'releases' }
  }
  if (section === 'issues') return { name: 'outbound', target: 'issues' }
  if (section === 'blob' || section === 'tree') return { name: 'outbound', target: 'source' }
  return { name: 'outbound', target: 'repo' }
}

function placementOf(el: Element): string {
  return el.closest<HTMLElement>('[data-analytics-placement]')?.dataset.analyticsPlacement ?? 'content'
}

// One passive listener covers every link, so a new GitHub or download link
// needs no wiring. It never delays navigation: the tracker sends with
// keepalive, unlike data-umami-event, which holds the click until it is sent.
export function trackLinks(): void {
  const onClick = (e: MouseEvent) => {
    if (e.type === 'auxclick' && e.button !== 1) return
    const a = (e.target as Element | null)?.closest?.('a[href]')
    if (!(a instanceof HTMLAnchorElement)) return
    let url: URL
    try {
      url = new URL(a.href)
    } catch {
      return
    }
    const event = classifyLink(url, location.origin)
    if (!event) return
    const placement = placementOf(a)
    if (event.name === 'download') track('download', { placement })
    else track('outbound', { target: event.target, placement, ...(event.host ? { host: event.host } : {}) })
  }
  document.addEventListener('click', onClick, { capture: true, passive: true })
  document.addEventListener('auxclick', onClick, { capture: true, passive: true })
}
