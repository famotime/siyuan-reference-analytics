import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { useAnalyticsState } from './use-analytics'

const now = new Date('2026-03-12T00:00:00Z')

const snapshot = {
  documents: [
    { id: 'doc-a', box: 'box-1', path: '/a.sy', hpath: '/Alpha', title: 'Alpha', tags: ['note'], created: '20260101090000', updated: '20260101120000' },
    { id: 'doc-b', box: 'box-1', path: '/b.sy', hpath: '/Beta', title: 'Beta', tags: ['note'], created: '20260311120000', updated: '20260311120000' },
  ],
  references: [
    { id: 'ref-1', sourceDocumentId: 'doc-a', sourceBlockId: 'blk-a1', targetDocumentId: 'doc-b', targetBlockId: 'blk-b1', content: '[[Beta]]', sourceUpdated: '20260311120000' },
  ],
  notebooks: [],
  fetchedAt: '20260312000000',
}

describe('useAnalyticsState', () => {
  it('refreshes snapshot and updates derived states', async () => {
    const state = useAnalyticsState({
      plugin: { eventBus: { on: () => {}, off: () => {} }, app: {} } as any,
      loadSnapshot: async () => snapshot as any,
      nowProvider: () => now,
      createActiveDocumentSync: () => () => {},
      showMessage: () => {},
      openTab: () => {},
      appendBlock: async () => [],
      prependBlock: async () => [],
    })

    await state.refresh()
    await nextTick()

    const documentCard = state.summaryCards.value.find(card => card.key === 'documents')
    expect(documentCard?.value).toBe('2')
    expect(state.report.value?.ranking.map(item => item.documentId)).toEqual(['doc-b'])
    expect(state.selectedEvidenceDocument.value).toBe('doc-b')
  })
})
