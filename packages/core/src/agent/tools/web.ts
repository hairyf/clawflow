/**
 * Web tools: web_search (Brave), web_fetch (ofetch + simple extract).
 * @see sources/nanobot/nanobot/agent/tools/web.py
 */

import type { Tool } from './base'
import process from 'node:process'
import { ofetch } from 'ofetch'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0'

export function webSearchTool(apiKey?: string, maxResults = 5): Tool {
  const key = apiKey ?? process.env.BRAVE_API_KEY ?? ''
  return {
    name: 'web_search',
    description: 'Search the web. Returns titles, URLs, and snippets.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        count: { type: 'number', description: 'Results 1-10', minimum: 1, maximum: 10 },
      },
      required: ['query'],
    },
    async execute({ query, count }: Record<string, unknown>) {
      if (!key)
        return 'Error: BRAVE_API_KEY not configured'
      const n = Math.min(Math.max(Number(count) || maxResults, 1), 10)
      try {
        const r = await ofetch<{ web?: { results?: Array<{ title?: string, url?: string, description?: string }> } }>(
          'https://api.search.brave.com/res/v1/web/search',
          {
            params: { q: query, count: n },
            headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
            timeout: 10000,
          },
        )
        const results = r.web?.results ?? []
        if (results.length === 0)
          return `No results for: ${query}`
        const lines = [`Results for: ${query}`]
        results.slice(0, n).forEach((item, i) => {
          lines.push(`${i + 1}. ${item.title ?? ''}\n   ${item.url ?? ''}`)
          if (item.description)
            lines.push(`   ${item.description}`)
        })
        return lines.join('\n')
      }
      catch (e: any) {
        return `Error: ${e?.message ?? e}`
      }
    },
  }
}

export function webFetchTool(maxChars = 50000): Tool {
  return {
    name: 'web_fetch',
    description: 'Fetch URL and return readable text (truncated).',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
      },
      required: ['url'],
    },
    async execute({ url }: Record<string, unknown>) {
      const u = String(url)
      if (!/^https?:\/\//i.test(u))
        return JSON.stringify({ error: 'Only http/https allowed', url: u })
      try {
        const text = await ofetch(u, {
          headers: { 'User-Agent': USER_AGENT },
          timeout: 30000,
          responseType: 'text',
        }) as string
        const truncated = text.length > maxChars
        const body = truncated ? text.slice(0, maxChars) : text
        return JSON.stringify({
          url: u,
          status: 200,
          truncated,
          length: body.length,
          text: body,
        })
      }
      catch (e: any) {
        return JSON.stringify({ error: e?.message ?? String(e), url: u })
      }
    },
  }
}
