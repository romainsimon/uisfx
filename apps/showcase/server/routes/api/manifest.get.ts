import { defineEventHandler } from 'h3'
import { buildPublicManifest, getRequestedPack, sendJson } from '../../utils/agent-docs'

export default defineEventHandler((event) => {
  const pack = getRequestedPack(event)
  return sendJson(event, buildPublicManifest({ pack }))
})
