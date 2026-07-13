import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const trackedFiles = execFileSync('git', ['ls-files', '-z'])
  .toString('utf8')
  .split('\0')
  .filter(Boolean)

const sensitiveFileRules = [
  { label: 'environment file', pattern: /(^|\/)\.env(?:\.|$)/i, allow: /(^|\/)\.env\.example$/i },
  { label: 'npm credentials file', pattern: /(^|\/)\.npmrc$/i },
  { label: 'credential file', pattern: /(^|\/)(?:credentials?|secrets?)\.(?:json|ya?ml)$/i },
  { label: 'private key or keystore', pattern: /(^|\/)(?:id_(?:rsa|ed25519)|[^/]+\.(?:pem|key|p12|pfx|jks|keystore))$/i },
  { label: 'private agent artifact', pattern: /(^|\/)\.(?:gstack|codex|claude)\//i },
]

const contentRules = [
  { label: 'macOS local user path', pattern: /\/Users\/[^/\s"'`]+\//i },
  { label: 'Linux local user path', pattern: /\/home\/[^/\s"'`]+\//i },
  { label: 'Windows local user path', pattern: /[A-Z]:\\Users\\[^\\\s"'`]+\\/i },
  { label: 'temporary local path', pattern: /\/(?:private\/)?tmp\//i },
  { label: 'private runtime path', pattern: /\/private\/var\//i },
  { label: 'private workspace route', pattern: /\/(?:dev)\/(?!null\b)[A-Za-z0-9._-]+/i },
  { label: 'temporary tunnel hostname', pattern: new RegExp('trycloud' + 'flare\\.com', 'i') },
  { label: 'local file URI', pattern: new RegExp('(?:file|vscode|idea)' + ':/{2}', 'i') },
  { label: 'credential embedded in URL', pattern: /https?:\/\/[^/\s:@]+:[^/\s@]+@/i },
  { label: 'private key block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: 'OpenAI-style secret', pattern: /sk-(?:proj|live|test)-[A-Za-z0-9_-]{12,}/ },
  { label: 'secret-key token', pattern: /sk_[A-Za-z0-9_-]{20,}/ },
  { label: 'AWS access key', pattern: /(?:AKIA|ASIA)[0-9A-Z]{16}/ },
  { label: 'GitHub token', pattern: /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/ },
  { label: 'Slack token', pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { label: 'JWT-like token', pattern: /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/ },
]

const findings = new Map()

function addFinding(file, label) {
  const labels = findings.get(file) ?? new Set()
  labels.add(label)
  findings.set(file, labels)
}

for (const file of trackedFiles) {
  for (const rule of sensitiveFileRules) {
    if (rule.pattern.test(file) && !rule.allow?.test(file)) addFinding(file, rule.label)
  }

  if (file === 'scripts/privacy-check.mjs') continue

  let buffer
  try {
    buffer = readFileSync(file)
  } catch {
    continue
  }

  if (buffer.includes(0)) continue
  const content = buffer.toString('utf8')

  for (const rule of contentRules) {
    if (rule.pattern.test(content)) addFinding(file, rule.label)
  }
}

if (findings.size) {
  console.error('Privacy check failed. Potential public-repository leaks:')
  for (const [file, labels] of findings) {
    console.error(`- ${file}: ${[...labels].join(', ')}`)
  }
  process.exit(1)
}

console.log(`Privacy check passed for ${trackedFiles.length} tracked files.`)
