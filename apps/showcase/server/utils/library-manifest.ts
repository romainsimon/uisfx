import manifest from '../../../../packages/uisfx/manifest.json'

export function buildPublicManifest() {
  return {
    ...manifest,
    pathScope: 'Asset paths resolve inside the uisfx npm package; they are not website media URLs.',
    packageUrl: 'https://www.npmjs.com/package/uisfx',
    sourceUrl: 'https://github.com/romainsimon/uisfx',
  }
}
