import { useCallback, useEffect, useState } from 'react'
import type { ContentGenreId } from '../types'
import { genres } from '../data/news'

const GENRES_KEY = 'brief.myGenres'
const SETUP_KEY = 'brief.setupDone'

const validIds = new Set(genres.map((genre) => genre.id))

function readGenres(): ContentGenreId[] {
  try {
    const raw = localStorage.getItem(GENRES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (id): id is ContentGenreId =>
        typeof id === 'string' && validIds.has(id as ContentGenreId),
    )
  } catch {
    return []
  }
}

export function useMyGenres() {
  const [ready, setReady] = useState(false)
  const [myGenres, setMyGenres] = useState<ContentGenreId[]>([])

  useEffect(() => {
    setMyGenres(readGenres())
    try {
      localStorage.setItem(SETUP_KEY, '1')
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const persist = useCallback((next: ContentGenreId[]) => {
    const unique = Array.from(new Set(next)).filter((id) => validIds.has(id))
    setMyGenres(unique)
    localStorage.setItem(GENRES_KEY, JSON.stringify(unique))
  }, [])

  const addGenre = useCallback(
    (id: ContentGenreId) => {
      if (!validIds.has(id) || myGenres.includes(id)) return
      persist([...myGenres, id])
    },
    [myGenres, persist],
  )

  const removeGenre = useCallback(
    (id: ContentGenreId) => {
      persist(myGenres.filter((genreId) => genreId !== id))
    },
    [myGenres, persist],
  )

  return {
    ready,
    myGenres,
    addGenre,
    removeGenre,
  }
}
