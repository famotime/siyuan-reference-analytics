import type { DocumentRecord, ReferenceRecord, TimeRange } from './analysis'
import { filterReferencesByTimeRange } from './analysis'

export interface LinkAssociationItem {
  documentId: string
  title: string
  direction: 'outbound' | 'inbound'
  isOverlap: boolean
}

export interface LinkAssociations {
  outbound: LinkAssociationItem[]
  inbound: LinkAssociationItem[]
}

export function buildLinkAssociations(params: {
  documentId: string
  references: ReferenceRecord[]
  documentMap: Map<string, DocumentRecord>
  now: Date
  timeRange: TimeRange
}): LinkAssociations {
  const outboundTargets = new Set<string>()
  const inboundSources = new Set<string>()
  const filteredReferences = filterReferencesByTimeRange({
    references: params.references,
    now: params.now,
    timeRange: params.timeRange,
  })

  for (const reference of filteredReferences) {
    if (reference.sourceDocumentId === reference.targetDocumentId) {
      continue
    }
    if (!params.documentMap.has(reference.sourceDocumentId) || !params.documentMap.has(reference.targetDocumentId)) {
      continue
    }
    if (reference.sourceDocumentId === params.documentId) {
      outboundTargets.add(reference.targetDocumentId)
    }
    if (reference.targetDocumentId === params.documentId) {
      inboundSources.add(reference.sourceDocumentId)
    }
  }

  const overlap = new Set<string>([...outboundTargets].filter(documentId => inboundSources.has(documentId)))

  const outbound = buildAssociationList({
    documentIds: outboundTargets,
    documentMap: params.documentMap,
    overlap,
    direction: 'outbound',
  })
  const inbound = buildAssociationList({
    documentIds: inboundSources,
    documentMap: params.documentMap,
    overlap,
    direction: 'inbound',
  })

  return { outbound, inbound }
}

function buildAssociationList(params: {
  documentIds: Set<string>
  documentMap: Map<string, DocumentRecord>
  overlap: Set<string>
  direction: LinkAssociationItem['direction']
}): LinkAssociationItem[] {
  return [...params.documentIds]
    .map((documentId) => {
      const document = params.documentMap.get(documentId)
      if (!document) {
        return null
      }
      return {
        documentId,
        title: resolveTitle(document),
        direction: params.direction,
        isOverlap: params.overlap.has(documentId),
      }
    })
    .filter((item): item is LinkAssociationItem => item !== null)
    .sort((left, right) => left.title.localeCompare(right.title, 'zh-CN'))
}

function resolveTitle(document: DocumentRecord): string {
  return document.title || document.name || document.content || document.hpath || document.id
}
