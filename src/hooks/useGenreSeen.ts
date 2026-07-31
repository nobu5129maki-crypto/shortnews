import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GenreId, NewsItem } from '../types'

const SEEN_KEY = 'brief.genreSeen.v2'
const MAX_IDS = 120

type SeenMap = Record<string, string[]>

function isLiveArticleId(id: string): boolean {
  return id.startsWith('live-')
}

function readSeen(): SeenMap {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const next: SeenMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue
      next[key] = value
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .slice(0, MAX_IDS)
    }
    return next
  } catch {
    return {}
  }
}

function persistSeen(map: SeenMap) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

function mergeIds(existing: string[] | undefined, ids: string[]): string[] {
  const merged = [...(existing ?? [])]
  const known = new Set(merged)
  for (const id of ids) {
    if (known.has(id)) continue
    known.add(id)
    merged.push(id)
  }
  if (merged.length <= MAX_IDS) return merged
  return merged.slice(merged.length - MAX_IDS)
}

export function useGenreSeen(myGenres: GenreId[], items: NewsItem[]) {
  const [seen, setSeen] = useState<SeenMap>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSeen(readSeen())
    setReady(true)
  }, [])

  /** ジャンルごとの本番記事IDのみ（デモは新着判定に使わない） */
  const liveIdsByGenre = useMemo(() => {
    const map = new Map<GenreId, string[]>()
    for (const item of items) {
      if (!myGenres.includes(item.genre)) continue
      if (!isLiveArticleId(item.id)) continue
      const list = map.get(item.genre) ?? []
      list.push(item.id)
      map.set(item.genre, list)
    }
    return map
  }, [items, myGenres])

  // 本番記事が揃ってからベースライン（空配列で「全部新着」にしない）
  useEffect(() => {
    if (!ready) return
    setSeen((prev) => {
      let changed = false
      const next = { ...prev }
      for (const genreId of myGenres) {
        if (Object.prototype.hasOwnProperty.call(next, genreId)) continue
        const ids = liveIdsByGenre.get(genreId) ?? []
        if (ids.length === 0) continue
        next[genreId] = ids.slice(0, MAX_IDS)
        changed = true
      }
      if (!changed) return prev
      persistSeen(next)
      return next
    })
  }, [ready, myGenres, liveIdsByGenre])

  const newGenreIds = useMemo(() => {
    const set = new Set<GenreId>()
    if (!ready) return set
    for (const genreId of myGenres) {
      const ids = liveIdsByGenre.get(genreId) ?? []
      // 表示できる本番記事が無いジャンルにドットを付けない
      if (ids.length === 0) continue
      if (!Object.prototype.hasOwnProperty.call(seen, genreId)) continue
      const known = new Set(seen[genreId] ?? [])
      if (ids.some((id) => !known.has(id))) set.add(genreId)
    }
    return set
  }, [ready, myGenres, liveIdsByGenre, seen])

  const markItemSeen = useCallback((genreId: GenreId, itemId: string) => {
    if (!itemId.startsWith('live-')) return
    setSeen((prev) => {
      if ((prev[genreId] ?? []).includes(itemId)) return prev
      const next = { ...prev, [genreId]: mergeIds(prev[genreId], [itemId]) }
      persistSeen(next)
      return next
    })
  }, [])

  const markGenreSeen = useCallback(
    (genreId: GenreId) => {
      const ids = liveIdsByGenre.get(genreId) ?? []
      if (ids.length === 0) return
      setSeen((prev) => {
        const merged = mergeIds(prev[genreId], ids)
        const prevIds = prev[genreId] ?? []
        if (
          Object.prototype.hasOwnProperty.call(prev, genreId) &&
          merged.length === prevIds.length &&
          merged.every((id, index) => id === prevIds[index])
        ) {
          return prev
        }
        const next = { ...prev, [genreId]: merged }
        persistSeen(next)
        return next
      })
    },
    [liveIdsByGenre],
  )

  const unseenIdsByGenre = useMemo(() => {
    const map = new Map<GenreId, string[]>()
    if (!ready) return map
    for (const genreId of myGenres) {
      const ids = liveIdsByGenre.get(genreId) ?? []
      if (ids.length === 0) continue
      if (!Object.prototype.hasOwnProperty.call(seen, genreId)) continue
      const known = new Set(seen[genreId] ?? [])
      const unseen = ids.filter((id) => !known.has(id))
      if (unseen.length > 0) map.set(genreId, unseen)
    }
    return map
  }, [ready, myGenres, liveIdsByGenre, seen])

  return {
    newGenreIds,
    unseenIdsByGenre,
    markItemSeen,
    markGenreSeen,
  }
}
