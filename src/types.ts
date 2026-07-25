export type GenreId =
  | 'all'
  | 'politics'
  | 'business'
  | 'tech'
  | 'ai'
  | 'sports'
  | 'entertainment'
  | 'world'
  | 'science'
  | 'life'

export type Genre = {
  id: GenreId
  label: string
}

export type NewsItem = {
  id: string
  genre: Exclude<GenreId, 'all'>
  title: string
  summary: string
  source: string
  publishedAt: string
  videoUrl: string
  posterUrl: string
  likes: number
  comments: number
}
