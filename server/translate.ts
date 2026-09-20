import type { Deadline } from './deadline.js'
import { cleanDetailText } from './textClean.js'

const JP_CHAR = /[\u3040-\u30ff\u3400-\u9fff]/g

export function hasJapanese(text: string): boolean {
  const jp = text.match(JP_CHAR)?.length ?? 0
  if (jp >= 8) return true
  const letters = text.replace(/\s+/g, '')
  if (letters.length === 0) return true
  return jp / letters.length >= 0.12
}

function chunkText(text: string, size: number): string[] {
  if (text.length <= size) return [text]
  const chunks: string[] = []
  let rest = text
  while (rest.length > 0) {
    if (rest.length <= size) {
      chunks.push(rest)
      break
    }
    let cut = rest.lastIndexOf('\n', size)
    if (cut < size * 0.4) cut = rest.lastIndexOf(' ', size)
    if (cut < size * 0.4) cut = size
    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut).trimStart()
  }
  return chunks
}

async function translateChunk(text: string, deadline?: Deadline): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(text)}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MYLINE-NewsBot/1.0 (+https://shortnews-theta.vercel.app)',
    },
    // 翻訳 API が詰まっても全体の締め切りを超えないようにする
    signal: AbortSignal.timeout(deadline ? deadline.timeout(5000) : 5000),
  })
  if (!response.ok) {
    throw new Error(`translate failed: ${response.status}`)
  }
  const data = (await response.json()) as unknown
  if (!Array.isArray(data) || !Array.isArray(data[0])) return text
  return data[0]
    .map((row) => (Array.isArray(row) ? String(row[0] ?? '') : ''))
    .join('')
}

/**
 * 英語など非日本語テキストを日本語へ翻訳。既に日本語ならそのまま返す。
 * deadline の残りが少ないときは翻訳せず原文を返す（呼び出し側で未翻訳を判定して扱う）。
 */
export async function translateToJapanese(
  text: string,
  deadline?: Deadline,
): Promise<string> {
  // 翻訳前に実体参照を潰す（失敗時に &#8217; 等が画面に残るのを防ぐ）
  const trimmed = cleanDetailText(text).trim()
  if (!trimmed || hasJapanese(trimmed)) return trimmed || text
  if (deadline?.expired(800)) return trimmed

  try {
    // 長文は先頭 2 チャンク（約 2800 字）までにして時間を抑える
    const chunks = chunkText(trimmed, 1400).slice(0, 2)
    const translated: string[] = []
    for (const chunk of chunks) {
      if (deadline?.expired(800)) break
      translated.push(await translateChunk(chunk, deadline))
    }
    if (translated.length === 0) return trimmed
    const result = cleanDetailText(translated.join('\n')).trim()
    return result || trimmed
  } catch (error) {
    console.warn('[translate]', error)
    return trimmed
  }
}
