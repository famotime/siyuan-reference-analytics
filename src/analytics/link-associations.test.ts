import { describe, expect, it } from 'vitest'

import { buildLinkAssociations } from './link-associations'

const now = new Date('2026-03-12T00:00:00Z')

describe('buildLinkAssociations', () => {
  it('builds inbound and outbound document lists with overlap markers', () => {
    const documents = new Map([
      ['doc-core', { id: 'doc-core', title: 'Core' }],
      ['doc-a', { id: 'doc-a', title: 'Alpha' }],
      ['doc-b', { id: 'doc-b', title: 'Beta' }],
      ['doc-c', { id: 'doc-c', title: 'Gamma' }],
    ] as const)

    const associations = buildLinkAssociations({
      documentId: 'doc-core',
      references: [
        { id: 'ref-1', sourceDocumentId: 'doc-core', sourceBlockId: 'blk-1', targetDocumentId: 'doc-a', targetBlockId: 'blk-2', content: '[[Alpha]]', sourceUpdated: '20260311120000' },
        { id: 'ref-2', sourceDocumentId: 'doc-b', sourceBlockId: 'blk-3', targetDocumentId: 'doc-core', targetBlockId: 'blk-4', content: '[[Core]]', sourceUpdated: '20260311120000' },
        { id: 'ref-3', sourceDocumentId: 'doc-core', sourceBlockId: 'blk-5', targetDocumentId: 'doc-b', targetBlockId: 'blk-6', content: '[[Beta]]', sourceUpdated: '20260311120000' },
        { id: 'ref-4', sourceDocumentId: 'doc-c', sourceBlockId: 'blk-7', targetDocumentId: 'doc-core', targetBlockId: 'blk-8', content: '[[Core]]', sourceUpdated: '20260301120000' },
      ],
      documentMap: documents as any,
      now,
      timeRange: '7d',
    })

    expect(associations.outbound.map(item => ({ id: item.documentId, overlap: item.isOverlap }))).toEqual([
      { id: 'doc-a', overlap: false },
      { id: 'doc-b', overlap: true },
    ])
    expect(associations.inbound.map(item => ({ id: item.documentId, overlap: item.isOverlap }))).toEqual([
      { id: 'doc-b', overlap: true },
    ])
  })
})
