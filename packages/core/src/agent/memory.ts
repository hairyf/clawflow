/**
 * Memory store: daily notes + long-term MEMORY.md.
 * @see sources/nanobot/nanobot/agent/memory.py
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'pathe'
import { ensureDir, todayDate } from '../utils/helpers.js'

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

  readLongTerm(): string {
    if (existsSync(this.memoryFile))
      return readFileSync(this.memoryFile, 'utf-8')
    return ''
  }

  writeLongTerm(content: string): void {
    writeFileSync(this.memoryFile, content, 'utf-8')
  }

  getMemoryContext(): string {
    const parts: string[] = []
    const long = this.readLongTerm()
    if (long)
      parts.push('## Long-term Memory\n' + long)
    const today = this.readToday()
    if (today)
      parts.push("## Today's Notes\n" + today)
    return parts.join('\n\n')
  }
}
