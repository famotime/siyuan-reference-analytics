import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('App trend detail layout', () => {
  it('uses section cards and default document title styling in trend detail', async () => {
    const source = await readFile(new URL('./App.vue', import.meta.url), 'utf8')

    expect(source).toContain('trend-section-card')
    expect(source).toContain('trend-record')
    expect(source).toContain('trend-record__meta')
    expect(source).not.toContain('variant="compact"')
  })

  it('exposes drag sorting and a reset order button for summary cards', async () => {
    const source = await readFile(new URL('./App.vue', import.meta.url), 'utf8')

    expect(source).toContain('重置排序')
    expect(source).toContain('draggable="true"')
    expect(source).toContain('@dragstart=')
    expect(source).toContain('@drop.prevent=')
  })

  it('renders a toggle control for switching the read card between unread and read', async () => {
    const source = await readFile(new URL('./App.vue', import.meta.url), 'utf8')

    expect(source).toContain('summary-card__toggle')
    expect(source).toContain('toggleReadCardMode')
    expect(source).toContain('isReadCard(card.key)')
  })

  it('uses an adaptive summary grid and a compact read-card toggle button', async () => {
    const source = await readFile(new URL('./App.vue', import.meta.url), 'utf8')

    expect(source).toContain('grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));')
    expect(source).toContain('width: 20px;')
    expect(source).toContain('height: 20px;')
    expect(source).toContain('width: 10px;')
    expect(source).toContain('height: 10px;')
  })
})
