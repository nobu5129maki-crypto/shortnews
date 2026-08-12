/** Google / Bing などの定型説明文 */
const BOILERPLATE_PATTERNS: RegExp[] = [
  /Google\s*ニュースによって世界中の情報源から集められた[、,.]?包括的な最新ニュース報道[。.]?/gi,
  /Comprehensive\s+up-to-?date\s+news\s+coverage[^.。]*Google\s+News[^.。]*[。. ]?/gi,
  /Full\s+coverage\s+and\s+analysis\s+from\s+Google\s+News[^.。]*[。. ]?/gi,
  /ニュースをGoogleで検索[。. ]?/gi,
  /検索結果[。. ]?/gi,
  /全文はスライド内で確認できます[。. ]?/gi,
]

const BOILERPLATE_ONLY =
  /^(Google\s*ニュース|Google\s+News|Bing\s*ニュース|検索結果|Yahoo!ニュース|PR TIMES)\s*[。. ]*$/i

/** AI向け英語RSSでよく出る名前付き実体 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  sbquo: '‚',
  bdquo: '„',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  times: '×',
  divide: '÷',
  minus: '−',
  pound: '£',
  euro: '€',
  yen: '¥',
  cent: '¢',
}

function codePointToChar(code: number): string {
  if (!Number.isFinite(code) || code <= 0) return ''
  if (code === 0x09 || code === 0x0a || code === 0x0d) {
    return String.fromCodePoint(code)
  }
  // 制御文字は落とす（表示上の文字化け・ゴミを防ぐ）
  if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return ''
  if (code > 0x10ffff) return ''
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

/**
 * HTML / XML の文字実体参照を通常文字へ。
 * AIジャンルの英語フィード（TechCrunch / Verge 等）で &#8217; などが
 * 未デコードのまま残り、翻訳失敗時に「文字化け」に見える問題を防ぐ。
 */
export function decodeHtmlEntities(value: string): string {
  if (!value || !value.includes('&')) return value

  let text = value
  // &amp; 経由の二重エンコードにも数回耐える
  for (let pass = 0; pass < 3; pass += 1) {
    const before = text
    text = text
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
        codePointToChar(Number.parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec: string) =>
        codePointToChar(Number.parseInt(dec, 10)),
      )
      .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name: string) => {
        const mapped = NAMED_ENTITIES[name.toLowerCase()]
        return mapped !== undefined ? mapped : match
      })
    if (text === before) break
  }
  return text
}

/** UTF-8 を Latin-1 として読んだ典型的な文字化けを、明らかに壊れているときだけ戻す */
export function repairUtf8Mojibake(value: string): string {
  if (!value) return value
  // すでに BMP 外・全角などを含む正当な Unicode はそのまま
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 0xff) return value
  }

  let highLatin = 0
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) >= 0x80) highLatin += 1
  }
  if (highLatin < 3) return value

  try {
    const bytes = Uint8Array.from(Array.from(value, (ch) => ch.charCodeAt(0)))
    const fixed = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (!fixed || fixed.includes('\ufffd')) return value

    const jpBefore = value.match(/[\u3040-\u30ff\u3400-\u9fff]/g)?.length ?? 0
    const jpAfter = fixed.match(/[\u3040-\u30ff\u3400-\u9fff]/g)?.length ?? 0
    let highAfter = 0
    for (let i = 0; i < fixed.length; i += 1) {
      const code = fixed.charCodeAt(i)
      if (code >= 0x80 && code <= 0xff) highAfter += 1
    }
    // 日本語が増える、または high-latin ノイズがほぼ消えるとき採用
    if (jpAfter > jpBefore || (highAfter === 0 && jpAfter >= 2)) {
      return fixed
    }
  } catch {
    /* keep original */
  }
  return value
}

/** 誤デコードで � が大量に入ったテキスト（Edge で Shift_JIS を UTF-8 読みした典型） */
export function isGarbledText(value: string): boolean {
  if (!value) return false
  const fffd = value.split('\ufffd').length - 1
  if (fffd >= 8) return true
  if (value.length >= 40 && fffd / value.length >= 0.03) return true
  return false
}

/** RSS / HTML から本文テキストを整形し、定型文を除去 */
export function cleanDetailText(value: string): string {
  let text = value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  text = decodeHtmlEntities(text)
  text = repairUtf8Mojibake(text)
  text = text.replace(/\r\n?/g, '\n')

  for (const pattern of BOILERPLATE_PATTERNS) {
    text = text.replace(pattern, ' ')
  }

  const cleaned = text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  // 文字化け本文は空扱いにし、呼び出し側が RSS 本文へフォールバックできるようにする
  if (isGarbledText(cleaned)) return ''
  return cleaned
}

/** 定型文のみ／実質本文なし */
export function isBoilerplateDetail(value: string): boolean {
  const cleaned = cleanDetailText(value)
  if (!cleaned) return true
  if (BOILERPLATE_ONLY.test(cleaned)) return true
  if (cleaned.length < 24) return true
  // 定型文を除いたあとも「Google ニュースによって」が残る場合
  if (/Google\s*ニュースによって|世界中の情報源から集められた/i.test(cleaned)) {
    return true
  }
  return false
}

/** タイトルと同内容だけの薄い本文か */
export function isThinDetail(detail: string, title: string): boolean {
  const cleaned = cleanDetailText(detail)
  if (isBoilerplateDetail(cleaned)) return true
  const normalizedDetail = cleaned.replace(/\s+/g, '')
  const normalizedTitle = title.replace(/\s+/g, '')
  if (!normalizedDetail) return true
  if (normalizedDetail === normalizedTitle) return true
  // タイトル + 媒体名だけのケース
  if (
    normalizedDetail.startsWith(normalizedTitle) &&
    normalizedDetail.length <= normalizedTitle.length + 18
  ) {
    return true
  }
  return false
}

/** 文の途中で切れている（メタdescriptionの途中切れなど） */
export function looksTruncated(value: string): boolean {
  const cleaned = cleanDetailText(value)
  if (!cleaned) return true
  if (cleaned.length < 80) return true
  if (/[。．.！？!?…]$/.test(cleaned)) return false
  // 末尾が助詞・未完成っぽいとき
  if (/[のがをにではともっプラッてし、,]$/.test(cleaned)) return true
  if (cleaned.length < 420 && !/[。．.！？!?]/.test(cleaned.slice(-40))) {
    return true
  }
  // 英単語の途中で終わっている
  if (/[A-Za-z]{3,}$/.test(cleaned)) return true
  return false
}

/** 途中切れ本文を、最後の文末で揃える（取れないときの見た目改善） */
export function softTrimTruncation(value: string): string {
  const cleaned = cleanDetailText(value)
  if (!cleaned || !looksTruncated(cleaned)) return cleaned
  const parts = cleaned.split(/(?<=[。．.！？!?])\s*/)
  if (parts.length >= 2) {
    const complete = parts.slice(0, -1).join('').trim()
    if (complete.length >= 60) return complete
  }
  return cleaned
}
