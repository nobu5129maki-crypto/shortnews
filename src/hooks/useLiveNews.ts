import { useCallback, useEffect, useRef, useState } from 'react'
import { newsItems as fallbackNews } from '../data/news'
import type { NewsItem } from '../types'
import type { NewsApiResponse } from '../types'

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

export function useLiveNews(): LiveNewsState {
  const [items, setItems] = useState<NewsItem[]>(fallbackNews)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')
  const inFlight = useRef(false)
  const hasLive = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setRefreshing(true)
    try {
      const response = await fetch(`/api/news?t=${Date.now()}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as NewsApiResponse
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error('empty news')
      }
      setItems(data.items)
      setUpdatedAt(data.updatedAt)
      setSource('live')
      setError(null)
      hasLive.current = true
    } catch (err) {
      console.error(err)
      setError('最新ニュースを取得できませんでした。再試行できます。')
      if (!hasLive.current) {
        setItems(fallbackNews)
        setSource('fallback')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
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
