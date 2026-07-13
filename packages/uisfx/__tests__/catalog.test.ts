import { describe, expect, it } from 'vitest'
import { CATEGORIES, CUES, PACKS, createRecipe, getPlaybackMode, renderRecipe } from '../src'

describe('UI SFX catalog', () => {
  it('covers thirteen semantic categories with 78 cues', () => {
    expect(CATEGORIES).toHaveLength(13)
    expect(CUES).toHaveLength(78)
    for (const category of CATEGORIES) {
      expect(CUES.filter((cue) => cue.category === category.id)).toHaveLength(6)
    }
  })

  it('creates all 858 pack and cue combinations', () => {
    const recipes = PACKS.flatMap((pack) => CUES.map((cue) => createRecipe(pack.name, cue.name)))
    expect(recipes).toHaveLength(858)
    expect(new Set(recipes.map((recipe) => `${recipe.pack}:${recipe.cue}`)).size).toBe(858)
  })

  it('distinguishes brief one-shots from explicit continuous loops', () => {
    const loops = CUES.filter((cue) => getPlaybackMode(cue.name) === 'loop')
    expect(loops.map((cue) => cue.name)).toEqual(['loading', 'processing', 'recording', 'connecting', 'scanning', 'streaming'])
    expect(CUES.filter((cue) => getPlaybackMode(cue.name) === 'one-shot')).toHaveLength(72)
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
    expect(createRecipe('mechanical', 'achievement').notes.length).toBeGreaterThan(createRecipe('minimal', 'achievement').notes.length)
  })

  it('renders loop buffers with quiet, click-free seams', () => {
    for (const cue of ['loading', 'processing', 'recording', 'connecting', 'scanning', 'streaming'] as const) {
      for (const pack of PACKS) {
        const rendered = renderRecipe(createRecipe(pack.name, cue), 16_000)
        const finalFrame = rendered.left.length - 1
        expect(Math.abs(rendered.left[0] ?? 1)).toBeLessThan(0.001)
        expect(Math.abs(rendered.right[0] ?? 1)).toBeLessThan(0.001)
        expect(Math.abs(rendered.left[finalFrame] ?? 1)).toBeLessThan(0.01)
        expect(Math.abs(rendered.right[finalFrame] ?? 1)).toBeLessThan(0.01)
      }
    }
  })
})
