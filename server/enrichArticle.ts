import { cleanDetailText } from './textClean.js'

const FETCH_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (compatible; MYLINE-NewsBot/1.0; +https://shortnews-theta.vercel.app)',
}

function metaContent(html: string, property: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`,
    'i',
  )
  const match = html.match(re)
  return match?.[1] || match?.[2] || ''
}

function extractFromHtml(html: string): string {
  const article =
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(
      /<div[^>]+(?:class|id)=["'][^"']*(?:article-body|story-body|entry-content|post-content|article__body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    )?.[1] ||
    ''

  const source = article || html
  const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => cleanDetailText(match[1]))
    .filter((text) => text.length > 40)
    .slice(0, 24)

  if (paragraphs.length >= 2) {
    return paragraphs.join('\n\n')
  }

  return (
    cleanDetailText(metaContent(html, 'og:description')) ||
    cleanDetailText(metaContent(html, 'description')) ||
    paragraphs[0] ||
    ''
  )
}

/** RSS本文が短いとき、元記事ページから本文を補完（失敗時は元テキスト） */
export async function enrichArticleBody(
  url: string | undefined,
  current: string,
): Promise<string> {
  if (!url) return current
  if (current.length >= 500) return current

  try {
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(4500),
    })
    if (!response.ok) return current
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('html') && !contentType.includes('xml')) {
      return current
    }
    const html = await response.text()
    const extracted = extractFromHtml(html)
    if (extracted.length > current.length + 40) {
      return extracted.slice(0, 6000)
    }
  } catch (error) {
    console.warn('[enrich]', url, error)
  }
  return current
}
