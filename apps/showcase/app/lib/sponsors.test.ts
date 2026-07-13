import assert from 'node:assert/strict'
import test from 'node:test'
import { flattenSponsors, normalizeSponsorsData } from './sponsors'

test('normalizes the public sponsor feed and rejects unsafe entries', () => {
  const normalized = normalizeSponsorsData({
    updated_at: '2026-07-13T12:00:00Z',
    tiers: {
      founding: [
        { name: 'Sound Friend', github: 'sound-friend', logo: 'https://example.com/logo.svg', url: 'https://example.com' },
        { name: 'Unsafe', github: 'unsafe', logo: 'javascript:alert(1)', url: 'javascript:alert(1)' },
      ],
      sponsor: [
        { name: 'Duplicate', github: 'sound-friend', url: 'https://duplicate.example' },
      ],
    },
  })

  assert.equal(normalized.updated_at, '2026-07-13T12:00:00.000Z')
  assert.equal(normalized.tiers.founding.length, 2)
  assert.equal(normalized.tiers.founding[1]?.url, 'https://github.com/unsafe')
  assert.equal(normalized.tiers.founding[1]?.logo, '')
  assert.equal(normalized.tiers.sponsor.length, 0)
  assert.deepEqual(flattenSponsors(normalized).map(sponsor => sponsor.tier), ['founding', 'founding'])
})
