/**
 * Bridge message types (WebSocket JSON).
 * @see sources/nanobot/bridge/src/server.ts
 */

export interface SendCommand {
  type: 'send'
  to: string
  text: string
}

export interface BridgeMessage {
  type: 'message' | 'status' | 'qr' | 'error' | 'sent'
  id?: string
  sender?: string
  content?: string
  timestamp?: number
  isGroup?: boolean
  qr?: string
  status?: string
  error?: string
  to?: string
  [key: string]: unknown
}

export interface InboundMessage {
  id: string
  sender: string
  content: string
  timestamp: number
  isGroup: boolean
}
