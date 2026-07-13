import { defineEventHandler } from 'h3'
import { CATEGORIES, CUES, PACKS, getPlaybackMode } from '../../../../packages/uisfx/src/catalog'
import { setMachineReadableHeaders } from '../utils/machine-response'

export default defineEventHandler((event) => {
  setMachineReadableHeaders(event, 'application/json', { indexable: false })
  return {
    schemaVersion: 1,
    updated: '2026-07-13',
    product: {
      name: 'UI SFX',
      package: 'uisfx',
      install: 'npm install uisfx',
      website: 'https://uisfx.com/ui-sound-design',
      agentGuide: 'https://uisfx.com/docs/agent-guide.md',
      prompt: 'https://uisfx.com/agent-prompt.txt',
      source: 'https://github.com/romainsimon/uisfx',
      npm: 'https://www.npmjs.com/package/uisfx',
      licenses: { code: 'MIT', audio: 'CC0-1.0' },
    },
    assetPathTemplate: 'sounds/{pack}/{cue}.{mp3|ogg}',
    assetPathScope: 'Paths resolve inside the uisfx npm package; they are not website media URLs.',
    packs: PACKS.map(pack => ({
      name: pack.name,
      label: pack.label,
      description: pack.description,
      bestFor: pack.bestFor,
    })),
    categories: CATEGORIES,
    cues: CUES.map(cue => ({
      name: cue.name,
      label: cue.label,
      category: cue.category,
      description: cue.description,
      playback: getPlaybackMode(cue.name),
      nominalDurationSeconds: cue.duration,
      defaultVolume: cue.defaultVolume,
    })),
    completeAssetManifest: 'https://uisfx.com/uisfx-manifest.json',
  }
})
