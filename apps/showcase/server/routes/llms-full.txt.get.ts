import { defineEventHandler } from 'h3'
import { buildLlmsFull, getRequestedPack, sendText } from '../utils/agent-docs'

export default defineEventHandler((event) => {
  const pack = getRequestedPack(event)
  return sendText(event, buildLlmsFull({ pack }))
})
