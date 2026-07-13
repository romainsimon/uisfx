import { CUES, PACKS, type CueName, type PackName } from '../packages/uisfx/src/catalog.ts'
import { createRecipe } from '../packages/uisfx/src/recipes.ts'
import { renderRecipe } from '../packages/uisfx/src/synth.ts'

const ANALYSIS_SAMPLE_RATE = 16_000
const FINAL_TAIL_SECONDS = 0.02
const FINAL_TAIL_RMS_LIMIT = 0.000_32
const LOOP_SAMPLE_JUMP_LIMIT = 0.012
const LOOP_SLOPE_JUMP_LIMIT = 0.02
const LOOP_INTERVAL_ERROR_LIMIT = 0.05
const GENERIC_SIMILARITY_LIMIT = 0.992
const RELATED_SIMILARITY_LIMIT = 0.998
const KNOWN_COLLISION_LIMIT = 0.965
const PACK_NEAREST_MEDIAN_LIMIT = 0.95
const TOP_OFFENDER_COUNT = 8

const FINGERPRINT_TIME_BINS = 16
const FINGERPRINT_FREQUENCIES = [
  90, 135, 202, 303, 454, 681, 1_022,
  1_533, 2_300, 3_450, 5_175, 7_200,
] as const

const RELATED_PAIRS = new Set([
  'add-to-cart|remove-from-cart',
  'back|forward',
  'check|uncheck',
  'close|open',
  'collapse|expand',
  'connect|disconnect',
  'deselect|select',
  'lock|unlock',
  'pause|play',
  'receive|send',
  'redo|undo',
  'skip-next|skip-previous',
  'sleep|wake',
  'start|stop',
  'toggle-off|toggle-on',
])

// These pairs were the most persistent semantic collisions in the original
// library. Keep the assertions even if they stop appearing in the top results,
// so a broad timbre change cannot silently bring them back.
const KNOWN_COLLISIONS = new Set([
  'add-to-cart|select',
  'blocked|invalid-drop',
  'cancel|press',
  'check|select',
  'close|collapse',
  'deselect|remove-from-cart',
  'deselect|uncheck',
  'drag-start|drop',
  'expand|open',
  'focus|progress-step',
  'forward|release',
  'paste|toggle-off',
  'play|toggle-on',
  'queued|start',
  'reorder|stop',
])

interface RenderAnalysis {
  pack: PackName
  cue: CueName
  fingerprint: Float64Array
}

interface TailResult {
  pack: PackName
  cue: CueName
  rms: number
}

interface SeamResult {
  pack: PackName
  cue: CueName
  sampleJump: number
  slopeJump: number
}

interface TimingResult {
  pack: PackName
  cue: CueName
  seamInterval: number
  medianInterval: number
  error: number
}

interface SimilarityResult {
  pack: PackName
  first: CueName
  second: CueName
  score: number
  limit: number
  reason: 'generic' | 'related' | 'known collision'
}

interface PackSimilaritySummary {
  pack: PackName
  median: number
  p90: number
  maximum: number
}

function pairKey(first: CueName, second: CueName) {
  return first < second ? `${first}|${second}` : `${second}|${first}`
}

function decibels(value: number) {
  return 20 * Math.log10(Math.max(value, 1e-12))
}

function stereoRms(left: Float32Array, right: Float32Array, from: number, to: number) {
  const start = Math.max(0, from)
  const end = Math.min(left.length, right.length, to)
  let sum = 0
  let count = 0
  for (let index = start; index < end; index += 1) {
    const leftSample = left[index] ?? 0
    const rightSample = right[index] ?? 0
    sum += leftSample * leftSample + rightSample * rightSample
    count += 2
  }
  return count > 0 ? Math.sqrt(sum / count) : 0
}

function median(values: readonly number[]) {
  if (values.length === 0) return 0
  const ordered = [...values].sort((first, second) => first - second)
  const midpoint = Math.floor(ordered.length / 2)
  if (ordered.length % 2 === 1) return ordered[midpoint] ?? 0
  return ((ordered[midpoint - 1] ?? 0) + (ordered[midpoint] ?? 0)) / 2
}

function percentile(values: readonly number[], quantile: number) {
  if (values.length === 0) return 0
  const ordered = [...values].sort((first, second) => first - second)
  const position = Math.max(0, Math.min(ordered.length - 1, (ordered.length - 1) * quantile))
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const progress = position - lowerIndex
  return (ordered[lowerIndex] ?? 0) * (1 - progress) + (ordered[upperIndex] ?? 0) * progress
}

function monoSample(left: Float32Array, right: Float32Array, index: number) {
  return ((left[index] ?? 0) + (right[index] ?? 0)) * 0.5
}

function activeRange(left: Float32Array, right: Float32Array) {
  let peak = 0
  for (let index = 0; index < left.length; index += 1) {
    peak = Math.max(peak, Math.abs(monoSample(left, right, index)))
  }
  const threshold = Math.max(peak * 0.003, 1e-5)
  let first = 0
  while (first < left.length - 1 && Math.abs(monoSample(left, right, first)) < threshold) first += 1
  let last = left.length - 1
  while (last > first && Math.abs(monoSample(left, right, last)) < threshold) last -= 1
  const padding = Math.round(ANALYSIS_SAMPLE_RATE * 0.008)
  return {
    first: Math.max(0, first - padding),
    last: Math.min(left.length, last + padding + 1),
  }
}

function normalize(values: number[]) {
  let magnitude = 0
  for (const value of values) magnitude += value * value
  magnitude = Math.sqrt(magnitude)
  if (magnitude === 0) return Float64Array.from(values)
  return Float64Array.from(values, (value) => value / magnitude)
}

function perceptualFingerprint(left: Float32Array, right: Float32Array, loop: boolean) {
  const range = loop ? { first: 0, last: left.length } : activeRange(left, right)
  const length = Math.max(FINGERPRINT_TIME_BINS, range.last - range.first)
  const temporalEnergy: number[] = []
  const zeroCrossing: number[] = []
  const spectralEnergy: number[][] = []

  for (let bin = 0; bin < FINGERPRINT_TIME_BINS; bin += 1) {
    const start = range.first + Math.floor(length * bin / FINGERPRINT_TIME_BINS)
    const end = Math.min(range.last, range.first + Math.floor(length * (bin + 1) / FINGERPRINT_TIME_BINS))
    const frameLength = Math.max(1, end - start)
    let energy = 0
    let crossings = 0
    let previous = monoSample(left, right, start)
    const projections = FINGERPRINT_FREQUENCIES.map((frequency) => ({
      cosine: 1,
      sine: 0,
      cosineStep: Math.cos(2 * Math.PI * frequency / ANALYSIS_SAMPLE_RATE),
      sineStep: Math.sin(2 * Math.PI * frequency / ANALYSIS_SAMPLE_RATE),
      real: 0,
      imaginary: 0,
    }))

    for (let index = start; index < end; index += 1) {
      const sample = monoSample(left, right, index)
      const progress = (index - start + 0.5) / frameLength
      const window = Math.sin(Math.PI * progress) ** 2
      const windowed = sample * window
      energy += sample * sample
      if ((sample >= 0) !== (previous >= 0)) crossings += 1
      previous = sample

      for (const projection of projections) {
        projection.real += windowed * projection.cosine
        projection.imaginary -= windowed * projection.sine
        const cosine = projection.cosine * projection.cosineStep - projection.sine * projection.sineStep
        projection.sine = projection.sine * projection.cosineStep + projection.cosine * projection.sineStep
        projection.cosine = cosine
      }
    }

    temporalEnergy.push(Math.sqrt(energy / frameLength))
    zeroCrossing.push(crossings / frameLength)
    spectralEnergy.push(projections.map((projection) => (
      (projection.real * projection.real + projection.imaginary * projection.imaginary)
      / (frameLength * frameLength)
    )))
  }

  const maximumTemporalEnergy = Math.max(...temporalEnergy, 1e-12)
  const maximumSpectralEnergy = Math.max(...spectralEnergy.flat(), 1e-18)
  const features: number[] = []
  for (let bin = 0; bin < FINGERPRINT_TIME_BINS; bin += 1) {
    const relativeEnergy = (temporalEnergy[bin] ?? 0) / maximumTemporalEnergy
    features.push(Math.sqrt(relativeEnergy))
    features.push(Math.min(1, (zeroCrossing[bin] ?? 0) * 4))
    for (const energy of spectralEnergy[bin] ?? []) {
      const relative = energy / maximumSpectralEnergy
      features.push(Math.log1p(relative * 120) / Math.log(121))
    }
  }

  const activeDuration = length / ANALYSIS_SAMPLE_RATE
  const durationFeature = Math.min(1, Math.log1p(activeDuration * 7) / Math.log(15))
  features.push(durationFeature, durationFeature, durationFeature, durationFeature)
  return normalize(features)
}

function cosineSimilarity(first: Float64Array, second: Float64Array) {
  let dot = 0
  let firstMean = 0
  let secondMean = 0
  for (let index = 0; index < first.length; index += 1) {
    dot += (first[index] ?? 0) * (second[index] ?? 0)
    firstMean += first[index] ?? 0
    secondMean += second[index] ?? 0
  }
  firstMean /= first.length
  secondMean /= second.length

  let covariance = 0
  let firstVariance = 0
  let secondVariance = 0
  for (let index = 0; index < first.length; index += 1) {
    const firstCentered = (first[index] ?? 0) - firstMean
    const secondCentered = (second[index] ?? 0) - secondMean
    covariance += firstCentered * secondCentered
    firstVariance += firstCentered * firstCentered
    secondVariance += secondCentered * secondCentered
  }
  const correlation = covariance / Math.max(1e-12, Math.sqrt(firstVariance * secondVariance))
  return dot * 0.68 + ((correlation + 1) * 0.5) * 0.32
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function formatAsset(pack: PackName, cue: CueName) {
  return `${pack}/${cue}`
}

const startedAt = performance.now()
const analyses: RenderAnalysis[] = []
const tails: TailResult[] = []
const seams: SeamResult[] = []
const timings: TimingResult[] = []

for (const pack of PACKS) {
  for (const cue of CUES) {
    const recipe = createRecipe(pack.name, cue.name)
    const rendered = renderRecipe(recipe, ANALYSIS_SAMPLE_RATE)
    const loop = recipe.loop
    analyses.push({
      pack: pack.name,
      cue: cue.name,
      fingerprint: perceptualFingerprint(rendered.left, rendered.right, loop),
    })

    if (!loop) {
      const tailFrames = Math.round(FINAL_TAIL_SECONDS * ANALYSIS_SAMPLE_RATE)
      tails.push({
        pack: pack.name,
        cue: cue.name,
        rms: stereoRms(rendered.left, rendered.right, rendered.left.length - tailFrames, rendered.left.length),
      })
      continue
    }

    const finalFrame = rendered.left.length - 1
    const sampleJump = Math.max(
      Math.abs((rendered.left[0] ?? 0) - (rendered.left[finalFrame] ?? 0)),
      Math.abs((rendered.right[0] ?? 0) - (rendered.right[finalFrame] ?? 0)),
    )
    const slopeJump = Math.max(
      Math.abs(
        ((rendered.left[1] ?? 0) - (rendered.left[0] ?? 0))
        - ((rendered.left[finalFrame] ?? 0) - (rendered.left[finalFrame - 1] ?? 0)),
      ),
      Math.abs(
        ((rendered.right[1] ?? 0) - (rendered.right[0] ?? 0))
        - ((rendered.right[finalFrame] ?? 0) - (rendered.right[finalFrame - 1] ?? 0)),
      ),
    )
    seams.push({ pack: pack.name, cue: cue.name, sampleJump, slopeJump })

    const onsetTimes = recipe.notes
      .map((note) => note.at)
      .filter((time) => time >= 0 && time < recipe.duration)
      .sort((first, second) => first - second)
      .filter((time, index, times) => index === 0 || time - (times[index - 1] ?? 0) > 0.001)
    const intervals = onsetTimes.map((time, index) => {
      const next = onsetTimes[index + 1] ?? ((onsetTimes[0] ?? 0) + recipe.duration)
      return next - time
    })
    const seamInterval = intervals.at(-1) ?? recipe.duration
    const medianInterval = median(intervals.slice(0, -1)) || seamInterval
    const error = medianInterval > 0 ? Math.abs(seamInterval / medianInterval - 1) : 0
    timings.push({ pack: pack.name, cue: cue.name, seamInterval, medianInterval, error })
  }
}

const similarities: SimilarityResult[] = []
for (const pack of PACKS) {
  const packAnalyses = analyses.filter((analysis) => analysis.pack === pack.name)
  for (let firstIndex = 0; firstIndex < packAnalyses.length; firstIndex += 1) {
    const first = packAnalyses[firstIndex]
    if (!first) continue
    for (let secondIndex = firstIndex + 1; secondIndex < packAnalyses.length; secondIndex += 1) {
      const second = packAnalyses[secondIndex]
      if (!second) continue
      const key = pairKey(first.cue, second.cue)
      const knownCollision = KNOWN_COLLISIONS.has(key)
      const related = RELATED_PAIRS.has(key)
      similarities.push({
        pack: pack.name,
        first: first.cue,
        second: second.cue,
        score: cosineSimilarity(first.fingerprint, second.fingerprint),
        limit: knownCollision
          ? KNOWN_COLLISION_LIMIT
          : related ? RELATED_SIMILARITY_LIMIT : GENERIC_SIMILARITY_LIMIT,
        reason: knownCollision ? 'known collision' : related ? 'related' : 'generic',
      })
    }
  }
}

const packSimilaritySummaries: PackSimilaritySummary[] = PACKS.map((pack) => {
  const nearestByCue = new Map<CueName, number>()
  for (const result of similarities) {
    if (result.pack !== pack.name || result.reason === 'related') continue
    nearestByCue.set(result.first, Math.max(nearestByCue.get(result.first) ?? 0, result.score))
    nearestByCue.set(result.second, Math.max(nearestByCue.get(result.second) ?? 0, result.score))
  }
  const nearest = [...nearestByCue.values()]
  return {
    pack: pack.name,
    median: median(nearest),
    p90: percentile(nearest, 0.9),
    maximum: Math.max(...nearest, 0),
  }
})

const tailFailures = tails.filter((result) => result.rms > FINAL_TAIL_RMS_LIMIT)
const seamFailures = seams.filter((result) => (
  result.sampleJump > LOOP_SAMPLE_JUMP_LIMIT || result.slopeJump > LOOP_SLOPE_JUMP_LIMIT
))
const timingFailures = timings.filter((result) => result.error > LOOP_INTERVAL_ERROR_LIMIT)
const similarityFailures = similarities.filter((result) => result.score > result.limit)
const packSimilarityFailures = packSimilaritySummaries.filter((result) => (
  result.median > PACK_NEAREST_MEDIAN_LIMIT
))

const worstTails = [...tails].sort((first, second) => second.rms - first.rms)
const worstSeams = [...seams].sort((first, second) => (
  Math.max(
    second.sampleJump / LOOP_SAMPLE_JUMP_LIMIT,
    second.slopeJump / LOOP_SLOPE_JUMP_LIMIT,
  ) - Math.max(
    first.sampleJump / LOOP_SAMPLE_JUMP_LIMIT,
    first.slopeJump / LOOP_SLOPE_JUMP_LIMIT,
  )
))
const worstTimings = [...timings].sort((first, second) => second.error - first.error)
const closestPairs = [...similarities].sort((first, second) => second.score - first.score)

console.log(`UI SFX PCM quality: ${analyses.length} assets at ${ANALYSIS_SAMPLE_RATE / 1_000} kHz`)
console.log(
  `  tails       ${tails.length - tailFailures.length}/${tails.length} clean`
  + `  worst ${decibels(worstTails[0]?.rms ?? 0).toFixed(1)} dBFS`
  + ` ${worstTails[0] ? formatAsset(worstTails[0].pack, worstTails[0].cue) : ''}`
  + `  limit ${decibels(FINAL_TAIL_RMS_LIMIT).toFixed(1)} dBFS`,
)
console.log(
  `  loop seams  ${seams.length - seamFailures.length}/${seams.length} continuous`
  + `  worst sample ${(worstSeams[0]?.sampleJump ?? 0).toFixed(5)}`
  + `  slope ${(worstSeams[0]?.slopeJump ?? 0).toFixed(5)}`
  + ` ${worstSeams[0] ? formatAsset(worstSeams[0].pack, worstSeams[0].cue) : ''}`,
)
console.log(
  `  loop timing ${timings.length - timingFailures.length}/${timings.length} cyclic`
  + `  worst ${formatPercent(worstTimings[0]?.error ?? 0)}`
  + ` ${worstTimings[0] ? formatAsset(worstTimings[0].pack, worstTimings[0].cue) : ''}`,
)
console.log(
  `  similarity  ${similarities.length - similarityFailures.length}/${similarities.length} pairs clear`
  + `  closest ${(closestPairs[0]?.score ?? 0).toFixed(3)}`
  + (closestPairs[0]
    ? ` ${closestPairs[0].pack}/${closestPairs[0].first} + ${closestPairs[0].second}`
    : ''),
)
console.log(`  pack nearest non-related median / P90  limit ${PACK_NEAREST_MEDIAN_LIMIT.toFixed(3)} median`)
for (let index = 0; index < packSimilaritySummaries.length; index += 4) {
  console.log(`    ${packSimilaritySummaries.slice(index, index + 4)
    .map((result) => `${result.pack} ${result.median.toFixed(3)} / ${result.p90.toFixed(3)}`)
    .join('    ')}`)
}
console.log(`  runtime     ${((performance.now() - startedAt) / 1_000).toFixed(2)} s`)

function printOffenders(title: string, rows: readonly string[]) {
  if (rows.length === 0) return
  console.error(`\n${title}`)
  for (const row of rows.slice(0, TOP_OFFENDER_COUNT)) console.error(`  ${row}`)
}

printOffenders('Tail failures', tailFailures
  .sort((first, second) => second.rms - first.rms)
  .map((result) => `${formatAsset(result.pack, result.cue)} ${decibels(result.rms).toFixed(1)} dBFS`))
printOffenders('Loop seam failures', seamFailures
  .sort((first, second) => Math.max(second.sampleJump, second.slopeJump) - Math.max(first.sampleJump, first.slopeJump))
  .map((result) => (
    `${formatAsset(result.pack, result.cue)}`
    + ` sample ${result.sampleJump.toFixed(5)}`
    + ` slope ${result.slopeJump.toFixed(5)}`
  )))
printOffenders('Loop timing failures', timingFailures
  .sort((first, second) => second.error - first.error)
  .map((result) => (
    `${formatAsset(result.pack, result.cue)} ${formatPercent(result.error)}`
    + ` (${Math.round(result.seamInterval * 1_000)} ms seam,`
    + ` ${Math.round(result.medianInterval * 1_000)} ms median)`
  )))
printOffenders('Similarity failures', similarityFailures
  .sort((first, second) => second.score - first.score)
  .map((result) => (
    `${result.pack}/${result.first} + ${result.second}`
    + ` ${result.score.toFixed(3)} > ${result.limit.toFixed(3)}`
    + ` (${result.reason})`
  )))
printOffenders('Pack differentiation failures', packSimilarityFailures
  .sort((first, second) => second.median - first.median)
  .map((result) => (
    `${result.pack} median ${result.median.toFixed(3)} > ${PACK_NEAREST_MEDIAN_LIMIT.toFixed(3)}`
    + `  P90 ${result.p90.toFixed(3)}  max ${result.maximum.toFixed(3)}`
  )))

const failureCount = tailFailures.length + seamFailures.length + timingFailures.length
  + similarityFailures.length + packSimilarityFailures.length
if (failureCount > 0) {
  console.error(`\nAudio quality failed with ${failureCount} violation${failureCount === 1 ? '' : 's'}.`)
  process.exitCode = 1
} else {
  console.log('Audio quality passed.')
}
