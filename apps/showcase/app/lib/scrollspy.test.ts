import assert from 'node:assert/strict'
import test from 'node:test'
import { findActiveSection } from './scrollspy'

const sections = [
  { id: 'definition', top: -420 },
  { id: 'listen', top: 120 },
  { id: 'when', top: 640 },
] as const

test('selects the last section that crossed the reading line', () => {
  assert.equal(findActiveSection(sections, 160), 'listen')
})

test('keeps the first section active before its heading reaches the reading line', () => {
  assert.equal(findActiveSection(sections, -500), 'definition')
})

test('keeps the final section active below the final heading', () => {
  assert.equal(findActiveSection(sections, 900), 'when')
})
