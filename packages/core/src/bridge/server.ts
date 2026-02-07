/**
 * WebSocket bridge server (crossws) for WhatsApp ↔ channel clients.
 * @see sources/nanobot/bridge/src/server.ts
 */

import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import type { BridgeMessage, SendCommand } from './types'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import consola from 'consola'
import crossws from 'crossws/adapters/node'
import { WhatsAppClient } from './whatsapp'

export interface BridgeServerOptions {
  port: number
  authDir: string
}

/** Peer-like with send (crossws peer) */
interface WSPeer {
  send: (data: unknown, options?: { compress?: boolean }) => number
}

export class BridgeServer {
  private httpServer: ReturnType<typeof createServer> | null = null
  private wa: WhatsAppClient | null = null
  private clients = new Set<WSPeer>()
  private broadcastBound = (msg: BridgeMessage): void => this.broadcast(msg)

  constructor(private options: BridgeServerOptions) {}

  async start(): Promise<void> {
    const { port, authDir } = this.options
    const clients = this.clients

    this.wa = new WhatsAppClient({
      authDir,
      onMessage: msg => this.broadcastBound({ type: 'message', ...msg }),
      onQR: qr => this.broadcastBound({ type: 'qr', qr }),
      onStatus: status => this.broadcastBound({ type: 'status', status }),
    })

    const ws = crossws({
      hooks: {
        async upgrade() {
          return {}
        },
        open(peer: WSPeer) {
          clients.add(peer)
        },
        message: (peer: WSPeer, message: { text?: () => string, data?: Buffer | string }): void => {
          const raw = typeof message?.text === 'function' ? message.text() : (message as any)?.data
          const str = raw == null ? '' : (Buffer.isBuffer(raw) ? raw.toString() : String(raw))
          this.handleMessage(peer, str)
        },
        close(peer: WSPeer): void {
          clients.delete(peer)
        },
        error(_peer: WSPeer, _err: Error) {
          // optional hook
        },
      },
    })

    this.httpServer = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('ClawFlow WhatsApp Bridge. Connect via WebSocket.')
    })

    this.httpServer.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      if (req.headers.upgrade === 'websocket') {
        ws.handleUpgrade(req, socket, head)
      }
    })

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, () => {
        consola.log(`🌉 Bridge server listening on ws://localhost:${port}`)
        resolve()
      })
    })

    await this.wa.connect()
  }

  private handleMessage(peer: WSPeer, raw: string): void {
    try {
      const cmd = JSON.parse(raw) as SendCommand
      if (cmd.type === 'send' && this.wa) {
        this.wa.sendMessage(cmd.to, cmd.text).then(() => {
          peer.send(JSON.stringify({ type: 'sent', to: cmd.to }))
        }).catch((err) => {
          peer.send(JSON.stringify({ type: 'error', error: String(err) }))
        })
      }
    }
    catch (err) {
      consola.error('Error handling command:', err)
      peer.send(JSON.stringify({ type: 'error', error: String(err) }))
    }
  }

  private broadcast(msg: BridgeMessage): void {
    const data = JSON.stringify(msg)
    for (const client of this.clients) {
      try {
        client.send(data)
      }
      catch {
        // ignore send errors
      }
    }
  }

  async stop(): Promise<void> {
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve())
      })
      this.httpServer = null
    }
    if (this.wa) {
      await this.wa.disconnect()
      this.wa = null
    }
    this.clients.clear()
  }
}
