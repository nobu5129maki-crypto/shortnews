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

function readSetupDone(): boolean {
  try {
    return localStorage.getItem(SETUP_KEY) === '1'
  } catch {
    return false
  }
}

export function useMyGenres() {
  const [ready, setReady] = useState(false)
  const [setupDone, setSetupDone] = useState(false)
  const [myGenres, setMyGenres] = useState<ContentGenreId[]>([])

  useEffect(() => {
    const stored = readGenres()
    const done = readSetupDone() && stored.length > 0
    setMyGenres(stored)
    setSetupDone(done)
    setReady(true)
  }, [])

  const persist = useCallback((next: ContentGenreId[], markSetup = true) => {
    const unique = Array.from(new Set(next)).filter((id) => validIds.has(id))
    setMyGenres(unique)
    localStorage.setItem(GENRES_KEY, JSON.stringify(unique))
    if (markSetup && unique.length > 0) {
      localStorage.setItem(SETUP_KEY, '1')
      setSetupDone(true)
    }
  }, [])

  const completeSetup = useCallback(
    (selected: ContentGenreId[]) => {
      if (selected.length === 0) return
      persist(selected, true)
    },
    [persist],
  )

  const addGenre = useCallback(
    (id: ContentGenreId) => {
      if (myGenres.includes(id)) return
      persist([...myGenres, id])
    },
    [myGenres, persist],
  )

  const removeGenre = useCallback(
    (id: ContentGenreId) => {
      if (myGenres.length <= 1) return false
      persist(myGenres.filter((genreId) => genreId !== id))
      return true
    },
    [myGenres, persist],
  )

  const replaceGenres = useCallback(
    (selected: ContentGenreId[]) => {
      if (selected.length === 0) return false
      persist(selected)
      return true
    },
    [persist],
  )

  return {
    ready,
    setupDone,
    myGenres,
    completeSetup,
    addGenre,
    removeGenre,
    replaceGenres,
  }
}
