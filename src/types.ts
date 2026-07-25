export type ContentGenreId =
  | 'politics'
  | 'business'
  | 'tech'
  | 'ai'
  | 'sports'
  | 'entertainment'
  | 'world'
  | 'science'
  | 'life'

export type FeedTabId = 'mine' | ContentGenreId

export type Genre = {
  id: ContentGenreId
  label: string
  blurb: string
}

export type RelatedTopic = {
  id: string
  label: string
  detail: string
}

export type NewsItem = {
  id: string
  genre: ContentGenreId
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
