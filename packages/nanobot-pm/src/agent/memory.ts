/**
 * Memory store: daily notes + long-term MEMORY.md.
 * @see sources/nanobot/nanobot/agent/memory.py
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'
import { ensure_dir, today_date } from '../utils/helpers'

export class MemoryStore {
  private memory_dir: string
  private memory_file: string

  constructor(workspace: string) {
    this.memory_dir = ensure_dir(join(workspace, 'memory'))
    this.memory_file = join(this.memory_dir, 'MEMORY.md')
  }

  get_today_file(): string {
    return join(this.memory_dir, `${today_date()}.md`)
  }

  read_today(): string {
    const path = this.get_today_file()
    if (existsSync(path))
      return readFileSync(path, 'utf-8')
    return ''
  }

  /** Append content to today's memory notes. Creates file with header if missing. */
  append_today(content: string): void {
    const path = this.get_today_file()
    if (existsSync(path)) {
      const existing = readFileSync(path, 'utf-8')
      content = `${existing}\n${content}`
    }
    else {
      content = `# ${today_date()}\n\n${content}`
    }
    writeFileSync(path, content, 'utf-8')
  }

  read_long_term(): string {
    if (existsSync(this.memory_file))
      return readFileSync(this.memory_file, 'utf-8')
    return ''
  }

  write_long_term(content: string): void {
    writeFileSync(this.memory_file, content, 'utf-8')
  }

  /** Get memories from the last N days (YYYY-MM-DD.md), joined by "---". */
  get_recent_memories(days: number = 7): string {
    const parts: string[] = []
    const today = new Date()
    for (let i = 0; i < days; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const path = join(this.memory_dir, `${dateStr}.md`)
      if (existsSync(path))
        parts.push(readFileSync(path, 'utf-8'))
    }
    return parts.join('\n\n---\n\n')
  }

  /** List all daily memory files (YYYY-MM-DD.md) sorted by date newest first. */
  list_memory_files(): string[] {
    if (!existsSync(this.memory_dir))
      return []
    const daily = /^\d{4}-\d{2}-\d{2}\.md$/
    const files = readdirSync(this.memory_dir)
      .filter(f => daily.test(f))
      .sort((a, b) => b.localeCompare(a))
    return files.map(f => join(this.memory_dir, f))
  }

  get_memory_context(): string {
    const parts: string[] = []
    const long = this.read_long_term()
    if (long)
      parts.push(`## Long-term Memory\n${long}`)
    const today = this.read_today()
    if (today)
      parts.push(`## Today's Notes\n${today}`)
    return parts.join('\n\n')
  }
}
