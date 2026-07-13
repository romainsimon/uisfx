import { defineEventHandler, getQuery } from 'h3'
import { buildAgentGuide, resolvePack } from '../../utils/agent-docs'
import { setMachineReadableHeaders } from '../../utils/machine-response'

export default defineEventHandler((event) => {
  const pack = resolvePack(getQuery(event).pack)
  setMachineReadableHeaders(event, 'text/markdown', { maxAge: 3600 })
  return buildAgentGuide(pack)
})
