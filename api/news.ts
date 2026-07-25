import { fetchLatestNews } from '../server/fetchNews'
import type { NewsApiResponse } from '../src/types'

export const config = {
  runtime: 'edge',
}

export default async function handler(): Promise<Response> {
  try {
    const items = await fetchLatestNews()
    const body: NewsApiResponse = {
      updatedAt: new Date().toISOString(),
      items,
      source: 'live',
    }
    return Response.json(body, {
      headers: {
        'Cache-Control': 's-maxage=90, stale-while-revalidate=300',
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
