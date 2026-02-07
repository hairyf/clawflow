/**
 * WhatsApp WebSocket bridge: Baileys + crossws server.
 * Channel clients (e.g. WhatsAppChannel) connect to this server.
 * @see sources/nanobot/bridge
 */

import type { BridgeConfig } from '../config/schema'
import { webcrypto } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { BridgeServer } from './server'

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto
}

export { BridgeServer } from './server'
export type { BridgeMessage, InboundMessage, SendCommand } from './types'
export { WhatsAppClient } from './whatsapp'

/** Resolve authDir (expand ~) */
function resolveAuthDir(authDir: string): string {
  const dir = authDir.startsWith('~') ? join(homedir(), authDir.slice(1)) : authDir
  return dir
}

/** Start bridge server (used by CLI and gateway). */
export async function startBridge(config: BridgeConfig): Promise<BridgeServer> {
  const port = config.port ?? 3001
  const authDir = resolveAuthDir(config.authDir ?? '~/.clawflow/whatsapp-auth')
  const server = new BridgeServer({ port, authDir })
  await server.start()
  return server
}
