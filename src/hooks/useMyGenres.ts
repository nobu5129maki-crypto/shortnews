import { useCallback, useEffect, useState } from 'react'
import { normalizeGenreId } from '../lib/genres'
import type { GenreId } from '../types'

const GENRES_KEY = 'brief.myGenres.v3'
const SETUP_KEY = 'brief.setupDone.v3'

function readGenres(): GenreId[] {
  try {
    const raw = localStorage.getItem(GENRES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id) => normalizeGenreId(id))
      .filter((id): id is GenreId => Boolean(id))
  } catch {
    return []
  }
}

export function useMyGenres() {
  const [ready, setReady] = useState(false)
  const [myGenres, setMyGenres] = useState<GenreId[]>([])

  useEffect(() => {
    setMyGenres(readGenres())
    try {
      localStorage.setItem(SETUP_KEY, '1')
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const persist = useCallback((next: GenreId[]) => {
    const unique = Array.from(
      new Set(
        next
          .map((id) => normalizeGenreId(id))
          .filter((id): id is GenreId => Boolean(id)),
      ),
    )
    setMyGenres(unique)
    localStorage.setItem(GENRES_KEY, JSON.stringify(unique))
  }, [])

  const addGenre = useCallback(
    (idOrLabel: string) => {
      const id = normalizeGenreId(idOrLabel)
      if (!id || myGenres.includes(id)) return
      persist([...myGenres, id])
    },
    [myGenres, persist],
  )

  const removeGenre = useCallback(
    (id: GenreId) => {
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
