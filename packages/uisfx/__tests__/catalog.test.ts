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

  it('gives Zen cues event-bound paper, brush, wood, and chime materials', () => {
    const paper = createRecipe('zen', 'open')
    const brush = createRecipe('zen', 'scanning')
    const wood = createRecipe('zen', 'press')
    const chime = createRecipe('zen', 'success')

    expect(paper.paper).toBeGreaterThan(0)
    expect(brush.brush).toBeGreaterThan(0)
    expect(wood.wood).toBeGreaterThan(0)
    expect(chime.chime).toBeGreaterThan(0)
    expect(createRecipe('minimal', 'open').paper).toBeUndefined()
  })

  it('masters Zen one-shots and loops below the more assertive packs', () => {
    const hover = renderRecipe(createRecipe('zen', 'hover'), 16_000)
    const success = renderRecipe(createRecipe('zen', 'success'), 16_000)
    const loading = renderRecipe(createRecipe('zen', 'loading'), 16_000)
    const minimalSuccess = renderRecipe(createRecipe('minimal', 'success'), 16_000)

    expect(hover.peak).toBeLessThanOrEqual(0.221)
    expect(success.peak).toBeLessThanOrEqual(0.341)
    expect(loading.peak).toBeLessThanOrEqual(0.231)
    expect(success.peak).toBeLessThan(minimalSuccess.peak)
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
