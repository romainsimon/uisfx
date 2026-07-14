export interface PackShortcutResolution {
  pendingOne: boolean
  indices: number[]
}

function directShortcutIndex(key: string) {
  if (key === '0') return 9
  if (key === '-') return 10
  if (key === '+' || key === '=') return 11
  if (/^[1-9]$/.test(key)) return Number(key) - 1
  return null
}

export function resolvePackShortcut(pendingOne: boolean, key: string): PackShortcutResolution {
  if (pendingOne && /^[0-2]$/.test(key)) {
    return { pendingOne: false, indices: [Number(`1${key}`) - 1] }
  }

  const directIndex = directShortcutIndex(key)
  if (directIndex === null) return { pendingOne, indices: [] }
  if (!pendingOne && key === '1') return { pendingOne: true, indices: [] }
  return { pendingOne: false, indices: [directIndex] }
}
