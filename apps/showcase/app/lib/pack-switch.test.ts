import assert from 'node:assert/strict'
import test from 'node:test'
import { planPackSwitch } from './pack-switch'

test('restarts the active loop in the newly selected feel', () => {
  const plan = planPackSwitch({
    nextPack: 'soft',
    previewCue: 'select',
    activeLoop: { cue: 'processing', pack: 'minimal' },
  })

  assert.deepEqual(plan, {
    kind: 'restart-loop',
    cue: 'processing',
    pack: 'soft',
  })
})

test('previews the requested cue when no loop is active', () => {
  const plan = planPackSwitch({
    nextPack: 'glass',
    previewCue: 'select',
    activeLoop: null,
  })

  assert.deepEqual(plan, {
    kind: 'preview',
    cue: 'select',
    pack: 'glass',
  })
})

test('keeps the active loop when its current feel is selected again', () => {
  const plan = planPackSwitch({
    nextPack: 'minimal',
    previewCue: 'select',
    activeLoop: { cue: 'loading', pack: 'minimal' },
  })

  assert.deepEqual(plan, {
    kind: 'keep-loop',
    cue: 'loading',
    pack: 'minimal',
  })
})

test('lets an explicit preview replace or stop the active loop', () => {
  const plan = planPackSwitch({
    nextPack: 'minimal',
    previewCue: 'success',
    activeLoop: { cue: 'loading', pack: 'minimal' },
    preserveActiveLoop: false,
  })

  assert.deepEqual(plan, {
    kind: 'preview',
    cue: 'success',
    pack: 'minimal',
  })
})
