import { genres as catalog } from '../data/news'
import type { Genre, GenreId } from '../types'
import { isSearchGenre, labelFromGenreId, toSearchGenreId } from '../types'

const builtinIds = new Set(catalog.map((genre) => genre.id))

export function resolveGenre(id: GenreId): Genre {
  const found = catalog.find((genre) => genre.id === id)
  if (found) return found
  const label = labelFromGenreId(id)
  return {
    id: isSearchGenre(id) ? id : toSearchGenreId(label),
    label,
    blurb: 'キーワードニュース',
  }
}

export function normalizeGenreId(input: string): GenreId | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const exact = catalog.find(
    (genre) => genre.label === trimmed || genre.id === trimmed,
  )
  if (exact) return exact.id

  if (isSearchGenre(trimmed)) return trimmed
  if (builtinIds.has(trimmed as GenreId)) return trimmed

  return toSearchGenreId(trimmed)
}

export function resolveGenres(ids: GenreId[]): Genre[] {
  return ids.map(resolveGenre)
}
