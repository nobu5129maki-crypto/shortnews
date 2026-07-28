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

async function translateChunk(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(text)}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MYLINE-NewsBot/1.0 (+https://shortnews-theta.vercel.app)',
    },
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

/** 英語など非日本語テキストを日本語へ翻訳。既に日本語ならそのまま返す */
export async function translateToJapanese(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed || hasJapanese(trimmed)) return text

  try {
    const chunks = chunkText(trimmed, 1400)
    const translated: string[] = []
    for (const chunk of chunks) {
      translated.push(await translateChunk(chunk))
    }
    const result = translated.join('\n').trim()
    return result || text
  } catch (error) {
    console.warn('[translate]', error)
    return text
  }
}
