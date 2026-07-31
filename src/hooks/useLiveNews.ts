import { useCallback, useEffect, useRef, useState } from 'react'
import { newsItems as fallbackNews } from '../data/news'
import type { GenreId, NewsApiResponse, NewsItem } from '../types'

const REFRESH_MS = 3 * 60 * 1000
/** スワイプが成立する最低本数。足りなければデモ記事で補完する */
const MIN_SWIPE_ITEMS = 12

type LiveNewsState = {
  items: NewsItem[]
  updatedAt: string | null
  loading: boolean
  refreshing: boolean
  error: string | null
  source: 'live' | 'fallback' | 'mixed'
  refresh: () => Promise<void>
}

function titleKey(title: string): string {
  return title.replace(/\s+/g, '')
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

  const timeValue = (value: string) => {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return merged.sort(
    (a, b) => timeValue(b.publishedAt) - timeValue(a.publishedAt) || b.id.localeCompare(a.id),
  )
}

function fallbackFor(selected: GenreId[]): NewsItem[] {
  return fallbackNews.filter((item) => selected.includes(item.genre))
}

function ensureVolume(live: NewsItem[], selected: GenreId[]): {
  items: NewsItem[]
  source: 'live' | 'fallback' | 'mixed'
} {
  const demo = fallbackFor(selected)
  if (live.length === 0) {
    return { items: demo, source: 'fallback' }
  }
  if (live.length >= MIN_SWIPE_ITEMS) {
    return { items: live, source: 'live' }
  }
  return {
    items: mergeUnique([live, demo]),
    source: 'mixed',
  }
}

async function fetchGenreNews(
  genre: GenreId,
  signal: AbortSignal,
): Promise<NewsItem[]> {
  const params = new URLSearchParams()
  params.append('g', genre)
  const response = await fetch(`/api/news?${params}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as NewsApiResponse
  if (!Array.isArray(data.items)) throw new Error('invalid news')
  return data.items.filter((item) => item.genre === genre)
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
  const genresKey = myGenres.slice().sort().join('\n')

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

    // 取得中もスワイプできるよう、先にデモで埋める
    if (!hasLive.current) {
      const seeded = ensureVolume([], selected)
      setItems(seeded.items)
      setSource(seeded.source)
    }

    setRefreshing(true)
    try {
      // ジャンルごとに並列取得（1ジャンルあたりのソース量を最大化し、Edgeタイムアウトを避ける）
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
      if (live.length === 0 && failures === selected.length) {
        throw new Error('all genre fetches failed')
      }

      const ensured = ensureVolume(live, selected)
      setItems(ensured.items)
      setUpdatedAt(new Date().toISOString())
      setSource(ensured.source)
      setError(
        failures > 0
          ? '一部ジャンルの更新に失敗しました。再試行できます。'
          : null,
      )
      hasLive.current = live.length > 0
    } catch (err) {
      if (controller.signal.aborted || currentRequest !== requestId.current) {
        return
      }
      console.error(err)
      setError('最新ニュースを取得できませんでした。再試行できます。')
      if (!hasLive.current) {
        const seeded = ensureVolume([], selected)
        setItems(seeded.items)
        setSource(seeded.source)
      }
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
