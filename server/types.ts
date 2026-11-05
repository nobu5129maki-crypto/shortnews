export type BuiltinGenreId =
  | 'politics'
  | 'business'
  | 'tech'
  | 'ai'
  | 'sports'
  | 'entertainment'
  | 'world'
  | 'science'
  | 'life'

/** Built-in or free-form search genre id (`search:...`) */
export type GenreId = string

export type FeedTabId = GenreId

export type Genre = {
  id: GenreId
  label: string
  blurb?: string
}

export type RelatedTopic = {
  id: string
  label: string
  detail: string
}

export type NewsItem = {
  id: string
  genre: GenreId
  title: string
  summary: string
  detail: string
  keyPoints: string[]
  related: RelatedTopic[]
  source: string
  /** ISO 8601 datetime or display string */
  publishedAt: string
  url?: string
  videoUrl: string
  posterUrl: string
  likes: number
  comments: number
}

export type NewsApiResponse = {
  updatedAt: string
  items: NewsItem[]
  source: 'live' | 'fallback'
}

export const SEARCH_PREFIX = 'search:'

export function isSearchGenre(id: GenreId): boolean {
  return id.startsWith(SEARCH_PREFIX)
}

const MAX_SEARCH_LABEL = 40

export function toSearchGenreId(label: string): GenreId {
  const trimmed = label.trim().slice(0, MAX_SEARCH_LABEL)
  return `${SEARCH_PREFIX}${encodeURIComponent(trimmed)}`
}

export function labelFromGenreId(id: GenreId): string {
  if (!isSearchGenre(id)) return id
  try {
    return decodeURIComponent(id.slice(SEARCH_PREFIX.length))
  } catch {
    return id.slice(SEARCH_PREFIX.length)
  }
}
