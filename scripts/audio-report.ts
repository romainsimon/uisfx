import { spawn } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

interface ManifestAsset {
  pack: string
  cue: string
  duration: number
  loop: boolean
  files: { mp3: { path: string; bytes: number }; ogg: { path: string; bytes: number } }
}

interface Manifest {
  summary: { packs: number; cues: number; assets: number; mp3Bytes: number; oggBytes: number }
  assets: ManifestAsset[]
}

const root = resolve(import.meta.dirname, '..')
const packageRoot = resolve(root, 'packages/uisfx')
const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8')) as Manifest
const expectedAssets = manifest.summary.packs * manifest.summary.cues

if (manifest.assets.length !== expectedAssets) {
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

function decodeStereo(path: string) {
  return new Promise<Buffer>((resolvePromise, reject) => {
    const child = spawn('ffmpeg', [
      '-v', 'error', '-i', path, '-ac', '2', '-f', 'f32le', '-acodec', 'pcm_f32le', '-',
    ], { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout: Buffer[] = []
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk))
    child.stderr.on('data', (chunk) => { stderr += String(chunk) })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolvePromise(Buffer.concat(stdout))
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1200)}`))
    })
  })
}

function decibels(value: number) {
  return 20 * Math.log10(Math.max(value, 1e-12))
}

const encodedFiles = manifest.assets.flatMap((asset) => [
  { asset, format: 'mp3' as const, path: asset.files.mp3.path, sampleRate: 44_100 },
  { asset, format: 'ogg' as const, path: asset.files.ogg.path, sampleRate: 48_000 },
])

const decodedAssets = await mapConcurrent(
  encodedFiles,
  12,
  async (file) => {
    const decoded = await decodeStereo(resolve(packageRoot, file.path))
    const frameCount = Math.floor(decoded.length / 8)
    if (frameCount < 3) throw new Error(`Decoded asset is empty: ${file.path}`)
    const sample = (frame: number, channel: number) => decoded.readFloatLE(frame * 8 + channel * 4)
    let peak = 0
    for (let frame = 0; frame < frameCount; frame += 1) {
      peak = Math.max(peak, Math.abs(sample(frame, 0)), Math.abs(sample(frame, 1)))
    }
    const durationError = Math.abs(frameCount / file.sampleRate - file.asset.duration)

    if (file.asset.loop) {
      const finalFrame = frameCount - 1
      const sampleJump = Math.max(
        Math.abs(sample(0, 0) - sample(finalFrame, 0)),
        Math.abs(sample(0, 1) - sample(finalFrame, 1)),
      )
      const slopeJump = Math.max(
        Math.abs((sample(1, 0) - sample(0, 0)) - (sample(finalFrame, 0) - sample(finalFrame - 1, 0))),
        Math.abs((sample(1, 1) - sample(0, 1)) - (sample(finalFrame, 1) - sample(finalFrame - 1, 1))),
      )
      return { ...file, peak, durationError, sampleJump, slopeJump, onset: 0, tailRms: 0 }
    }

    const onsetThreshold = Math.max(0.000_01, peak * 0.001)
    let firstActiveFrame = 0
    while (
      firstActiveFrame < frameCount
      && Math.max(Math.abs(sample(firstActiveFrame, 0)), Math.abs(sample(firstActiveFrame, 1))) < onsetThreshold
    ) firstActiveFrame += 1

    const tailFrames = Math.min(frameCount, Math.round(file.sampleRate * 0.02))
    let tailEnergy = 0
    for (let frame = frameCount - tailFrames; frame < frameCount; frame += 1) {
      const left = sample(frame, 0)
      const right = sample(frame, 1)
      tailEnergy += left * left + right * right
    }
    const tailRms = Math.sqrt(tailEnergy / Math.max(1, tailFrames * 2))
    return {
      ...file,
      peak,
      durationError,
      sampleJump: 0,
      slopeJump: 0,
      onset: firstActiveFrame / file.sampleRate,
      tailRms,
    }
  },
)

const loudest = decodedAssets.reduce((current, candidate) => candidate.peak > current.peak ? candidate : current)
if (loudest.peak > 10 ** (-1 / 20)) {
  throw new Error(`Decoded asset peak exceeds -1 dBFS: ${loudest.path} at ${decibels(loudest.peak).toFixed(1)} dBFS`)
}

const encodedOneShots = decodedAssets.filter((result) => !result.asset.loop)
const encodedOneShotFailures = encodedOneShots.filter((result) => (
  result.onset >= 0.08
  || result.tailRms > 0.000_32
  || result.durationError > 0.002
  || result.asset.duration > 1.5
))
if (encodedOneShotFailures.length > 0) {
  const offender = encodedOneShotFailures.sort((first, second) => (
    Math.max(second.onset / 0.08, second.tailRms / 0.000_32, second.durationError / 0.002, second.asset.duration / 1.5)
    - Math.max(first.onset / 0.08, first.tailRms / 0.000_32, first.durationError / 0.002, first.asset.duration / 1.5)
  ))[0]
  throw new Error(
    `Encoded one-shot failed for ${offender?.format} ${offender?.asset.pack}/${offender?.asset.cue}:`
    + ` onset ${((offender?.onset ?? 0) * 1_000).toFixed(1)} ms,`
    + ` tail ${decibels(offender?.tailRms ?? 0).toFixed(1)} dBFS,`
    + ` duration ${((offender?.asset.duration ?? 0) * 1_000).toFixed(1)} ms,`
    + ` error ${((offender?.durationError ?? 0) * 1_000).toFixed(1)} ms`,
  )
}

const encodedLoopSeams = decodedAssets.filter((result) => result.asset.loop)
const worstEncodedLoopSeam = encodedLoopSeams.reduce((current, candidate) => (
  Math.max(candidate.sampleJump / 0.012, candidate.slopeJump / 0.02)
    > Math.max(current.sampleJump / 0.012, current.slopeJump / 0.02)
    ? candidate
    : current
))
const encodedLoopFailures = encodedLoopSeams.filter((result) => (
  result.sampleJump > 0.012
  || result.slopeJump > 0.02
  || result.durationError > 1 / result.sampleRate
))
if (encodedLoopFailures.length > 0) {
  const offender = encodedLoopFailures.sort((first, second) => (
    Math.max(second.sampleJump / 0.012, second.slopeJump / 0.02)
    - Math.max(first.sampleJump / 0.012, first.slopeJump / 0.02)
  ))[0]
  throw new Error(
    `Encoded loop seam failed for ${offender?.format} ${offender?.asset.pack}/${offender?.asset.cue}:`
    + ` sample ${offender?.sampleJump.toFixed(5)}, slope ${offender?.slopeJump.toFixed(5)}`,
  )
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
  loudestDecodedAsset: `${decibels(loudest.peak).toFixed(1)} dBFS (${loudest.format})`,
  worstOneShotTail: `${decibels(Math.max(...encodedOneShots.map((asset) => asset.tailRms))).toFixed(1)} dBFS`,
  worstEncodedLoopSeam: `${worstEncodedLoopSeam.sampleJump.toFixed(5)} sample / ${worstEncodedLoopSeam.slopeJump.toFixed(5)} slope`,
})

if (manifest.summary.oggBytes > 4 * 1024 * 1024) {
  throw new Error(`Ogg library exceeds the 4 MB quality budget: ${mb(manifest.summary.oggBytes)}`)
}
