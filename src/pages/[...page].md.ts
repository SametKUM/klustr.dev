import type { APIRoute } from 'astro'
import { markdownRoutes, pageMarkdown } from '../lib/llms'

export function getStaticPaths() {
  return markdownRoutes()
}

export const GET: APIRoute = async ({ props }) =>
  new Response(await pageMarkdown(props.path), { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
