import type {
  BuiltinGenreId,
  GenreId,
  NewsApiResponse,
  NewsItem,
  RelatedTopic,
} from './types.js'
import { isSearchGenre, labelFromGenreId } from './types.js'

export type { NewsApiResponse }

type FeedSource = {
  genre: GenreId
  url: string
  label: string
  limit?: number
  /** 任意ジャンル用: タイトル/本文に含まれる語で絞り込む */
  query?: string
}

/** 任意ジャンル向け: Bing の site: 検索で横断するメディア */
const SEARCH_SITES: { host: string; label: string }[] = [
  { host: 'news.yahoo.co.jp', label: 'Yahoo!ニュース' },
  { host: 'www.asahi.com', label: '朝日新聞' },
  { host: 'mainichi.jp', label: '毎日新聞' },
  { host: 'www.nikkei.com', label: '日本経済新聞' },
  { host: 'www.nhk.or.jp', label: 'NHK' },
  { host: 'www.nikkansports.com', label: '日刊スポーツ' },
  { host: 'www.sponichi.co.jp', label: 'スポニチ' },
  { host: 'www.tokyo-sports.co.jp', label: '東スポ' },
  { host: 'www.daily.co.jp', label: 'デイリースポーツ' },
  { host: 'number.bunshun.jp', label: 'Number Web' },
  { host: 'www.oricon.co.jp', label: 'ORICON NEWS' },
  { host: 'www.itmedia.co.jp', label: 'ITmedia' },
  { host: 'gigazine.net', label: 'GIGAZINE' },
  { host: 'toyokeizai.net', label: '東洋経済オンライン' },
  { host: 'www.bbc.com', label: 'BBC' },
]

/** 任意ジャンル向け: 直接RSSをキーワードで横断 */
const SEARCH_MEDIA: Omit<FeedSource, 'genre' | 'query'>[] = [
  {
    url: 'https://www.nhk.or.jp/rss/news/cat0.xml',
    label: 'NHK NEWS WEB',
    limit: 24,
  },
  {
    url: 'https://news.livedoor.com/topics/rss/top.xml',
    label: 'ライブドアニュース',
    limit: 24,
  },
  {
    url: 'https://feeds.bbci.co.uk/japanese/rss.xml',
    label: 'BBC News 日本語',
    limit: 24,
  },
  {
    url: 'https://news.yahoo.co.jp/rss/categories/sports.xml',
    label: 'Yahoo!ニュース スポーツ',
    limit: 24,
  },
  {
    url: 'https://news.yahoo.co.jp/rss/categories/domestic.xml',
    label: 'Yahoo!ニュース 国内',
    limit: 24,
  },
  {
    url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
    label: '朝日新聞',
    limit: 20,
  },
  {
    url: 'https://mainichi.jp/rss/etc/mainichi-flash.rss',
    label: '毎日新聞',
    limit: 20,
  },
  {
    url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
    label: 'ITmedia NEWS',
    limit: 20,
  },
]

/** ジャンル別の専門メディア + NHK（補完） */
const FEEDS: FeedSource[] = [
  // 政治
  {
    genre: 'politics',
    url: 'https://www.nhk.or.jp/rss/news/cat4.xml',
    label: 'NHK NEWS WEB',
    limit: 8,
  },
  {
    genre: 'politics',
    url: 'https://news.yahoo.co.jp/rss/categories/domestic.xml',
    label: 'Yahoo!ニュース 国内',
    limit: 10,
  },
  {
    genre: 'politics',
    url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
    label: '朝日新聞',
    limit: 8,
  },
  {
    genre: 'politics',
    url: 'https://mainichi.jp/rss/etc/mainichi-flash.rss',
    label: '毎日新聞',
    limit: 8,
  },

  // 経済
  {
    genre: 'business',
    url: 'https://www.nhk.or.jp/rss/news/cat5.xml',
    label: 'NHK NEWS WEB',
    limit: 8,
  },
  {
    genre: 'business',
    url: 'https://news.yahoo.co.jp/rss/categories/business.xml',
    label: 'Yahoo!ニュース 経済',
    limit: 10,
  },
  {
    genre: 'business',
    url: 'https://toyokeizai.net/list/feed/rss',
    label: '東洋経済オンライン',
    limit: 8,
  },
  {
    genre: 'business',
    url: 'https://assets.wor.jp/rss/rdf/nikkei/news.rdf',
    label: '日本経済新聞',
    limit: 8,
  },

  // テック
  {
    genre: 'tech',
    url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
    label: 'ITmedia NEWS',
    limit: 10,
  },
  {
    genre: 'tech',
    url: 'https://news.yahoo.co.jp/rss/categories/it.xml',
    label: 'Yahoo!ニュース IT',
    limit: 10,
  },
  {
    genre: 'tech',
    url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf',
    label: 'PC Watch',
    limit: 8,
  },
  {
    genre: 'tech',
    url: 'https://www.publickey1.jp/atom.xml',
    label: 'Publickey',
    limit: 8,
  },
  {
    genre: 'tech',
    url: 'https://gigazine.net/news/rss_2.0/',
    label: 'GIGAZINE',
    limit: 8,
  },

  // AI
  {
    genre: 'ai',
    url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    label: 'ITmedia AI+',
    limit: 12,
  },
  {
    genre: 'ai',
    url: 'https://news.yahoo.co.jp/rss/categories/it.xml',
    label: 'Yahoo!ニュース IT',
    limit: 12,
  },
  // スポーツ
  {
    genre: 'sports',
    url: 'https://www.nhk.or.jp/rss/news/cat7.xml',
    label: 'NHK NEWS WEB',
    limit: 8,
  },
  {
    genre: 'sports',
    url: 'https://news.yahoo.co.jp/rss/categories/sports.xml',
    label: 'Yahoo!ニュース スポーツ',
    limit: 10,
  },
  {
    genre: 'sports',
    url: 'https://www.soccer-king.jp/feed',
    label: 'サッカーキング',
    limit: 8,
  },
  {
    genre: 'sports',
    url: 'https://baseballking.jp/feed',
    label: 'ベースボールキング',
    limit: 8,
  },

  // エンタメ
  {
    genre: 'entertainment',
    url: 'https://www.nhk.or.jp/rss/news/cat2.xml',
    label: 'NHK NEWS WEB',
    limit: 8,
  },
  {
    genre: 'entertainment',
    url: 'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
    label: 'Yahoo!ニュース エンタメ',
    limit: 12,
  },

  // 国際
  {
    genre: 'world',
    url: 'https://www.nhk.or.jp/rss/news/cat6.xml',
    label: 'NHK NEWS WEB',
    limit: 8,
  },
  {
    genre: 'world',
    url: 'https://news.yahoo.co.jp/rss/categories/world.xml',
    label: 'Yahoo!ニュース 国際',
    limit: 12,
  },

  // 科学
  {
    genre: 'science',
    url: 'https://www.nhk.or.jp/rss/news/cat3.xml',
    label: 'NHK NEWS WEB',
    limit: 8,
  },
  {
    genre: 'science',
    url: 'https://news.yahoo.co.jp/rss/categories/science.xml',
    label: 'Yahoo!ニュース 科学',
    limit: 12,
  },
  {
    genre: 'tech',
    url: 'https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf',
    label: 'INTERNET Watch',
    limit: 8,
  },

  // ライフ
  {
    genre: 'life',
    url: 'https://www.nhk.or.jp/rss/news/cat1.xml',
    label: 'NHK NEWS WEB',
    limit: 8,
  },
  {
    genre: 'life',
    url: 'https://news.yahoo.co.jp/rss/categories/life.xml',
    label: 'Yahoo!ニュース ライフ',
    limit: 10,
  },
  {
    genre: 'life',
    url: 'https://www.lifehacker.jp/feed/index.xml',
    label: 'Lifehacker Japan',
    limit: 8,
  },
  {
    genre: 'life',
    url: 'https://www.roomie.jp/feed/',
    label: 'ROOMIE',
    limit: 8,
  },
]

const VIDEOS = [
  'https://cdn.coverr.co/videos/coverr-newspaper-printing-press-4421/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-stock-market-data-on-a-screen-4825/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-4255/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-football-stadium-4167/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-people-watching-a-movie-in-a-cinema-4289/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-earth-from-space-4225/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-scientist-working-in-a-lab-5082/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-modern-city-buildings-4244/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-typing-on-a-computer-keyboard-1584/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-artificial-intelligence-robot-5084/720p.mp4',
]

const POSTERS: Record<BuiltinGenreId, string[]> = {
  politics: [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  ],
  business: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80',
  ],
  ai: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    'https://images.unsplash.com/photo-1452626038306-9aae5e071dd1?w=800&q=80',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  ],
  world: [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  ],
  science: [
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
  ],
  life: [
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
  ],
}

const DEFAULT_POSTERS = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80',
]

const AI_PATTERN =
  /AI|ＡＩ|人工知能|生成AI|ChatGPT|GPT|機械学習|LLM|オンデバイス|大規模言語|ディープラーニング|チャットボ[ッッ]ト|生成系/i

type RssItem = {
  title: string
  link: string
  description: string
  pubDate: string
  publisher?: string
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagValue(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = block.match(re)
  return match ? decodeXml(match[1]) : ''
}

function linkValue(block: string, attrs = ''): string {
  const hrefInBlock = block.match(
    /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i,
  )
  if (hrefInBlock) return hrefInBlock[1]

  const anyHref = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  if (anyHref) return anyHref[1]

  const about = attrs.match(/(?:rdf:)?about=["']([^"']+)["']/i)
  if (about) return about[1]

  return tagValue(block, 'link') || tagValue(block, 'guid') || tagValue(block, 'id')
}

function descriptionValue(block: string): string {
  return (
    tagValue(block, 'description') ||
    tagValue(block, 'summary') ||
    tagValue(block, 'content:encoded') ||
    tagValue(block, 'content') ||
    tagValue(block, 'dc:description')
  )
}

function dateValue(block: string): string {
  return (
    tagValue(block, 'pubDate') ||
    tagValue(block, 'published') ||
    tagValue(block, 'updated') ||
    tagValue(block, 'dc:date') ||
    tagValue(block, 'date')
  )
}

function parseFeed(xml: string): RssItem[] {
  const itemChunks = [
    ...xml.matchAll(/<item\b([^>]*)>([\s\S]*?)<\/item>/gi),
  ]
  const entryChunks = [
    ...xml.matchAll(/<entry\b([^>]*)>([\s\S]*?)<\/entry>/gi),
  ]

  const parsed = [...itemChunks, ...entryChunks].map((chunk) => {
    const attrs = chunk[1] ?? ''
    const block = chunk[2] ?? ''
    const title =
      tagValue(block, 'title') || tagValue(block, 'dc:title')
    const description = descriptionValue(block) || title
    const publisher =
      tagValue(block, 'source') ||
      tagValue(block, 'dc:publisher') ||
      tagValue(block, 'author') ||
      undefined
    return {
      title,
      link: unwrapArticleUrl(linkValue(block, attrs)),
      description,
      pubDate: dateValue(block),
      publisher: publisher || publisherFromTitle(title) || undefined,
    }
  })

  return parsed.filter((item) => item.title)
}

function unwrapArticleUrl(link: string): string {
  if (!link) return link
  try {
    const url = new URL(link)
    const nested =
      url.searchParams.get('url') ||
      url.searchParams.get('u') ||
      url.searchParams.get('RU')
    if (nested) {
      try {
        return decodeURIComponent(nested)
      } catch {
        return nested
      }
    }
  } catch {
    /* keep original */
  }
  return link
}

function publisherFromTitle(title: string): string | null {
  const dash = title.match(/\s[-–—]\s([^-–—（(]{2,40})$/)
  if (dash) return dash[1].trim()

  const paren = title.match(/[（(]([^）)]{2,40})[）)](?:\s*[-–—].*)?$/)
  if (paren) return paren[1].trim()

  return null
}

function resolveSourceLabel(
  fallback: string,
  item: RssItem,
): string {
  // site: 指定フィードはメディア名をそのまま使う
  if (!fallback.includes('·')) return fallback
  if (item.publisher?.trim()) return item.publisher.trim()

  const hostLabel = publisherFromUrl(item.link)
  if (hostLabel) return hostLabel
  return fallback
}

function publisherFromUrl(link: string): string | null {
  if (!link) return null
  try {
    const host = new URL(link).hostname.replace(/^www\./, '')
    const known: Record<string, string> = {
      'news.yahoo.co.jp': 'Yahoo!ニュース',
      'yahoo.co.jp': 'Yahoo!ニュース',
      'asahi.com': '朝日新聞',
      'mainichi.jp': '毎日新聞',
      'nikkei.com': '日本経済新聞',
      'nhk.or.jp': 'NHK',
      'nikkansports.com': '日刊スポーツ',
      'sponichi.co.jp': 'スポニチ',
      'tokyo-sports.co.jp': '東スポ',
      'daily.co.jp': 'デイリースポーツ',
      'oricon.co.jp': 'ORICON NEWS',
      'itmedia.co.jp': 'ITmedia',
      'gigazine.net': 'GIGAZINE',
      'toyokeizai.net': '東洋経済オンライン',
      'bbc.com': 'BBC',
      'bbci.co.uk': 'BBC',
      'livedoor.com': 'ライブドアニュース',
      'msn.com': 'MSN',
    }
    for (const [domain, label] of Object.entries(known)) {
      if (host === domain || host.endsWith(`.${domain}`)) return label
    }
  } catch {
    return null
  }
  return null
}

function hashId(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length]
}

function toIso(value: string): string {
  const time = Date.parse(value)
  if (Number.isNaN(time)) return new Date().toISOString()
  return new Date(time).toISOString()
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。．！？!?])/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function buildSummary(description: string): string {
  const sentences = splitSentences(description)
  if (sentences.length === 0) return description.slice(0, 80)
  const first = sentences[0]
  if (first.length <= 90) return first
  return `${first.slice(0, 87)}…`
}

function buildKeyPoints(title: string, description: string): string[] {
  const sentences = splitSentences(description)
  const points = sentences.slice(0, 3)
  if (points.length >= 2) return points.map((point) => point.replace(/。$/, ''))
  return [
    title,
    description.slice(0, 48).replace(/。$/, ''),
    '続報・影響は詳細パネルで確認できます',
  ]
}

function buildRelated(title: string, description: string): RelatedTopic[] {
  const base = description.slice(0, 120)
  return [
    {
      id: 'bg',
      label: '背景',
      detail: `このニュースの背景として、${base}${description.length > 120 ? '…' : ''} 関連する制度・市場・世論の動きが影響しています。`,
    },
    {
      id: 'impact',
      label: '影響',
      detail: `「${title}」は、関係者や生活者に今後影響しうるテーマです。短期の反応だけでなく、中長期の変化にも注目が集まっています。`,
    },
    {
      id: 'next',
      label: '今後の焦点',
      detail: `今後の焦点は、続報の内容と関係者の対応です。追加発表や数字の更新があれば、このフィードにも自動で反映されます。`,
    },
  ]
}

function resolveGenre(
  assigned: GenreId,
  title: string,
  description: string,
): GenreId {
  if (assigned === 'ai' || isSearchGenre(assigned)) return assigned
  if (AI_PATTERN.test(`${title} ${description}`)) {
    if (assigned === 'tech' || assigned === 'science' || assigned === 'business') {
      return 'ai'
    }
  }
  return assigned
}

function postersFor(genre: GenreId): string[] {
  if (genre in POSTERS) return POSTERS[genre as BuiltinGenreId]
  return DEFAULT_POSTERS
}

function toNewsItem(
  item: RssItem,
  genre: GenreId,
  sourceLabel: string,
): NewsItem {
  const seed = hashId(item.link || item.title)
  const description = item.description || item.title
  const summary = buildSummary(description)
  const resolvedGenre = resolveGenre(genre, item.title, description)

  return {
    id: `live-${seed.toString(16)}`,
    genre: resolvedGenre,
    title: item.title,
    summary,
    detail: `${description}\n\nAIが見出しと本文から要点を整理しました。より深い角度は関連ボタンから確認できます。`,
    keyPoints: buildKeyPoints(item.title, description),
    related: buildRelated(item.title, description),
    source: resolveSourceLabel(sourceLabel, item),
    publishedAt: toIso(item.pubDate),
    url: item.link || undefined,
    videoUrl: pick(VIDEOS, seed),
    posterUrl: pick(postersFor(resolvedGenre), seed),
    likes: 200 + (seed % 8000),
    comments: 20 + (seed % 500),
  }
}

async function fetchFeed(source: FeedSource): Promise<NewsItem[]> {
  const response = await fetch(source.url, {
    headers: {
      Accept:
        'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      'User-Agent': 'BRIEF-NewsBot/1.0 (+https://shortnews-theta.vercel.app)',
    },
  })
  if (!response.ok) {
    throw new Error(`RSS ${source.label} failed: ${response.status}`)
  }
  const xml = await response.text()
  const items = parseFeed(xml)
  const limit = source.limit ?? 10

  let filtered = items

  // AI枠の汎用フィードはAI関連のみ残す
  if (source.genre === 'ai' && !source.url.includes('aiplus')) {
    filtered = filtered.filter((item) =>
      AI_PATTERN.test(`${item.title} ${item.description}`),
    )
  }

  if (source.query) {
    filtered = filtered.filter((item) => matchesQuery(item, source.query!))
  }

  return filtered
    .slice(0, limit)
    .map((item) => toNewsItem(item, source.genre, source.label))
}

function matchesQuery(item: RssItem, query: string): boolean {
  const haystack = `${item.title}\n${item.description}`
  const normalized = query.trim()
  if (!normalized) return true
  if (haystack.includes(normalized)) return true

  const tokens = normalized
    .split(/[\s　・/｜|]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)

  if (tokens.length <= 1) return false
  return tokens.every((token) => haystack.includes(token))
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>()
  const result: NewsItem[] = []
  for (const item of items) {
    const key = item.title.replace(/\s+/g, '')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

function balanceByGenre(
  items: NewsItem[],
  perGenre = 14,
  total = 120,
): NewsItem[] {
  const groups = new Map<GenreId, NewsItem[]>()
  for (const item of items) {
    const list = groups.get(item.genre) ?? []
    list.push(item)
    groups.set(item.genre, list)
  }

  const genreCount = Math.max(groups.size, 1)
  const dynamicPerGenre =
    genreCount <= 2 ? Math.max(perGenre, 48) : perGenre
  const dynamicTotal =
    genreCount <= 2 ? Math.max(total, 80) : total

  const picked: NewsItem[] = []
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    picked.push(...list.slice(0, dynamicPerGenre))
  }

  return picked
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, dynamicTotal)
}

function feedsForGenre(id: GenreId): FeedSource[] {
  if (isSearchGenre(id)) {
    const query = labelFromGenreId(id)
    const encoded = encodeURIComponent(query)
    return [
      {
        genre: id,
        url: `https://news.google.com/rss/search?q=${encoded}&hl=ja&gl=JP&ceid=JP:ja`,
        label: `Google ニュース · ${query}`,
        limit: 8,
      },
      {
        genre: id,
        url: `https://www.bing.com/news/search?q=${encoded}&format=RSS&mkt=ja-JP`,
        label: `Bing ニュース · ${query}`,
        limit: 8,
      },
      ...SEARCH_SITES.map((site) => ({
        genre: id,
        url: `https://www.bing.com/news/search?q=${encodeURIComponent(`${query} site:${site.host}`)}&format=RSS&mkt=ja-JP`,
        label: site.label,
        limit: 6,
      })),
      ...SEARCH_MEDIA.map((feed) => ({
        ...feed,
        genre: id,
        query,
        limit: Math.min(feed.limit ?? 12, 6),
      })),
    ]
  }
  return FEEDS.filter((feed) => feed.genre === id)
}

async function mapSettled<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length)
  let index = 0

  async function run() {
    while (index < items.length) {
      const current = index
      index += 1
      try {
        results[current] = {
          status: 'fulfilled',
          value: await worker(items[current]),
        }
      } catch (reason) {
        results[current] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  )
  return results
}

export async function fetchLatestNews(
  genreIds?: GenreId[],
): Promise<NewsItem[]> {
  if (genreIds && genreIds.length === 0) return []

  const feeds =
    genreIds && genreIds.length > 0
      ? genreIds.flatMap((id) => feedsForGenre(id))
      : FEEDS

  if (feeds.length === 0) return []

  const settled = await mapSettled(feeds, 8, (feed) => fetchFeed(feed))
  const collected: NewsItem[] = []
  const failures: string[] = []

  for (let i = 0; i < settled.length; i += 1) {
    const result = settled[i]
    if (result.status === 'fulfilled') {
      collected.push(...result.value)
    } else {
      failures.push(`${feeds[i].label}(${feeds[i].genre})`)
      console.warn('[news]', feeds[i].label, result.reason)
    }
  }

  if (failures.length) {
    console.warn('[news] failed feeds:', failures.join(', '))
  }

  const filtered =
    genreIds && genreIds.length > 0
      ? collected.filter((item) => genreIds.includes(item.genre))
      : collected

  return balanceByGenre(dedupe(filtered))
}

export function parseGenreQuery(value: string | null): GenreId[] | undefined {
  if (value === null) return undefined
  if (value.trim() === '') return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}
