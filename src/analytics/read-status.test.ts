import { describe, expect, it } from 'vitest'

import { collectReadMatches } from './read-status'

const documents = [
  {
    id: 'doc-read-tag',
    box: 'box-1',
    path: '/read-tag.sy',
    hpath: '/Read Tag',
    title: '普通文档',
    tags: ['已读', '学习'],
  },
  {
    id: 'doc-read-prefix',
    box: 'box-1',
    path: '/read-prefix.sy',
    hpath: '/Read Prefix',
    title: '已读-图分析',
    tags: ['学习'],
  },
  {
    id: 'doc-read-suffix',
    box: 'box-1',
    path: '/read-suffix.sy',
    hpath: '/Read Suffix',
    title: '图分析-五星',
    tags: [],
  },
  {
    id: 'doc-unread',
    box: 'box-1',
    path: '/unread.sy',
    hpath: '/Unread',
    title: '未命中文档',
    tags: ['学习'],
  },
] as const

describe('collectReadMatches', () => {
  it('marks documents as read when any selected tag, prefix, or suffix matches', () => {
    const matches = collectReadMatches({
      documents: [...documents],
      config: {
        readTagNames: ['已读', '五星'],
        readTitlePrefixes: '已读-|三星-',
        readTitleSuffixes: '-五星| -归档 ',
      } as any,
    })

    expect(matches.map(item => item.documentId)).toEqual([
      'doc-read-prefix',
      'doc-read-suffix',
      'doc-read-tag',
    ])
    expect(matches.find(item => item.documentId === 'doc-read-tag')).toEqual(expect.objectContaining({
      matchedTags: ['已读'],
      matchedPrefixes: [],
      matchedSuffixes: [],
    }))
    expect(matches.find(item => item.documentId === 'doc-read-prefix')).toEqual(expect.objectContaining({
      matchedTags: [],
      matchedPrefixes: ['已读-'],
      matchedSuffixes: [],
    }))
    expect(matches.find(item => item.documentId === 'doc-read-suffix')).toEqual(expect.objectContaining({
      matchedTags: [],
      matchedPrefixes: [],
      matchedSuffixes: ['-五星'],
    }))
  })

  it('returns an empty list when no read rule is configured', () => {
    expect(collectReadMatches({
      documents: [...documents],
      config: {
        readTagNames: [],
        readTitlePrefixes: ' | ',
        readTitleSuffixes: '',
      } as any,
    })).toEqual([])
  })
})
