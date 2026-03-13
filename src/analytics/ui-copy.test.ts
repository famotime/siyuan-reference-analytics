import { describe, expect, it } from 'vitest'

import { DOCUMENT_DETAIL_DESCRIPTION, SUGGESTION_TYPE_LABELS } from './ui-copy'

describe('ui copy', () => {
  it('describes document detail panel as following the active document', () => {
    expect(DOCUMENT_DETAIL_DESCRIPTION)
      .toBe('跟随主浏览区当前打开文档，汇总其社区位置、桥接角色与沉没风险。')
  })

  it('exposes suggestion type labels', () => {
    expect(SUGGESTION_TYPE_LABELS).toEqual({
      'promote-hub': '升级为主题页',
      'repair-orphan': '补齐链接',
      'maintain-bridge': '重点维护',
      'archive-dormant': '归档沉没',
    })
  })
})
