import type { NewsItem } from '../types'

/** タイトルと同内容／極端に短い本文は「詳細」として扱わない */
export function hasReadableDetail(
  item: Pick<NewsItem, 'title' | 'detail'>,
): boolean {
  const detail = item.detail?.trim() ?? ''
  if (detail.length < 120) return false
  const title = item.title?.trim() ?? ''
  if (!title) return true
  const normalizedDetail = detail.replace(/\s+/g, '')
  const normalizedTitle = title.replace(/\s+/g, '')
  if (normalizedDetail === normalizedTitle) return false
  if (
    normalizedDetail.startsWith(normalizedTitle) &&
    normalizedDetail.length <= normalizedTitle.length + 18
  ) {
    return false
  }
  return true
}
