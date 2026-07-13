import { defineEventHandler } from 'h3'
import { buildPublicManifest } from '../utils/library-manifest'
import { setMachineReadableHeaders } from '../utils/machine-response'

export default defineEventHandler((event) => {
  setMachineReadableHeaders(event, 'application/json', { indexable: false, maxAge: 86400 })
  return buildPublicManifest()
})
