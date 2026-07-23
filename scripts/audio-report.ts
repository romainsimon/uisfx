import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { CUES, PACKS } from '../packages/uisfx/src/catalog.ts'

interface ManifestAsset {
  duration: number
  files: { mp3: { path: string; bytes: number }; ogg: { path: string; bytes: number } }
}

interface Manifest {
  summary: { packs: number; cues: number; assets: number; mp3Bytes: number; oggBytes: number }
  assets: ManifestAsset[]
}

const root = resolve(import.meta.dirname, '..')
const packageRoot = resolve(root, 'packages/uisfx')
const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8')) as Manifest
const expectedAssets = PACKS.length * CUES.length
const execFileAsync = promisify(execFile)

if (
  manifest.assets.length !== expectedAssets
  || manifest.summary.packs !== PACKS.length
  || manifest.summary.cues !== CUES.length
  || manifest.summary.assets !== expectedAssets
) {
  throw new Error(`Expected ${expectedAssets} rendered assets, found ${manifest.assets.length}`)
}

for (const asset of manifest.assets) {
  await Promise.all([
    stat(resolve(packageRoot, asset.files.mp3.path)),
    stat(resolve(packageRoot, asset.files.ogg.path)),
  ])
}

async function mapConcurrent<T, R>(items: readonly T[], concurrency: number, worker: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length)
  let cursor = 0
  async function next() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item) results[index] = await worker(item)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()))
  return results
}

const decodedPeaks = await mapConcurrent(manifest.assets, 8, async (asset) => {
  const path = resolve(packageRoot, asset.files.mp3.path)
  const { stderr } = await execFileAsync('ffmpeg', [
    '-hide_banner', '-nostats', '-i', path, '-af', 'volumedetect', '-f', 'null', '-',
  ], { maxBuffer: 512_000 })
  const match = stderr.match(/max_volume:\s*(-?[0-9.]+) dB/)
  if (!match?.[1]) throw new Error(`Could not measure decoded peak for ${asset.files.mp3.path}`)
  return { path: asset.files.mp3.path, db: Number(match[1]) }
})

const loudest = decodedPeaks.reduce((current, candidate) => candidate.db > current.db ? candidate : current)
if (loudest.db > -1) {
  throw new Error(`Decoded MP3 peak exceeds -1 dBFS: ${loudest.path} at ${loudest.db.toFixed(1)} dBFS`)
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`
const longest = Math.max(...manifest.assets.map((asset) => asset.duration))
const average = manifest.assets.reduce((sum, asset) => sum + asset.duration, 0) / manifest.assets.length

console.table({
  packs: manifest.summary.packs,
  semanticCues: manifest.summary.cues,
  renderedAssets: manifest.summary.assets,
  mp3Library: mb(manifest.summary.mp3Bytes),
  oggLibrary: mb(manifest.summary.oggBytes),
  averageDuration: `${average.toFixed(2)} s`,
  longestDuration: `${longest.toFixed(2)} s`,
  loudestDecodedMP3: `${loudest.db.toFixed(1)} dBFS`,
})

const oggBudget = 2 * 1024 * 1024
if (manifest.summary.oggBytes > oggBudget) {
  throw new Error(`Ogg library exceeds the ${mb(oggBudget)} budget: ${mb(manifest.summary.oggBytes)}`)
}
