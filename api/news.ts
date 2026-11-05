import {
  NewsBusyError,
  fetchLatestNewsCached,
  genresFromSearchParams,
} from '../server/fetchNews.js'
import type { NewsApiResponse } from '../server/types.js'

export const config = {
  runtime: 'edge',
}

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 36

type Bucket = { start: number; count: number }
const buckets = new Map<string, Bucket>()

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) {
    const ip = fwd.split(',')[0]?.trim()
    if (ip) return ip
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/** 同一IPからの連打を止める。CDNキャッシュに載る通常利用はここまで届きにくい */
function tooManyRequests(ip: string): boolean {
  const now = Date.now()
  if (buckets.size > 400) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.start >= WINDOW_MS) buckets.delete(key)
    }
  }
  const bucket = buckets.get(ip)
  if (!bucket || now - bucket.start >= WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 })
    return false
  }
  bucket.count += 1
  return bucket.count > MAX_PER_WINDOW
}

export default async function handler(request: Request): Promise<Response> {
  if (tooManyRequests(clientIp(request))) {
    return Response.json(
      {
        error: 'rate_limited',
        message: 'アクセスが集中しています。少し待ってから再度お試しください',
      },
      {
        status: 429,
        headers: {
          'Retry-After': '30',
          'Cache-Control': 'private, no-store',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }

  try {
    const url = new URL(request.url)
    const genreIds = genresFromSearchParams(url.searchParams)
    if (genreIds.length === 0) {
      return Response.json(
        { error: 'genre_required', message: 'ジャンルを指定してください' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'private, no-store',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }
    const { items, cached } = await fetchLatestNewsCached(genreIds)
    const body: NewsApiResponse = {
      updatedAt: new Date().toISOString(),
      items,
      source: 'live',
    }
    return Response.json(body, {
      headers: {
        // 同じジャンルの連続アクセスは CDN で返し、関数の実行時間を増やさない
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        'Access-Control-Allow-Origin': '*',
        'X-News-Cache': cached ? 'hit' : 'miss',
      },
    })
  } catch (error) {
    if (error instanceof NewsBusyError) {
      return Response.json(
        {
          error: 'rate_limited',
          message: 'ニュース取得が混み合っています。少し待ってから再度お試しください',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '5',
            'Cache-Control': 'private, no-store',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }
    console.error(error)
    return Response.json(
      { error: 'news_fetch_failed', message: '最新ニュースの取得に失敗しました' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    )
  }
}
