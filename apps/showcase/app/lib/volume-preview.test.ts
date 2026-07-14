import assert from 'node:assert/strict'
import test from 'node:test'
import { scalePreviewVolume, VOLUME_PREVIEW_PLAY_OPTIONS } from './volume-preview'

test('scales a cue from silence to its intended volume', () => {
  assert.equal(scalePreviewVolume(0.2, 0), 0)
  assert.equal(scalePreviewVolume(0.2, 0.5), 0.1)
  assert.equal(scalePreviewVolume(0.2, 1), 0.2)
})

test('clamps invalid or out-of-range volume values', () => {
  assert.equal(scalePreviewVolume(0.2, -1), 0)
  assert.equal(scalePreviewVolume(0.2, 2), 0.2)
  assert.equal(scalePreviewVolume(Number.NaN, 0.5), 0)
})

test('restarts rapid volume previews without stacking them', () => {
  assert.deepEqual(VOLUME_PREVIEW_PLAY_OPTIONS, {
    retrigger: 'restart',
    cooldownMs: 45,
  })
})
