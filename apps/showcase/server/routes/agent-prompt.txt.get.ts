import { defineEventHandler, getQuery } from 'h3'
import { buildAgentImplementationPrompt } from '../../app/lib/agent-prompt'
import { resolvePack } from '../utils/agent-docs'
import { setMachineReadableHeaders } from '../utils/machine-response'

export default defineEventHandler((event) => {
  const pack = resolvePack(getQuery(event).pack)
  setMachineReadableHeaders(event, 'text/plain', { indexable: false })
  return buildAgentImplementationPrompt(pack)
})
