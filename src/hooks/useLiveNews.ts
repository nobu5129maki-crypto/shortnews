import { useCallback, useEffect, useRef, useState } from 'react'
import { newsItems as fallbackNews } from '../data/news'
import { hasReadableDetail } from '../lib/detail'
import type { GenreId, NewsApiResponse, NewsItem } from '../types'

const REFRESH_MS = 3 * 60 * 1000
const FETCH_TIMEOUT_MS = 28_000
const MIN_SWIPE_ITEMS = 12
const HISTORY_KEY = 'brief.newsHistory.v2'
const MAX_HISTORY_PER_GENRE = 60
/** 履歴・表示に残す最大経過時間（古い記事でフィードが埋まるのを防ぐ） */
const MAX_ARTICLE_AGE_MS = 7 * 24 * 60 * 60 * 1000

type LiveNewsState = {
  items: NewsItem[]
  updatedAt: string | null
  loading: boolean
  refreshing: boolean
  error: string | null
  source: 'live' | 'fallback' | 'mixed'
  refresh: () => Promise<void>
}

type HistoryMap = Record<string, NewsItem[]>

function titleKey(title: string): string {
  return title.replace(/\s+/g, '')
}

function timeValue(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function isFreshEnough(item: NewsItem, now = Date.now()): boolean {
  const published = timeValue(item.publishedAt)
  if (published <= 0) return true
  return now - published <= MAX_ARTICLE_AGE_MS
}

/** 詳細がある記事を最新帯へわずかに押し上げる（ジャンル差で詳細が出ないのを防ぐ） */
function detailBoostMs(item: NewsItem): number {
  if (!hasReadableDetail(item)) return 0
  const len = item.detail?.trim().length ?? 0
  if (len >= 400) return 6 * 60 * 60 * 1000
  if (len >= 180) return 4 * 60 * 60 * 1000
  return 75 * 60 * 1000
}

function sortByNewest(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) =>
      timeValue(b.publishedAt) +
        detailBoostMs(b) -
        (timeValue(a.publishedAt) + detailBoostMs(a)) ||
      b.id.localeCompare(a.id),
  )
}

/** 古い → 新しい（上スワイプで最新、下スワイプで過去）。読める詳細を最新着地に寄せる */
function sortByOldest(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) =>
      timeValue(a.publishedAt) +
        detailBoostMs(a) -
        (timeValue(b.publishedAt) + detailBoostMs(b)) ||
      a.id.localeCompare(b.id),
  )
}

function mergeUnique(parts: NewsItem[][]): NewsItem[] {
  const seenIds = new Set<string>()
  const seenTitles = new Set<string>()
  const merged: NewsItem[] = []

  for (const list of parts) {
    for (const item of list) {
      const key = titleKey(item.title)
      if (seenIds.has(item.id) || seenTitles.has(key)) continue
      seenIds.add(item.id)
      seenTitles.add(key)
      merged.push(item)
    }
  }

  return sortByOldest(merged)
}

/** 重複排除したうえで新しい順に上限まで残す（履歴が古い記事で埋まらないようにする） */
function keepNewestUnique(parts: NewsItem[][], limit: number): NewsItem[] {
  return sortByNewest(mergeUnique(parts)).slice(0, limit)
}

function readHistory(): HistoryMap {
  try {
    const raw =
      localStorage.getItem(HISTORY_KEY) ??
      localStorage.getItem('brief.newsHistory.v1')
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const now = Date.now()
    const next: HistoryMap = {}
    for (const [genre, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue
      const items = value.filter((item): item is NewsItem => {
        if (!item || typeof item !== 'object') return false
        const row = item as NewsItem
        return (
          typeof row.id === 'string' &&
          typeof row.genre === 'string' &&
          typeof row.title === 'string' &&
          typeof row.detail === 'string' &&
          typeof row.publishedAt === 'string'
        )
      })
      const fresh = keepNewestUnique(
        [items.filter((item) => isFreshEnough(item, now))],
        MAX_HISTORY_PER_GENRE,
      )
      if (fresh.length > 0) next[genre] = fresh
    }
    return next
  } catch {
    return {}
  }
}

function persistHistory(map: HistoryMap) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

function historyFor(selected: GenreId[], map: HistoryMap): NewsItem[] {
  const now = Date.now()
  const parts: NewsItem[][] = []
  for (const genre of selected) {
    const list = map[genre]
    if (list && list.length > 0) {
      parts.push(list.filter((item) => isFreshEnough(item, now)))
    }
  }
  return mergeUnique(parts)
}

function rememberLiveArticles(selected: GenreId[], live: NewsItem[], prev: HistoryMap): HistoryMap {
  const next: HistoryMap = { ...prev }
  const now = Date.now()
  for (const genre of selected) {
    const incoming = live.filter(
      (item) =>
        item.genre === genre &&
        item.id.startsWith('live-') &&
        isFreshEnough(item, now),
    )
    if (incoming.length === 0) continue
    // 必ず新しい順で切り詰める（古い順 slice だと最新が落ちて古い記事だけ残る）
    next[genre] = keepNewestUnique(
      [incoming, (next[genre] ?? []).filter((item) => isFreshEnough(item, now))],
      MAX_HISTORY_PER_GENRE,
    )
  }
  persistHistory(next)
  return next
}

function fallbackFor(selected: GenreId[]): NewsItem[] {
  return fallbackNews.filter((item) => selected.includes(item.genre))
}

function scopeToGenres(items: NewsItem[], selected: GenreId[]): NewsItem[] {
  if (selected.length === 0) return []
  const allowed = new Set(selected)
  return items.filter((item) => allowed.has(item.genre))
}

function ensureVolume(
  live: NewsItem[],
  selected: GenreId[],
  history: NewsItem[],
): {
  items: NewsItem[]
  source: 'live' | 'fallback' | 'mixed'
} {
  const now = Date.now()
  const scopedLive = scopeToGenres(live, selected).filter((item) =>
    isFreshEnough(item, now),
  )
  const scopedHistory = scopeToGenres(history, selected).filter((item) =>
    isFreshEnough(item, now),
  )
  const demo = fallbackFor(selected)

  // 本番 → 履歴 → デモを統合し、古い→新しい順にする
  const merged = mergeUnique([scopedLive, scopedHistory, demo])

  if (scopedLive.length === 0 && scopedHistory.length === 0) {
    return { items: merged.length > 0 ? merged : demo, source: 'fallback' }
  }
  if (scopedLive.length >= MIN_SWIPE_ITEMS) {
    return {
      items: mergeUnique([scopedLive, scopedHistory]),
      source: 'live',
    }
  }
  if (scopedLive.length > 0) {
    return {
      items: merged,
      source: scopedHistory.length > 0 || demo.length > 0 ? 'mixed' : 'live',
    }
  }
  // 本番ゼロ・履歴あり
  return {
    items: mergeUnique([scopedHistory, demo]),
    source: 'mixed',
  }
}

async function fetchGenreNews(
  genre: GenreId,
  signal: AbortSignal,
): Promise<NewsItem[]> {
  const params = new URLSearchParams()
  params.append('g', genre)
  const timeoutController = new AbortController()
  const timer = window.setTimeout(() => timeoutController.abort(), FETCH_TIMEOUT_MS)
  const onParentAbort = () => timeoutController.abort()
  signal.addEventListener('abort', onParentAbort)
  try {
    const response = await fetch(`/api/news?${params}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: timeoutController.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as NewsApiResponse
    if (!Array.isArray(data.items)) throw new Error('invalid news')
    return data.items.filter((item) => item.genre === genre)
  } finally {
    window.clearTimeout(timer)
    signal.removeEventListener('abort', onParentAbort)
  }
}

export function useLiveNews(myGenres: GenreId[]): LiveNewsState {
  const [items, setItems] = useState<NewsItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'fallback' | 'mixed'>('fallback')
  const requestId = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const hasLive = useRef(false)
  const historyRef = useRef<HistoryMap>({})
  const genresKey = myGenres.slice().sort().join('\n')

  useEffect(() => {
    historyRef.current = readHistory()
  }, [])

  const refresh = useCallback(async () => {
    const selected = genresKey ? genresKey.split('\n').filter(Boolean) : []
    if (selected.length === 0) {
      abortRef.current?.abort()
      abortRef.current = null
      requestId.current += 1
      setItems([])
      setUpdatedAt(null)
      setLoading(false)
      setRefreshing(false)
      setError(null)
      setSource('live')
      hasLive.current = false
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const currentRequest = ++requestId.current

    const archived = historyFor(selected, historyRef.current)
    // 取得前でも履歴＋デモを出して「ドットあるのに記事なし」を防ぐ
    setItems((prev) =>
      ensureVolume(scopeToGenres(prev, selected), selected, archived).items,
    )

    setRefreshing(true)
    try {
      const settled = await Promise.allSettled(
        selected.map((genre) => fetchGenreNews(genre, controller.signal)),
      )
      if (currentRequest !== requestId.current) return

      const liveParts: NewsItem[][] = []
      let failures = 0
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          liveParts.push(result.value)
        } else if (!controller.signal.aborted) {
          failures += 1
        }
      }

      if (controller.signal.aborted || currentRequest !== requestId.current) {
        return
      }

      const live = mergeUnique(liveParts)
      if (live.length === 0 && failures === selected.length && archived.length === 0) {
        throw new Error('all genre fetches failed')
      }

      historyRef.current = rememberLiveArticles(
        selected,
        live,
        historyRef.current,
      )
      const archivedNext = historyFor(selected, historyRef.current)
      const ensured = ensureVolume(live, selected, archivedNext)
      setItems(ensured.items)
      setUpdatedAt(new Date().toISOString())
      setSource(ensured.source)
      setError(
        failures > 0
          ? '一部ジャンルの更新に失敗しました。再試行できます。'
          : null,
      )
      hasLive.current = live.length > 0 || archivedNext.length > 0
    } catch (err) {
      if (controller.signal.aborted || currentRequest !== requestId.current) {
        return
      }
      console.error(err)
      setError('最新ニュースを取得できませんでした。再試行できます。')
      const archivedNext = historyFor(selected, historyRef.current)
      setItems((prev) => {
        const scoped = scopeToGenres(prev, selected)
        if (scoped.length > 0 || archivedNext.length > 0) {
          return ensureVolume(scoped, selected, archivedNext).items
        }
        return ensureVolume([], selected, archivedNext).items
      })
      if (!hasLive.current) setSource(archivedNext.length > 0 ? 'mixed' : 'fallback')
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [genresKey])

  useEffect(() => {
    hasLive.current = false
    setLoading(true)
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, REFRESH_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
      abortRef.current?.abort()
    }
  }, [refresh])

  return {
    items,
    updatedAt,
    loading,
    refreshing,
    error,
    source,
    refresh,
  }
}
