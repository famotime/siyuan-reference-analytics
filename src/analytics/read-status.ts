import type { DocumentRecord } from './analysis'
import type { PluginConfig } from '@/types/config'

export type ReadMarkerConfig = Pick<PluginConfig, 'readTagNames' | 'readTitlePrefixes' | 'readTitleSuffixes'>
export type ReadCardMode = 'read' | 'unread'

export interface ReadMatchItem {
  documentId: string
  title: string
  matchedTags: string[]
  matchedPrefixes: string[]
  matchedSuffixes: string[]
}

export function collectReadMatches(params: {
  documents: DocumentRecord[]
  config?: ReadMarkerConfig | null
}): ReadMatchItem[] {
  const config = params.config
  const tagNames = normalizeSelectedTags(config?.readTagNames)
  const prefixes = normalizeTitleRules(config?.readTitlePrefixes)
  const suffixes = normalizeTitleRules(config?.readTitleSuffixes)

  if (tagNames.length === 0 && prefixes.length === 0 && suffixes.length === 0) {
    return []
  }

  const selectedTags = new Set(tagNames)

  return params.documents
    .map((document) => {
      const title = resolveDocumentTitle(document)
      const matchedTags = normalizeDocumentTags(document.tags).filter(tag => selectedTags.has(tag))
      const matchedPrefixes = prefixes.filter(prefix => title.startsWith(prefix))
      const matchedSuffixes = suffixes.filter(suffix => title.endsWith(suffix))

      if (matchedTags.length === 0 && matchedPrefixes.length === 0 && matchedSuffixes.length === 0) {
        return null
      }

      return {
        documentId: document.id,
        title,
        matchedTags,
        matchedPrefixes,
        matchedSuffixes,
      }
    })
    .filter((item): item is ReadMatchItem => item !== null)
    .sort((left, right) => left.documentId.localeCompare(right.documentId))
}

export function normalizeTitleRules(value?: string): string[] {
  if (!value) {
    return []
  }

  return value
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeSelectedTags(tags?: readonly string[]): string[] {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags
    .map(tag => tag.trim())
    .filter(Boolean)
}

function normalizeDocumentTags(tags?: readonly string[] | string): string[] {
  if (!tags) {
    return []
  }
  if (Array.isArray(tags)) {
    return tags
      .map(tag => tag.trim())
      .filter(Boolean)
  }

  return tags
    .split(/[,\s#]+/)
    .map(tag => tag.trim())
    .filter(Boolean)
}

function resolveDocumentTitle(document: Pick<DocumentRecord, 'title' | 'name' | 'hpath' | 'path' | 'id'>): string {
  return document.title || document.name || document.hpath || document.path || document.id
}
