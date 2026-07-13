export const SPONSOR_TIERS = ['founding', 'premier', 'sponsor', 'backer', 'supporter'] as const

export type SponsorTier = typeof SPONSOR_TIERS[number]

export interface Sponsor {
  name: string
  logo: string
  url: string
  github: string
  tagline?: string
}

export interface SponsorsData {
  updated_at: string
  tiers: Record<SponsorTier, Sponsor[]>
}

export interface RankedSponsor extends Sponsor {
  tier: SponsorTier
}

const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i
const YUKI_ORIGIN = 'https://yukicapital.com'

function cleanText(value: unknown, maximumLength: number) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maximumLength)
    : ''
}

function cleanGithub(value: unknown) {
  const login = cleanText(value, 39)
  return GITHUB_LOGIN.test(login) ? login : ''
}

function cleanUrl(value: unknown, fallback = '') {
  const candidate = cleanText(value, 500)
  if (!candidate) return fallback
  try {
    const url = new URL(candidate, YUKI_ORIGIN)
    return url.protocol === 'https:' ? url.toString() : fallback
  } catch {
    return fallback
  }
}

function normalizeSponsor(value: unknown): Sponsor | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const github = cleanGithub(source.github)
  const fallbackUrl = github ? `https://github.com/${github}` : ''
  const url = cleanUrl(source.url, fallbackUrl)
  const name = cleanText(source.name, 90) || github
  if (!name || !url) return null

  const sponsor: Sponsor = { name, logo: cleanUrl(source.logo), url, github }
  const tagline = cleanText(source.tagline, 140)
  if (tagline) sponsor.tagline = tagline
  return sponsor
}

export function emptySponsorsData(): SponsorsData {
  return {
    updated_at: new Date(0).toISOString(),
    tiers: { founding: [], premier: [], sponsor: [], backer: [], supporter: [] },
  }
}

export function normalizeSponsorsData(value: unknown): SponsorsData {
  const normalized = emptySponsorsData()
  if (!value || typeof value !== 'object') return normalized
  const source = value as Record<string, unknown>
  const tiers = source.tiers && typeof source.tiers === 'object'
    ? source.tiers as Record<string, unknown>
    : {}
  const seen = new Set<string>()

  for (const tier of SPONSOR_TIERS) {
    const candidates = Array.isArray(tiers[tier]) ? tiers[tier] : []
    for (const candidate of candidates.slice(0, 100)) {
      const sponsor = normalizeSponsor(candidate)
      if (!sponsor) continue
      const identity = sponsor.github.toLowerCase() || sponsor.url.toLowerCase()
      if (seen.has(identity)) continue
      seen.add(identity)
      normalized.tiers[tier].push(sponsor)
    }
  }

  const updatedAt = cleanText(source.updated_at, 40)
  if (updatedAt && !Number.isNaN(Date.parse(updatedAt))) {
    normalized.updated_at = new Date(updatedAt).toISOString()
  }
  return normalized
}

export function flattenSponsors(data: SponsorsData): RankedSponsor[] {
  return SPONSOR_TIERS.flatMap(tier => data.tiers[tier].map(sponsor => ({ ...sponsor, tier })))
}
