import assert from 'node:assert/strict'
import test from 'node:test'
import { resolvePackShortcut } from './pack-shortcut'

test('waits for a possible second digit after 1', () => {
  assert.deepEqual(resolvePackShortcut(false, '1'), { pendingOne: true, indices: [] })
})

test('resolves 10, 11, and 12 as two-digit shortcuts', () => {
  assert.deepEqual(resolvePackShortcut(true, '0'), { pendingOne: false, indices: [9] })
  assert.deepEqual(resolvePackShortcut(true, '1'), { pendingOne: false, indices: [10] })
  assert.deepEqual(resolvePackShortcut(true, '2'), { pendingOne: false, indices: [11] })
})

test('keeps the existing instant aliases and replaces an unmatched leading 1', () => {
  assert.deepEqual(resolvePackShortcut(false, '0'), { pendingOne: false, indices: [9] })
  assert.deepEqual(resolvePackShortcut(false, '-'), { pendingOne: false, indices: [10] })
  assert.deepEqual(resolvePackShortcut(false, '+'), { pendingOne: false, indices: [11] })
  assert.deepEqual(resolvePackShortcut(true, '4'), { pendingOne: false, indices: [3] })
})
