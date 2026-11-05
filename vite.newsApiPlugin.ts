import type { Plugin } from 'vite'
import {
  NewsBusyError,
  fetchLatestNewsCached,
  genresFromSearchParams,
} from './server/fetchNews.ts'
import type { NewsApiResponse } from './server/types.ts'

export function newsApiPlugin(): Plugin {
  return {
    name: 'brief-news-api',
    configureServer(server) {
      server.middlewares.use('/api/news', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/api/news', 'http://localhost')
          const genreIds = genresFromSearchParams(url.searchParams)
          if (genreIds.length === 0) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(
              JSON.stringify({
                error: 'genre_required',
                message: 'ジャンルを指定してください',
              }),
            )
            return
          }
          const { items, cached } = await fetchLatestNewsCached(genreIds)
          res.setHeader('X-News-Cache', cached ? 'hit' : 'miss')
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
          const busy = error instanceof NewsBusyError
          res.statusCode = busy ? 429 : 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          if (busy) res.setHeader('Retry-After', '5')
          res.end(
            JSON.stringify({
              error: busy ? 'rate_limited' : 'news_fetch_failed',
              message: busy
                ? 'ニュース取得が混み合っています。少し待ってから再度お試しください'
                : '最新ニュースの取得に失敗しました',
            }),
          )
        }
      })
    },
  }
}
