import {
  fetchLatestNews,
  parseGenreQuery,
} from '../server/fetchNews.js'
import type { NewsApiResponse } from '../server/types.js'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const fromG = url.searchParams.getAll('g')
    const genreIds =
      fromG.length > 0 ? fromG : parseGenreQuery(url.searchParams.get('genres'))
    const items = await fetchLatestNews(genreIds)
    const body: NewsApiResponse = {
      updatedAt: new Date().toISOString(),
      items,
      source: 'live',
    }
    return Response.json(body, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'news_fetch_failed', message: '最新ニュースの取得に失敗しました' },
      { status: 500 },
    )
  }
}
