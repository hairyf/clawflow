/**
 * A/B tests: nanobot-pm agent/tools/web ↔ nanobot agent/tools/web.py
 * Uses vi.stubEnv and mock fetch to avoid real API/HTTP.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { webFetchTool, webSearchTool } from '../../../src/agent/tools/web'

const mockOfetch = vi.hoisted(() => vi.fn())

vi.mock('ofetch', () => ({
  ofetch: mockOfetch,
}))

describe('webSearchTool (nanobot a/b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BRAVE_API_KEY', '')
  })

  it('returns error when BRAVE_API_KEY not configured (nanobot)', async () => {
    const tool = webSearchTool()
    const r = await tool.execute({ query: 'test' })
    expect(r).toBe('Error: BRAVE_API_KEY not configured')
    expect(mockOfetch).not.toHaveBeenCalled()
  })

  it('returns No results for empty response (nanobot)', async () => {
    mockOfetch.mockResolvedValueOnce({ web: { results: [] } })
    const tool = webSearchTool('fake-key')
    const r = await tool.execute({ query: 'xyz' })
    expect(r).toBe('No results for: xyz')
  })

  it('returns Results for: query format with title, url, description (nanobot)', async () => {
    mockOfetch.mockResolvedValueOnce({
      web: {
        results: [
          { title: 'A', url: 'https://a.com', description: 'Desc A' },
          { title: 'B', url: 'https://b.com' },
        ],
      },
    })
    const tool = webSearchTool('key')
    const r = await tool.execute({ query: 'test', count: 5 })
    expect(r).toContain('Results for: test')
    expect(r).toContain('1. A')
    expect(r).toContain('https://a.com')
    expect(r).toContain('Desc A')
    expect(r).toContain('2. B')
  })

  it('clamps count to 1-10 (nanobot min/max)', async () => {
    mockOfetch.mockResolvedValueOnce({ web: { results: [{ title: 'X', url: 'u' }] } })
    const tool = webSearchTool('key', 5)
    await tool.execute({ query: 'q', count: 99 })
    expect(mockOfetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      params: expect.objectContaining({ count: 10 }),
    }))
  })
})

describe('webFetchTool (nanobot a/b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for non-http(s) URL (nanobot _validate_url)', async () => {
    const tool = webFetchTool()
    const r = await tool.execute({ url: 'ftp://example.com' })
    const data = JSON.parse(r)
    expect(data.error).toContain('Only http/https')
    expect(data.url).toBe('ftp://example.com')
  })

  it('returns url, status, truncated, length, text on success (nanobot)', async () => {
    mockOfetch.mockResolvedValueOnce('Hello World')
    const tool = webFetchTool()
    const r = await tool.execute({ url: 'https://example.com' })
    const data = JSON.parse(r)
    expect(data.url).toBe('https://example.com')
    expect(data.status).toBe(200)
    expect(data.truncated).toBe(false)
    expect(data.length).toBe(11)
    expect(data.text).toBe('Hello World')
  })

  it('truncates at maxChars', async () => {
    const long = 'x'.repeat(60000)
    mockOfetch.mockResolvedValueOnce(long)
    const tool = webFetchTool(50000)
    const r = await tool.execute({ url: 'https://example.com' })
    const data = JSON.parse(r)
    expect(data.truncated).toBe(true)
    expect(data.length).toBe(50000)
  })

  it('returns error in JSON on fetch failure (nanobot)', async () => {
    mockOfetch.mockRejectedValueOnce(new Error('Connection refused'))
    const tool = webFetchTool()
    const r = await tool.execute({ url: 'https://example.com' })
    const data = JSON.parse(r)
    expect(data.error).toBeTruthy()
    expect(data.url).toBe('https://example.com')
  })
})
