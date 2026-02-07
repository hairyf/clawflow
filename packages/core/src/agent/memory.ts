/**
 * Memory store: daily notes + long-term MEMORY.md.
 * @see sources/nanobot/nanobot/agent/memory.py
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'
import { ensureDir, todayDate } from '../utils/helpers'

export class MemoryStore {
  private memoryDir: string
  private memoryFile: string

  constructor(workspace: string) {
    this.memoryDir = ensureDir(join(workspace, 'memory'))
    this.memoryFile = join(this.memoryDir, 'MEMORY.md')
  }

  getTodayFile(): string {
    return join(this.memoryDir, `${todayDate()}.md`)
  }

  readToday(): string {
    const path = this.getTodayFile()
    if (existsSync(path))
      return readFileSync(path, 'utf-8')
    return ''
  }

  /** Append content to today's memory notes. Creates file with header if missing. */
  appendToday(content: string): void {
    const path = this.getTodayFile()
    if (existsSync(path)) {
      const existing = readFileSync(path, 'utf-8')
      content = `${existing}\n${content}`
    }
    else {
      content = `# ${todayDate()}\n\n${content}`
    }
    writeFileSync(path, content, 'utf-8')
  }

  readLongTerm(): string {
    if (existsSync(this.memoryFile))
      return readFileSync(this.memoryFile, 'utf-8')
    return ''
  }

  writeLongTerm(content: string): void {
    writeFileSync(this.memoryFile, content, 'utf-8')
  }

  /** Get memories from the last N days (YYYY-MM-DD.md), joined by "---". */
  getRecentMemories(days: number = 7): string {
    const parts: string[] = []
    const today = new Date()
    for (let i = 0; i < days; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const path = join(this.memoryDir, `${dateStr}.md`)
      if (existsSync(path))
        parts.push(readFileSync(path, 'utf-8'))
    }
    return parts.join('\n\n---\n\n')
  }

  /** List all daily memory files (YYYY-MM-DD.md) sorted by date newest first. */
  listMemoryFiles(): string[] {
    if (!existsSync(this.memoryDir))
      return []
    const daily = /^\d{4}-\d{2}-\d{2}\.md$/
    const files = readdirSync(this.memoryDir)
      .filter(f => daily.test(f))
      .sort((a, b) => b.localeCompare(a))
    return files.map(f => join(this.memoryDir, f))
  }

  getMemoryContext(): string {
    const parts: string[] = []
    const long = this.readLongTerm()
    if (long)
      parts.push(`## Long-term Memory\n${long}`)
    const today = this.readToday()
    if (today)
      parts.push(`## Today's Notes\n${today}`)
    return parts.join('\n\n')
  }
}
