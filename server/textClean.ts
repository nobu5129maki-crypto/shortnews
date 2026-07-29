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

/** RSS / HTML から本文テキストを整形し、定型文を除去 */
export function cleanDetailText(value: string): string {
  let text = value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\r\n?/g, '\n')

  for (const pattern of BOILERPLATE_PATTERNS) {
    text = text.replace(pattern, ' ')
  }

  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
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
