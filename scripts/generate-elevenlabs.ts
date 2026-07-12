import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CUES, PACKS, getCue, getPack, type CueName, type PackName } from '../packages/uisfx/src/catalog.ts'
import { createRecipe } from '../packages/uisfx/src/recipes.ts'

const args = new Set(process.argv.slice(2))
const valueAfter = (flag: string) => {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const apiKey = process.env.ELEVENLABS_API_KEY ?? process.env.ME_ELEVENLABS_API_KEY
if (!apiKey) throw new Error('Set ELEVENLABS_API_KEY before generating provider-backed sounds.')
const elevenLabsApiKey = apiKey

const subscriptionResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
  headers: { 'xi-api-key': elevenLabsApiKey },
})
const researchOnly = args.has('--research-only')
const subscriptionBody = await subscriptionResponse.json() as {
  tier?: string
  detail?: { status?: string; message?: string }
}
const tierVerified = subscriptionResponse.ok && Boolean(subscriptionBody.tier)
const subscriptionTier = subscriptionBody.tier ?? 'unverified'

if (!tierVerified && !researchOnly) {
  throw new Error(`Unable to verify a paid ElevenLabs tier (${subscriptionBody.detail?.status ?? subscriptionResponse.status}). Pass --research-only to stage non-distributable evaluation files.`)
}
if (subscriptionTier === 'free' && !researchOnly) {
  throw new Error('ElevenLabs free-tier output is non-commercial. Use a paid key or pass --research-only to write ignored evaluation files.')
}

const requestedPack = valueAfter('--pack') as PackName | undefined
const requestedCue = valueAfter('--cue') as CueName | undefined
const requestedCues = (valueAfter('--cues') ?? '').split(',').filter(Boolean) as CueName[]
if (requestedPack) getPack(requestedPack)
if (requestedCue) getCue(requestedCue)
for (const cue of requestedCues) getCue(cue)
if (!args.has('--all') && !requestedPack && !requestedCue && requestedCues.length === 0) {
  throw new Error('Choose --all, --pack <name>, --cue <name>, or --cues <comma-separated names>. Provider generation is intentionally explicit.')
}

const packLanguage: Record<PackName, string> = {
  minimal: 'extremely short, dry, precise, understated sine-like digital interface sound with no reverb',
  soft: 'short warm felt mallet and muted wooden interface sound, gentle rounded attack',
  glass: 'short premium crystalline glass interface sound, clean bright partials and a tiny natural tail',
  arcade: 'short playful 8-bit arcade interface sound, crisp chiptune pulse, no music bed',
  mechanical: 'short tactile hardware switch and miniature relay interface sound, firm physical detent',
  organic: 'short organic wood, water droplet, breath, or small stone interface sound, calm and natural',
  dreamy: 'short airy ambient interface sound with a soft bloom, delicate sparkle, and a clean weightless tail',
  scifi: 'short futuristic holographic interface sound with an electric scan, data chirp, and precise digital motion',
  rubber: 'short elastic rubber pop or friendly squish interface sound with a playful pitch bounce and tactile landing',
  cinematic: 'short premium cinematic interface sound with a restrained low impact, polished harmonic body, and controlled tail',
}

const cueLanguage: Record<CueName, string> = Object.fromEntries(CUES.map((cue) => [cue.name, cue.description])) as Record<CueName, string>
const jobs = PACKS
  .filter((pack) => !requestedPack || pack.name === requestedPack)
  .flatMap((pack) => CUES.filter((cue) => {
    if (requestedCue) return cue.name === requestedCue
    if (requestedCues.length > 0) return requestedCues.includes(cue.name)
    return true
  }).map((cue) => ({ pack, cue })))
const outputRoot = resolve(import.meta.dirname, '..', '.generated', researchOnly ? 'elevenlabs-research' : 'elevenlabs-paid')
await mkdir(outputRoot, { recursive: true })

const provenance: Array<Record<string, unknown>> = []
const concurrency = Math.max(1, Math.min(6, Number(valueAfter('--concurrency') ?? 3)))
let cursor = 0
let completed = 0

async function generate(job: (typeof jobs)[number]) {
  const { pack, cue } = job
  const recipe = createRecipe(pack.name, cue.name)
  const prompt = `${packLanguage[pack.name]}. Semantic intent: ${cueLanguage[cue.name]}. Isolated UI sound effect only, no voice, no ambience, no music, immediate onset, clean ending.`
  const duration = Math.min(2, Math.max(0.5, Number(recipe.duration.toFixed(2))))
  let response: Response | undefined
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'xi-api-key': elevenLabsApiKey },
      body: JSON.stringify({
        text: prompt,
        model_id: 'eleven_text_to_sound_v2',
        duration_seconds: duration,
        prompt_influence: 0.55,
        loop: 'loop' in cue ? cue.loop : false,
      }),
    })
    if (response.ok) break
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`ElevenLabs generation failed for ${pack.name}/${cue.name}: ${response.status} ${await response.text()}`)
    }
    const retryAfter = Number(response.headers.get('retry-after') ?? 0)
    const delay = Math.max(retryAfter * 1000, attempt * 1500)
    await new Promise((resolvePromise) => setTimeout(resolvePromise, delay))
  }
  if (!response?.ok) throw new Error(`ElevenLabs generation exhausted retries for ${pack.name}/${cue.name}`)
  const directory = resolve(outputRoot, pack.name)
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, `${cue.name}.mp3`), Buffer.from(await response.arrayBuffer()))
  provenance.push({
    pack: pack.name,
    cue: cue.name,
    prompt,
    duration,
    model: 'eleven_text_to_sound_v2',
    tier: subscriptionTier,
    tierVerified,
    licenseStatus: researchOnly ? 'research-only' : 'paid-tier-staged',
  })
  completed += 1
  process.stdout.write(`generated ${completed}/${jobs.length} ${pack.name}/${cue.name}\n`)
}

async function worker() {
  while (cursor < jobs.length) {
    const index = cursor
    cursor += 1
    const job = jobs[index]
    if (job) await generate(job)
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()))

let previousProvenance: Array<Record<string, unknown>> = []
try {
  previousProvenance = JSON.parse(await readFile(resolve(outputRoot, 'provenance.json'), 'utf8')) as Array<Record<string, unknown>>
} catch { /* First generation for this staging directory. */ }
const mergedProvenance = new Map<string, Record<string, unknown>>()
for (const entry of [...previousProvenance, ...provenance]) mergedProvenance.set(`${entry.pack}/${entry.cue}`, entry)
const sortedProvenance = [...mergedProvenance.values()].sort((a, b) => `${a.pack}/${a.cue}`.localeCompare(`${b.pack}/${b.cue}`))
await writeFile(resolve(outputRoot, 'provenance.json'), `${JSON.stringify(sortedProvenance, null, 2)}\n`)
if (researchOnly) {
  await writeFile(resolve(outputRoot, 'DO_NOT_DISTRIBUTE.txt'), 'The account tier could not be verified as paid. These ElevenLabs outputs are staged research only and are not part of UI SFX.\n')
}
