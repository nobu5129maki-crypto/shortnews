import type {
  ContentGenreId,
  NewsApiResponse,
  NewsItem,
  RelatedTopic,
} from '../src/types.ts'

export type { NewsApiResponse }

type FeedSource = {
  genre: ContentGenreId
  url: string
}

const FEEDS: FeedSource[] = [
  { genre: 'politics', url: 'https://www.nhk.or.jp/rss/news/cat4.xml' },
  { genre: 'business', url: 'https://www.nhk.or.jp/rss/news/cat5.xml' },
  { genre: 'science', url: 'https://www.nhk.or.jp/rss/news/cat3.xml' },
  { genre: 'world', url: 'https://www.nhk.or.jp/rss/news/cat6.xml' },
  { genre: 'sports', url: 'https://www.nhk.or.jp/rss/news/cat7.xml' },
  { genre: 'entertainment', url: 'https://www.nhk.or.jp/rss/news/cat2.xml' },
  { genre: 'life', url: 'https://www.nhk.or.jp/rss/news/cat1.xml' },
  { genre: 'tech', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' },
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

const POSTERS: Record<ContentGenreId, string[]> = {
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

const AI_PATTERN =
  /AI|ＡＩ|人工知能|生成AI|ChatGPT|GPT|機械学習|LLM|オンデバイス|大規模言語|ディープラーニング|チャットボ[ッッ]ト/i

type RssItem = {
  title: string
  link: string
  description: string
  pubDate: string
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

function parseRss(xml: string): RssItem[] {
  const chunks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  return chunks
    .map((chunk) => {
      const block = chunk[1]
      return {
        title: tagValue(block, 'title'),
        link: tagValue(block, 'link') || tagValue(block, 'guid'),
        description: tagValue(block, 'description'),
        pubDate: tagValue(block, 'pubDate'),
      }
    })
    .filter((item) => item.title && item.description)
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

function toNewsItem(
  item: RssItem,
  genre: ContentGenreId,
  sourceLabel: string,
): NewsItem {
  const seed = hashId(item.link || item.title)
  const description = item.description || item.title
  const summary = buildSummary(description)
  const resolvedGenre: ContentGenreId =
    genre === 'tech' && AI_PATTERN.test(`${item.title} ${description}`)
      ? 'ai'
      : genre === 'science' && AI_PATTERN.test(`${item.title} ${description}`)
        ? 'ai'
        : genre === 'business' && AI_PATTERN.test(`${item.title} ${description}`)
          ? 'ai'
          : genre

  const iso = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()

  return {
    id: `live-${seed.toString(16)}`,
    genre: resolvedGenre,
    title: item.title,
    summary,
    detail: `${description}\n\nAIが見出しと本文から要点を整理しました。より深い角度は関連ボタンから確認できます。`,
    keyPoints: buildKeyPoints(item.title, description),
    related: buildRelated(item.title, description),
    source: sourceLabel,
    publishedAt: iso,
    url: item.link || undefined,
    videoUrl: pick(VIDEOS, seed),
    posterUrl: pick(POSTERS[resolvedGenre], seed),
    likes: 200 + (seed % 8000),
    comments: 20 + (seed % 500),
  }
}

async function fetchFeed(source: FeedSource): Promise<NewsItem[]> {
  const response = await fetch(source.url, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
      'User-Agent': 'BRIEF-NewsBot/1.0',
    },
  })
  if (!response.ok) {
    throw new Error(`RSS ${source.genre} failed: ${response.status}`)
  }
  const xml = await response.text()
  const items = parseRss(xml)
  const label = source.url.includes('itmedia') ? 'ITmedia NEWS' : 'NHK NEWS WEB'
  return items.slice(0, 12).map((item) => toNewsItem(item, source.genre, label))
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

export async function fetchLatestNews(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed)))
  const collected: NewsItem[] = []

  for (const result of settled) {
    if (result.status === 'fulfilled') collected.push(...result.value)
  }

  // AI枠: 他ジャンルからAI関連を抽出して優先付与
  const aiExtra = collected
    .filter((item) => AI_PATTERN.test(`${item.title} ${item.summary}`))
    .map((item) => ({ ...item, genre: 'ai' as const, id: `${item.id}-ai` }))

  const merged = dedupe([...aiExtra, ...collected]).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  return merged.slice(0, 80)
}
