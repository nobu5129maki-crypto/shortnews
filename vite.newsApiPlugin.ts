import type { Plugin } from 'vite'
import { fetchLatestNews, parseGenreQuery } from './server/fetchNews.ts'
import type { NewsApiResponse } from './src/types.ts'

export function newsApiPlugin(): Plugin {
  return {
    name: 'brief-news-api',
    configureServer(server) {
      server.middlewares.use('/api/news', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/api/news', 'http://localhost')
          const genreIds = parseGenreQuery(url.searchParams.get('genres'))
          const items = await fetchLatestNews(genreIds)
          const body: NewsApiResponse = {
            updatedAt: new Date().toISOString(),
            items,
            source: 'live',
          }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(body))
        } catch (error) {
          console.error('[news-api]', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              error: 'news_fetch_failed',
              message: '最新ニュースの取得に失敗しました',
            }),
          )
        }
      })
    },
  }
}
