import { defineEventHandler } from 'h3'
import { buildUiSoundDesignMarkdown } from '../utils/agent-docs'
import { setMachineReadableHeaders } from '../utils/machine-response'

export default defineEventHandler((event) => {
  setMachineReadableHeaders(event, 'text/markdown', { indexable: false })
  return buildUiSoundDesignMarkdown()
})
