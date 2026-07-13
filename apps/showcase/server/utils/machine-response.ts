import { setResponseHeader, type H3Event } from 'h3'

export function setMachineReadableHeaders(
  event: H3Event,
  contentType: 'text/plain' | 'text/markdown' | 'application/json',
  options: { indexable?: boolean; maxAge?: number } = {},
) {
  const maxAge = options.maxAge ?? 3600
  setResponseHeader(event, 'Content-Type', `${contentType}; charset=utf-8`)
  setResponseHeader(event, 'Content-Language', 'en')
  setResponseHeader(event, 'Cache-Control', `public, max-age=${maxAge}, s-maxage=86400, stale-while-revalidate=604800`)
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  if (options.indexable === false) setResponseHeader(event, 'X-Robots-Tag', 'noindex, follow')
}
