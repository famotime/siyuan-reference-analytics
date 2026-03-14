import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import SummaryCardsGrid from './SummaryCardsGrid.vue'

describe('SummaryCardsGrid', () => {
  it('renders draggable summary cards and a read-mode toggle button', async () => {
    const app = createSSRApp({
      render: () => h(SummaryCardsGrid, {
        cards: [
          { key: 'documents', label: '文档样本', value: '8', hint: '命中当前筛选条件的文档数' },
          { key: 'read', label: '已读文档', value: '3', hint: '命中已读标记规则的文档数' },
        ],
        selectedSummaryCardKey: 'read',
        readCardMode: 'read',
        onSelectSummaryCard: vi.fn(),
        onToggleReadCardMode: vi.fn(),
        onReorderSummaryCard: vi.fn(),
      }),
    })

    const html = await renderToString(app)

    expect(html).toContain('summary-grid')
    expect(html).toContain('draggable="true"')
    expect(html).toContain('summary-card__toggle')
    expect(html).toContain('切换为未读文档')
    expect(html).toContain('文档样本')
    expect(html).toContain('已读文档')
  })
})
