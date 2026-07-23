import assert from 'node:assert/strict'
import { emptySponsorsData, flattenSponsors, normalizeSponsorsData } from '../apps/showcase/app/lib/sponsors'

const normalized = normalizeSponsorsData({
  updated_at: '2026-07-13T12:00:00.000Z',
  tiers: {
    founding: [{ name: 'Paper Co', logo: '/logo.svg', url: 'https://paper.example', github: 'paper-co' }],
    premier: [{ name: 'Duplicate', logo: 'https://example.com/logo.png', url: 'https://duplicate.example', github: 'paper-co' }],
    sponsor: [{ name: 'Unsafe', logo: 'javascript:alert(1)', url: 'javascript:alert(1)', github: 'safe-login' }],
  },
})

assert.equal(normalized.updated_at, '2026-07-13T12:00:00.000Z')
assert.equal(normalized.tiers.founding[0]?.logo, 'https://yukicapital.com/logo.svg')
assert.equal(normalized.tiers.premier.length, 0)
assert.equal(normalized.tiers.sponsor[0]?.logo, '')
assert.equal(normalized.tiers.sponsor[0]?.url, 'https://github.com/safe-login')
assert.deepEqual(flattenSponsors(normalized).map(({ tier }) => tier), ['founding', 'sponsor'])

const firstEmpty = emptySponsorsData()
const secondEmpty = emptySponsorsData()
firstEmpty.tiers.supporter.push({ name: 'Test', logo: '', url: 'https://example.com/', github: '' })
assert.equal(secondEmpty.tiers.supporter.length, 0)

console.log('Sponsor feed normalization passed')
