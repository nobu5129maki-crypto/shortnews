import { useCallback, useEffect, useRef, useState } from 'react'
import { newsItems as fallbackNews } from '../data/news'
import type { ContentGenreId, NewsApiResponse, NewsItem } from '../types'

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

export function useLiveNews(myGenres: ContentGenreId[]): LiveNewsState {
  const [items, setItems] = useState<NewsItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')
  const inFlight = useRef(false)
  const hasLive = useRef(false)
  const genresKey = myGenres.slice().sort().join(',')

  const refresh = useCallback(async () => {
    if (myGenres.length === 0) {
      setItems([])
      setUpdatedAt(null)
      setLoading(false)
      setRefreshing(false)
      setError(null)
      setSource('live')
      return
    }

    if (inFlight.current) return
    inFlight.current = true
    setRefreshing(true)
    try {
      const params = new URLSearchParams({
        t: String(Date.now()),
        genres: genresKey,
      })
      const response = await fetch(`/api/news?${params}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as NewsApiResponse
      if (!Array.isArray(data.items)) throw new Error('invalid news')

      setItems(data.items)
      setUpdatedAt(data.updatedAt)
      setSource('live')
      setError(null)
      hasLive.current = true
    } catch (err) {
      console.error(err)
      setError('最新ニュースを取得できませんでした。再試行できます。')
      if (!hasLive.current) {
        const selected = genresKey.split(',').filter(Boolean) as ContentGenreId[]
        const fallback = fallbackNews.filter((item) => selected.includes(item.genre))
        setItems(fallback)
        setSource('fallback')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      inFlight.current = false
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
