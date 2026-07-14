import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const root = resolve(import.meta.dirname, '..')
const packageRoot = resolve(root, 'packages/uisfx')
const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'))
const runtime = await readFile(resolve(packageRoot, 'dist/index.js'))

const limits = {
  runtimeGzip: 15 * 1024,
  mp3Library: 6 * 1024 * 1024,
  oggLibrary: 4 * 1024 * 1024,
  largestAsset: 20 * 1024,
}

const largestAsset = manifest.assets
  .flatMap((asset) => Object.values(asset.files).map((file) => ({ ...file, asset: `${asset.pack}/${asset.cue}` })))
  .sort((first, second) => second.bytes - first.bytes)[0]

const actual = {
  runtimeGzip: gzipSync(runtime).byteLength,
  mp3Library: manifest.summary.mp3Bytes,
  oggLibrary: manifest.summary.oggBytes,
  largestAsset: largestAsset?.bytes ?? 0,
}

const format = (bytes) => `${(bytes / 1024).toFixed(1)} KB`
for (const [name, value] of Object.entries(actual)) {
  console.log(`${name.padEnd(14)} ${format(value).padStart(10)} / ${format(limits[name]).padStart(10)}`)
  if (value > limits[name]) throw new Error(`${name} exceeds its distribution budget`)
}
console.log(`largest file   ${largestAsset?.asset ?? 'none'} (${largestAsset?.path ?? 'none'})`)
console.log('Package budgets passed.')
