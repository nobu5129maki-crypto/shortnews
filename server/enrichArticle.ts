import {
  cleanDetailText,
  isBoilerplateDetail,
  isThinDetail,
  looksTruncated,
  softTrimTruncation,
} from './textClean.js'

const FETCH_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
}

const NOISE_LINE =
  /^(copyright|©|all rights reserved|無断転載|関連記事|おすすめ|PR:|広告|cookie|javascript|function\s*\(|\{"|window\.|document\.|var |const |let )/i

function metaContent(html: string, property: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`,
    'i',
  )
  const match = html.match(re)
  return match?.[1] || match?.[2] || ''
}

function usableText(value: string): string {
  const cleaned = cleanDetailText(value)
  if (!cleaned || isBoilerplateDetail(cleaned)) return ''
  return cleaned
}

function titleOverlapScore(text: string, title: string): number {
  if (!text || !title) return 0
  const latin = title.match(/[A-Za-z][A-Za-z0-9+._-]{2,}/g) ?? []
  const jp = title.match(/[一-龥ぁ-んァ-ン]{2,}/g) ?? []
  const tokens = [...new Set([...latin, ...jp])].slice(0, 12)
  if (tokens.length === 0) return 0
  let hits = 0
  for (const token of tokens) {
    if (text.includes(token)) hits += 1
  }
  return hits / tokens.length
}

function focusOnTitle(text: string, title: string): string {
  if (!text || !title) return text
  const anchors = (title.match(/[A-Za-z][A-Za-z0-9+._-]{3,}/g) ?? [])
    .filter((token, index, all) => all.indexOf(token) === index)
    .slice(0, 8)
  if (anchors.length === 0) return text

  let bestIdx = -1
  for (const anchor of anchors) {
    const idx = text.indexOf(anchor)
    if (idx < 0) continue
    if (bestIdx < 0 || idx < bestIdx) bestIdx = idx
  }
  if (bestIdx <= 80) return text

  const paragraphBreak = text.lastIndexOf('\n\n', bestIdx)
  const lineBreak = text.lastIndexOf('\n', bestIdx)
  const cut = Math.max(paragraphBreak, lineBreak)
  return text.slice(cut >= 0 ? cut + (paragraphBreak === cut ? 2 : 1) : bestIdx).trim()
}

function pickBestText(candidates: string[], title: string, base = ''): string {
  const ranked = [...candidates, base]
    .map((text) => usableText(text))
    .map((text) => focusOnTitle(text, title))
    .map((text) => usableText(text))
    .filter((text) => text.length >= 40)
    .map((text) => {
      const overlap = titleOverlapScore(text.slice(0, 900), title)
      return {
        text,
        overlap,
        score:
          overlap * 1200 +
          Math.min(text.length, 1800) / 12 -
          (looksTruncated(text) ? 100 : 0) -
          (overlap < 0.2 ? 500 : 0),
      }
    })
    .sort((a, b) => b.score - a.score)

  if (ranked.length === 0) return usableText(base)
  const best = ranked.find((row) => row.overlap >= 0.2) || ranked[0]
  return best.text
}

function stripNoise(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !NOISE_LINE.test(line))
    .filter((line) => !/[{};=]{2,}/.test(line))
    .filter((line) => !/^\*\*[A-Z\s]+\*\*$/.test(line))
    .join('\n\n')
}

function extractJsonLdArticle(html: string): string {
  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ]
  const chunks: string[] = []
  for (const match of scripts) {
    try {
      const data = JSON.parse(match[1]) as unknown
      const nodes = Array.isArray(data) ? data : [data]
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue
        const record = node as Record<string, unknown>
        const type = String(record['@type'] ?? '')
        if (!/Article|NewsArticle|BlogPosting/i.test(type)) continue
        const body = record.articleBody || record.description
        if (typeof body === 'string') {
          const usable = usableText(body)
          if (usable) chunks.push(usable)
        }
      }
    } catch {
      /* ignore invalid json-ld */
    }
  }
  return chunks.sort((a, b) => b.length - a.length)[0] || ''
}

function extractFromHtml(html: string): string {
  const jsonLd = extractJsonLdArticle(html)
  if (jsonLd.length >= 280 && !looksTruncated(jsonLd)) {
    return stripNoise(jsonLd).slice(0, 6000)
  }

  const article =
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(
      /<div[^>]+(?:class|id)=["'][^"']*(?:article-body|story-body|entry-content|post-content|article__body|news-body|article_body|article-content|detail__body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    )?.[1] ||
    ''

  const source = article || html
  const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => usableText(match[1]))
    .filter((text) => text.length > 40)
    .filter((text) => !NOISE_LINE.test(text))
    .slice(0, 30)

  if (paragraphs.length >= 2) {
    return stripNoise(paragraphs.join('\n\n')).slice(0, 6000)
  }

  const meta =
    usableText(metaContent(html, 'og:description')) ||
    usableText(metaContent(html, 'description')) ||
    paragraphs[0] ||
    jsonLd ||
    ''

  return stripNoise(meta).slice(0, 6000)
}

function isGoogleNewsUrl(url: string): boolean {
  return /news\.google\.com\/(rss\/)?articles\//i.test(url)
}

function unwrapNestedUrl(link: string): string {
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

/** Bing の同名・近い記事から実記事 URL / 説明文を拾う */
async function resolveViaBing(
  title: string,
): Promise<{ url?: string; description?: string } | undefined> {
  const cleanedTitle = title
    .replace(/\s*[-|｜].*$/, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/【.*?】/g, '')
    .trim()
  if (cleanedTitle.length < 8) return undefined

  const latinBits = cleanedTitle.match(/[A-Za-z][A-Za-z0-9+._-]{1,}/g) ?? []
  const queries = [
    cleanedTitle.slice(0, 72),
    latinBits.slice(0, 5).join(' '),
    latinBits.slice(0, 3).join(' '),
  ].filter((query, index, all) => query.length >= 6 && all.indexOf(query) === index)

  for (const query of queries) {
    try {
      const endpoint = `https://www.bing.com/news/search?q=${encodeURIComponent(
        query,
      )}&format=RSS&mkt=ja-JP`
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': FETCH_HEADERS['User-Agent'],
        },
        signal: AbortSignal.timeout(4500),
      })
      if (!response.ok) continue
      const xml = await response.text()
      const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
      for (const item of items) {
        const block = item[1]
        const itemTitle = cleanDetailText(
          block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '',
        )
        const rawLink = (
          block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || ''
        )
          .replace(/&amp;/g, '&')
          .trim()
        const rawDesc = cleanDetailText(
          block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || '',
        )
        const link = unwrapNestedUrl(rawLink)
        const usableLink =
          /^https?:\/\//i.test(link) &&
          !/bing\.com|microsoft\.com|google\.com|msn\.com/i.test(link)
            ? link
            : undefined

        // タイトルが近いもの優先（先頭の固有名詞が共通など）
        const titleHit =
          latinBits.length > 0 &&
          latinBits.some((bit) => bit.length >= 3 && itemTitle.includes(bit))

        if (!titleHit && queries[0] === query) {
          // 全文クエリ時は先頭結果も採用候補にする
        } else if (!titleHit) {
          continue
        }

        const description =
          rawDesc && !isBoilerplateDetail(rawDesc) ? rawDesc : undefined
        if (usableLink || description) {
          return { url: usableLink, description }
        }
      }
    } catch (error) {
      console.warn('[resolveViaBing]', query, error)
    }
  }
  return undefined
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(5500),
  })
  if (!response.ok) return ''
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('html') && !contentType.includes('xml') && !contentType.includes('text')) {
    return ''
  }
  return response.text()
}

/** Jina Reader で本文を取得（実記事 URL 向け） */
async function fetchViaJina(url: string): Promise<string> {
  if (isGoogleNewsUrl(url)) return ''
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': FETCH_HEADERS['User-Agent'],
      },
      signal: AbortSignal.timeout(7000),
    })
    if (!response.ok) return ''
    const markdown = await response.text()
    const withoutMeta = markdown
      .replace(/^Title:.*$/m, '')
      .replace(/^URL Source:.*$/m, '')
      .replace(/^Published Time:.*$/m, '')
      .replace(/^Markdown Content:\s*/m, '')
      .replace(/^Warning:.*$/gm, '')
    const usable = usableText(withoutMeta)
    if (!usable || usable.length < 80) return ''
    return stripNoise(usable).slice(0, 6000)
  } catch (error) {
    console.warn('[jina]', url, error)
    return ''
  }
}

export type EnrichResult = {
  detail: string
  resolvedUrl?: string
}

/**
 * RSS本文が短い／途中切れのとき、元記事ページから本文を補完する。
 * Google News リンクは Bing 経由で実記事 URL に解決してから取得する。
 */
export async function enrichArticleBody(
  url: string | undefined,
  current: string,
  title = '',
): Promise<EnrichResult> {
  const base = usableText(current)
  const thin = title ? isThinDetail(base, title) : !base
  const truncated = looksTruncated(base)
  if (!url && !title) {
    return { detail: softTrimTruncation(base) }
  }
  if (base.length >= 900 && !truncated) {
    return { detail: base, resolvedUrl: url }
  }

  let target = url ? unwrapNestedUrl(url) : ''
  let resolvedUrl = target || undefined
  let candidate = base

  if ((!target || isGoogleNewsUrl(target) || thin || truncated) && title) {
    const viaBing = await resolveViaBing(title)
    if (viaBing?.url) {
      target = viaBing.url
      resolvedUrl = viaBing.url
    }
    if (viaBing?.description && viaBing.description.length > candidate.length) {
      candidate = viaBing.description
    }
  }

  if ((!target || isGoogleNewsUrl(target)) && candidate) {
    return { detail: softTrimTruncation(candidate), resolvedUrl }
  }

  if (!target || isGoogleNewsUrl(target)) {
    return { detail: softTrimTruncation(candidate), resolvedUrl }
  }

  try {
    const html = await fetchHtml(target)
    let extracted = html ? extractFromHtml(html) : ''

    if (!extracted || extracted.length < 160 || looksTruncated(extracted)) {
      const jina = await fetchViaJina(target)
      if (jina) {
        extracted = pickBestText([extracted, jina], title, extracted)
      }
    }

    // Jina がサイト全体の雑多な文を返すことがあるのでタイトル関連度で選定
    const best = pickBestText([candidate, extracted], title, base)
    if (best && best.length > 40) {
      return {
        detail: softTrimTruncation(best.slice(0, 4500)),
        resolvedUrl,
      }
    }
  } catch (error) {
    console.warn('[enrich]', target, error)
  }

  return {
    detail: softTrimTruncation(
      pickBestText([candidate], title, base).slice(0, 4500),
    ),
    resolvedUrl,
  }
}
