import { defineEventHandler } from 'h3'
import { buildCatalogMarkdown, getRequestedPack, sendMarkdown } from '../utils/agent-docs'

export default defineEventHandler((event) => {
  const pack = getRequestedPack(event)
  return sendMarkdown(event, buildCatalogMarkdown({ pack }))
})
