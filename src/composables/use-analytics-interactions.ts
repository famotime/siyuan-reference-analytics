import { ref } from 'vue'

import {
  addThemeLinkToDocumentChange,
  applyThemeLinkToOrphanDocument,
  removeThemeLinkFromDocumentChange,
  type AppliedThemeLinkChange,
} from '@/analytics/orphan-theme-links'
import { syncAssociation as syncAssociationCore, type LinkDirection } from '@/analytics/link-sync'
import type { ThemeDocument } from '@/analytics/theme-documents'

type ShowMessageFn = (text: string, timeout?: number, type?: 'info' | 'error') => void
type BlockWriteFn = (dataType: 'markdown' | 'dom', data: string, parentID: string) => Promise<any>
type BlockDeleteFn = (id: string) => Promise<any>
type BlockUpdateFn = (dataType: 'markdown' | 'dom', data: string, id: string) => Promise<any>
type GetChildBlocksFn = (id: string) => Promise<Array<{ id: string, type?: string }>>
type GetBlockKramdownFn = (id: string) => Promise<{ id: string, kramdown: string }>

export function createLinkAssociationInteractions(params: {
  resolveTitle: (documentId: string) => string
  appendBlock: BlockWriteFn
  prependBlock: BlockWriteFn
  notify: ShowMessageFn
  refresh: () => Promise<void>
  onSelectEvidence: (documentId: string) => void
}) {
  const expandedLinkPanels = ref(new Set<string>())
  const expandedLinkGroups = ref(new Set<string>())
  const syncInProgress = ref(new Set<string>())

  function toggleLinkPanel(documentId: string) {
    if (expandedLinkPanels.value.has(documentId)) {
      expandedLinkPanels.value.delete(documentId)
      return
    }
    expandedLinkPanels.value.add(documentId)
    params.onSelectEvidence(documentId)
  }

  function isLinkPanelExpanded(documentId: string) {
    return expandedLinkPanels.value.has(documentId)
  }

  function buildLinkGroupKey(documentId: string, direction: LinkDirection) {
    return `${documentId}:${direction}`
  }

  function toggleLinkGroup(documentId: string, direction: LinkDirection) {
    const key = buildLinkGroupKey(documentId, direction)
    if (expandedLinkGroups.value.has(key)) {
      expandedLinkGroups.value.delete(key)
      return
    }
    expandedLinkGroups.value.add(key)
  }

  function isLinkGroupExpanded(documentId: string, direction: LinkDirection) {
    return expandedLinkGroups.value.has(buildLinkGroupKey(documentId, direction))
  }

  function buildSyncKey(coreDocumentId: string, targetDocumentId: string, direction: LinkDirection) {
    return `${coreDocumentId}:${targetDocumentId}:${direction}`
  }

  function isSyncing(coreDocumentId: string, targetDocumentId: string, direction: LinkDirection) {
    return syncInProgress.value.has(buildSyncKey(coreDocumentId, targetDocumentId, direction))
  }

  async function syncAssociation(coreDocumentId: string, targetDocumentId: string, direction: LinkDirection) {
    const key = buildSyncKey(coreDocumentId, targetDocumentId, direction)
    if (syncInProgress.value.has(key)) {
      return
    }
    syncInProgress.value.add(key)
    try {
      await syncAssociationCore({
        coreDocumentId,
        targetDocumentId,
        direction,
        resolveTitle: params.resolveTitle,
        appendBlock: params.appendBlock,
        prependBlock: params.prependBlock,
      })
      params.notify('已同步关联链接', 3000, 'info')
      await params.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败'
      params.notify(message, 5000, 'error')
    } finally {
      syncInProgress.value.delete(key)
    }
  }

  return {
    expandedLinkPanels,
    expandedLinkGroups,
    syncInProgress,
    toggleLinkPanel,
    isLinkPanelExpanded,
    toggleLinkGroup,
    isLinkGroupExpanded,
    isSyncing,
    syncAssociation,
  }
}

export function createThemeSuggestionController(params: {
  getThemeDocuments: () => ThemeDocument[]
  notify: ShowMessageFn
  deleteBlock: BlockDeleteFn
  updateBlock: BlockUpdateFn
  getChildBlocks: GetChildBlocksFn
  getBlockKramdown: GetBlockKramdownFn
  prependBlock: BlockWriteFn
}) {
  const pendingThemeSuggestionBlocks = ref(new Map<string, AppliedThemeLinkChange>())

  function clearPendingThemeSuggestionBlocks() {
    pendingThemeSuggestionBlocks.value.clear()
  }

  function isThemeSuggestionActive(orphanDocumentId: string, themeDocumentId: string) {
    return pendingThemeSuggestionBlocks.value.get(orphanDocumentId)?.links.some(item => item.themeDocumentId === themeDocumentId) ?? false
  }

  async function toggleOrphanThemeSuggestion(orphanDocumentId: string, themeDocumentId: string) {
    const existingChange = pendingThemeSuggestionBlocks.value.get(orphanDocumentId)

    if (existingChange?.links.some(item => item.themeDocumentId === themeDocumentId)) {
      try {
        const nextChange = await removeThemeLinkFromDocumentChange({
          change: existingChange,
          themeDocumentId,
          deleteBlock: params.deleteBlock,
          updateBlock: params.updateBlock,
        })
        if (nextChange) {
          pendingThemeSuggestionBlocks.value.set(orphanDocumentId, nextChange)
        } else {
          pendingThemeSuggestionBlocks.value.delete(orphanDocumentId)
        }
        params.notify('已撤销主题链接建议', 3000, 'info')
      } catch (error) {
        const message = error instanceof Error ? error.message : '撤销主题链接失败'
        params.notify(message, 5000, 'error')
      }
      return
    }

    const themeDocument = params.getThemeDocuments().find(item => item.documentId === themeDocumentId)
    if (!themeDocument) {
      params.notify('未找到对应的主题文档', 5000, 'error')
      return
    }

    try {
      const change = existingChange
        ? await addThemeLinkToDocumentChange({
            change: existingChange,
            themeDocumentId: themeDocument.documentId,
            themeDocumentTitle: themeDocument.title,
            updateBlock: params.updateBlock,
          })
        : await applyThemeLinkToOrphanDocument({
            orphanDocumentId,
            themeDocumentId: themeDocument.documentId,
            themeDocumentTitle: themeDocument.title,
            getChildBlocks: params.getChildBlocks,
            getBlockKramdown: params.getBlockKramdown,
            updateBlock: params.updateBlock,
            prependBlock: params.prependBlock,
          })
      pendingThemeSuggestionBlocks.value.set(orphanDocumentId, change)
      params.notify('已插入主题链接，刷新分析后将重新判断孤立状态', 3000, 'info')
    } catch (error) {
      const message = error instanceof Error ? error.message : '插入主题链接失败'
      params.notify(message, 5000, 'error')
    }
  }

  return {
    pendingThemeSuggestionBlocks,
    clearPendingThemeSuggestionBlocks,
    isThemeSuggestionActive,
    toggleOrphanThemeSuggestion,
  }
}
