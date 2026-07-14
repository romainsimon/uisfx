import { describe, expect, it } from 'vitest'
import { CATEGORIES, CUES, PACKS, createRecipe, getPlaybackMode, renderRecipe } from '../src'

function rms(samples: Float32Array, from: number, to: number) {
  let sum = 0
  let count = 0
  for (let index = Math.max(0, from); index < Math.min(samples.length, to); index += 1) {
    const sample = samples[index] ?? 0
    sum += sample * sample
    count += 1
  }
  return count > 0 ? Math.sqrt(sum / count) : 0
}

function activeDuration(pack: 'zen', cue: Parameters<typeof createRecipe>[1]) {
  const rendered = renderRecipe(createRecipe(pack, cue), 16_000)
  const threshold = rendered.peak * 0.01
  let finalActiveFrame = 0
  for (let index = 0; index < rendered.left.length; index += 1) {
    if (Math.max(Math.abs(rendered.left[index] ?? 0), Math.abs(rendered.right[index] ?? 0)) >= threshold) {
      finalActiveFrame = index
    }
  }
  return finalActiveFrame / rendered.sampleRate
}

describe('UI SFX catalog', () => {
  it('covers thirteen semantic categories with 78 cues', () => {
    expect(CATEGORIES).toHaveLength(13)
    expect(CUES).toHaveLength(78)
    for (const category of CATEGORIES) {
      expect(CUES.filter((cue) => cue.category === category.id)).toHaveLength(6)
    }
  })

  it('creates every pack and cue combination', () => {
    const recipes = PACKS.flatMap((pack) => CUES.map((cue) => createRecipe(pack.name, cue.name)))
    const expectedCount = PACKS.length * CUES.length
    expect(recipes).toHaveLength(expectedCount)
    expect(new Set(recipes.map((recipe) => `${recipe.pack}:${recipe.cue}`)).size).toBe(expectedCount)
  })

  it('distinguishes brief one-shots from explicit continuous loops', () => {
    const loops = CUES.filter((cue) => getPlaybackMode(cue.name) === 'loop')
    expect(loops.map((cue) => cue.name)).toEqual(['loading', 'processing', 'recording', 'connecting', 'scanning', 'streaming'])
    expect(CUES.filter((cue) => getPlaybackMode(cue.name) === 'one-shot')).toHaveLength(72)
  })

  it('keeps every rendered one-shot recipe within the 1.5 second interaction budget', () => {
    for (const pack of PACKS) {
      for (const cue of CUES.filter((candidate) => !('loop' in candidate) || !candidate.loop)) {
        expect(renderRecipe(createRecipe(pack.name, cue.name), 8_000).duration).toBeLessThanOrEqual(1.5)
      }
    }
  })

  it('keeps per-keystroke typing feedback brief and quiet in every feel', () => {
    const typingCue = CUES.find((cue) => cue.name === 'typing')
    expect(typingCue?.defaultVolume).toBeLessThanOrEqual(0.07)

    for (const pack of PACKS) {
      const recipe = createRecipe(pack.name, 'typing')
      const rendered = renderRecipe(recipe, 16_000)
      expect(recipe.notes).toHaveLength(1)
      expect(rendered.duration).toBeLessThan(0.12)
    }
  })
})

describe('deterministic renderer', () => {
  it('renders finite stereo samples within range', () => {
    const rendered = renderRecipe(createRecipe('minimal', 'success'), 16_000)
    expect(rendered.left.length).toBe(rendered.right.length)
    expect(rendered.duration).toBeGreaterThan(0.4)
    expect(rendered.peak).toBeLessThanOrEqual(1)
    expect([...rendered.left, ...rendered.right].every(Number.isFinite)).toBe(true)
  })

  it('is byte-for-byte deterministic', () => {
    const recipe = createRecipe('organic', 'drop')
    const first = renderRecipe(recipe, 8_000)
    const second = renderRecipe(recipe, 8_000)
    expect(first.left).toEqual(second.left)
    expect(first.right).toEqual(second.right)
  })

  it('gives each feel a distinct waveform', () => {
    const signatures = PACKS.map((pack) => {
      const rendered = renderRecipe(createRecipe(pack.name, 'notification'), 8_000)
      return Array.from(rendered.left.slice(0, 500)).map((value) => value.toFixed(4)).join(',')
    })
    expect(new Set(signatures).size).toBe(PACKS.length)
  })

  it('uses pack-specific note arrangements, not only global timbre changes', () => {
    const signatures = PACKS.map((pack) => {
      const recipe = createRecipe(pack.name, 'achievement')
      return recipe.notes.map((note) => `${note.at.toFixed(3)}:${note.length.toFixed(3)}:${note.frequency.toFixed(1)}`).join('|')
    })
    expect(new Set(signatures).size).toBe(PACKS.length)
    expect(createRecipe('glass', 'achievement').notes.length).toBeGreaterThan(createRecipe('minimal', 'achievement').notes.length)
    expect(createRecipe('mechanical', 'press').notes.length).toBeGreaterThan(createRecipe('minimal', 'press').notes.length)
  })

  it('gives Zen cues event-bound paper, brush, wood, and chime materials', () => {
    expect(createRecipe('zen', 'open').paper).toBeGreaterThan(0)
    expect(createRecipe('zen', 'swipe').brush).toBeGreaterThan(0)
    expect(createRecipe('zen', 'press').wood).toBeGreaterThan(0)
    expect(createRecipe('zen', 'success').chime).toBeGreaterThan(0)
    expect(createRecipe('minimal', 'open').paper).toBe(0)
  })

  it('keeps frequent and looping Zen cues free from paper and brush noise', () => {
    for (const cue of ['hover', 'press', 'select', 'typing', 'volume-change'] as const) {
      const recipe = createRecipe('zen', cue)
      expect(recipe.paper).toBe(0)
      expect(recipe.brush).toBe(0)
      expect(recipe.noise).toBe(0)
    }
    for (const cue of ['loading', 'processing', 'recording', 'connecting', 'scanning', 'streaming'] as const) {
      const recipe = createRecipe('zen', cue)
      expect(recipe.paper).toBe(0)
      expect(recipe.brush).toBe(0)
      expect(recipe.noise).toBe(0)
    }
  })

  it('keeps frequent Zen feedback brief enough for repeated use', () => {
    expect(activeDuration('zen', 'hover')).toBeLessThan(0.04)
    expect(activeDuration('zen', 'press')).toBeLessThan(0.06)
    expect(activeDuration('zen', 'focus')).toBeLessThan(0.07)
    expect(activeDuration('zen', 'progress-step')).toBeLessThan(0.11)
    expect(activeDuration('zen', 'volume-change')).toBeLessThan(0.13)
  })

  it('masters Zen below the more assertive packs', () => {
    const hover = renderRecipe(createRecipe('zen', 'hover'), 16_000)
    const success = renderRecipe(createRecipe('zen', 'success'), 16_000)
    const loading = renderRecipe(createRecipe('zen', 'loading'), 16_000)
    const minimalSuccess = renderRecipe(createRecipe('minimal', 'success'), 16_000)

    expect(hover.peak).toBeLessThanOrEqual(0.221)
    expect(success.peak).toBeLessThanOrEqual(0.341)
    expect(loading.peak).toBeLessThanOrEqual(0.231)
    expect(success.peak).toBeLessThan(minimalSuccess.peak)
  })

  it('renders loop buffers with click-free samples and slopes at the seam', () => {
    for (const cue of ['loading', 'processing', 'recording', 'connecting', 'scanning', 'streaming'] as const) {
      for (const pack of PACKS) {
        const rendered = renderRecipe(createRecipe(pack.name, cue), 16_000)
        const finalFrame = rendered.left.length - 1
        const leftJump = Math.abs((rendered.left[0] ?? 0) - (rendered.left[finalFrame] ?? 0))
        const rightJump = Math.abs((rendered.right[0] ?? 0) - (rendered.right[finalFrame] ?? 0))
        const leftSlopeJump = Math.abs(
          ((rendered.left[1] ?? 0) - (rendered.left[0] ?? 0))
          - ((rendered.left[finalFrame] ?? 0) - (rendered.left[finalFrame - 1] ?? 0)),
        )
        const rightSlopeJump = Math.abs(
          ((rendered.right[1] ?? 0) - (rendered.right[0] ?? 0))
          - ((rendered.right[finalFrame] ?? 0) - (rendered.right[finalFrame - 1] ?? 0)),
        )
        expect(leftJump).toBeLessThan(0.012)
        expect(rightJump).toBeLessThan(0.012)
        expect(leftSlopeJump).toBeLessThan(0.02)
        expect(rightSlopeJump).toBeLessThan(0.02)
      }
    }
  })

  it('does not mute the first pulse of a loop at the mastering boundary', () => {
    for (const pack of PACKS) {
      const rendered = renderRecipe(createRecipe(pack.name, 'loading'), 16_000)
      const firstPulse = rms(rendered.left, 48, 192)
      const secondPulse = rms(rendered.left, 4_848, 4_992)
      expect(firstPulse / Math.max(secondPulse, 0.000_001)).toBeGreaterThan(0.62)
    }
  })

  it('preserves an even musical clock across every loop boundary and feel', () => {
    for (const cue of CUES.filter((candidate) => 'loop' in candidate && candidate.loop)) {
      const baseOnsets = cue.notes.map((note) => note.at)
      const cyclicGaps = baseOnsets.map((onset, index) => {
        const next = baseOnsets[(index + 1) % baseOnsets.length] ?? 0
        return (next > onset ? next : next + cue.duration) - onset
      })
      const targetGap = cue.duration / baseOnsets.length
      expect(Math.max(...cyclicGaps.map((gap) => Math.abs(gap - targetGap)))).toBeLessThan(0.000_001)

      for (const pack of PACKS) {
        const recipe = createRecipe(pack.name, cue.name)
        expect(recipe.notes.map((note) => note.at)).toEqual(baseOnsets)
      }
    }
  })

  it('keeps texture attached to sound events instead of leaving an ambient noise bed', () => {
    for (const pack of PACKS) {
      const recipe = createRecipe(pack.name, 'hover')
      const rendered = renderRecipe({ ...recipe, echo: 0 }, 16_000)
      const afterLastNote = Math.ceil(Math.max(...recipe.notes.map((note) => note.at + note.length)) * 16_000)
      const residue = rms(rendered.left, afterLastNote + 32, afterLastNote + 192)
      expect(residue).toBeLessThan(0.000_08)
    }
  })

  it('ends every one-shot on a clean digital-black tail', () => {
    for (const pack of PACKS) {
      for (const cue of CUES.filter((candidate) => !('loop' in candidate) || !candidate.loop)) {
        const rendered = renderRecipe(createRecipe(pack.name, cue.name), 8_000)
        const onsetThreshold = Math.max(0.000_01, rendered.peak * 0.001)
        const firstActiveFrame = rendered.left.findIndex((sample, index) => (
          Math.max(Math.abs(sample), Math.abs(rendered.right[index] ?? 0)) >= onsetThreshold
        ))
        const finalTwentyMs = rms(rendered.left, rendered.left.length - 160, rendered.left.length)
        expect(firstActiveFrame).toBeGreaterThanOrEqual(0)
        expect(firstActiveFrame / 8_000).toBeLessThan(0.08)
        expect(finalTwentyMs).toBeLessThan(0.000_32)
      }
    }
  }, 10_000)

  it('keeps the playful packs expressive without forcing a large glide onto every cue', () => {
    for (const cue of ['hover', 'select', 'notification', 'info', 'progress-step'] as const) {
      for (const pack of ['scifi', 'rubber'] as const) {
        const recipe = createRecipe(pack, cue)
        expect(Math.max(...recipe.notes.map((note) => Math.abs(note.glide ?? 0)))).toBeLessThanOrEqual(3)
      }
    }
  })
})
