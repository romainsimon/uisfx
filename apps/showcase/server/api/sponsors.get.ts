import { emptySponsorsData, normalizeSponsorsData } from '../../app/lib/sponsors'

const SPONSORS_ENDPOINT = 'https://yukicapital.com/api/sponsors'

export default defineCachedEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600')

  try {
    const response = await fetch(SPONSORS_ENDPOINT, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(1_800),
    })
    if (!response.ok) return emptySponsorsData()
    return normalizeSponsorsData(await response.json())
  } catch {
    return emptySponsorsData()
  }
}, {
  maxAge: 300,
  name: 'uisfx-sponsors',
  getKey: () => 'active',
})
