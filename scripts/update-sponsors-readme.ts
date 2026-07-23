import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { flattenSponsors, normalizeSponsorsData, type SponsorTier } from '../apps/showcase/app/lib/sponsors'

const SPONSORS_ENDPOINT = 'https://yukicapital.com/api/sponsors'
const SPONSOR_URL = 'https://github.com/sponsors/romainsimon'
const MARKER = 'uisfx-sponsors'
const readmePath = resolve(import.meta.dirname, '..', 'README.md')

const logoSizes: Record<SponsorTier, number> = {
  founding: 150,
  premier: 120,
  sponsor: 88,
  backer: 56,
  supporter: 40,
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const response = await fetch(SPONSORS_ENDPOINT, {
  headers: { accept: 'application/json' },
  signal: AbortSignal.timeout(8_000),
})
if (!response.ok) throw new Error(`Sponsor feed returned ${response.status}`)

const sponsors = flattenSponsors(normalizeSponsorsData(await response.json()))
const content = sponsors.length
  ? sponsors.map((sponsor) => {
      const name = escapeHtml(sponsor.name)
      const tier = escapeHtml(sponsor.tier)
      const body = sponsor.logo
        ? `<img src="${escapeHtml(sponsor.logo)}" width="${logoSizes[sponsor.tier]}" alt="${name}" title="${name}, ${tier} sponsor" />`
        : `<strong>${name}</strong>`
      return `<a href="${escapeHtml(sponsor.url)}">${body}</a>`
    }).join('&nbsp;&nbsp;\n')
  : `<sub>Become the first <a href="${SPONSOR_URL}">UI SFX sponsor</a>.</sub>`

const readme = await readFile(readmePath, 'utf8')
const markerExpression = new RegExp(`<!-- ${MARKER} -->[\\s\\S]*?<!-- ${MARKER} -->`)
if (!markerExpression.test(readme)) throw new Error(`README is missing the ${MARKER} markers`)

const updated = readme.replace(markerExpression, `<!-- ${MARKER} -->${content}<!-- ${MARKER} -->`)
await writeFile(readmePath, updated)
console.log(`README sponsor wall updated with ${sponsors.length} sponsor${sponsors.length === 1 ? '' : 's'}`)

