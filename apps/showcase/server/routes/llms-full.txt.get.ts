import { defineEventHandler } from 'h3'
import { buildLlmsFull } from '../utils/agent-docs'
import { setMachineReadableHeaders } from '../utils/machine-response'

export default defineEventHandler((event) => {
  setMachineReadableHeaders(event, 'text/plain', { indexable: false })
  return buildLlmsFull()
})
