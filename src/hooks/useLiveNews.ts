import { useCallback, useEffect, useRef, useState } from 'react'
import { newsItems as fallbackNews } from '../data/news'
import type { GenreId, NewsApiResponse, NewsItem } from '../types'

const REFRESH_MS = 3 * 60 * 1000

type LiveNewsState = {
  items: NewsItem[]
  updatedAt: string | null
  loading: boolean
  refreshing: boolean
  error: string | null
  source: 'live' | 'fallback'
  refresh: () => Promise<void>
}

export function useLiveNews(myGenres: GenreId[]): LiveNewsState {
  const [items, setItems] = useState<NewsItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')
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

    setRefreshing(true)
    try {
      const params = new URLSearchParams()
      for (const genre of selected) params.append('g', genre)
      // Stable query (no Date.now) so SW/CDN can key by genre set; bypass HTTP cache.
      const response = await fetch(`/api/news?${params}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as NewsApiResponse
      if (!Array.isArray(data.items)) throw new Error('invalid news')
      if (currentRequest !== requestId.current) return

      setItems(data.items)
      setUpdatedAt(data.updatedAt)
      setSource('live')
      setError(null)
      hasLive.current = true
    } catch (err) {
      if (controller.signal.aborted || currentRequest !== requestId.current) {
        return
      }
      console.error(err)
      setError('最新ニュースを取得できませんでした。再試行できます。')
      if (!hasLive.current) {
        const fallback = fallbackNews.filter((item) => selected.includes(item.genre))
        setItems(fallback)
        setSource('fallback')
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
    setItems([])
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
