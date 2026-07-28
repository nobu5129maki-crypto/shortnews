import type { BuiltinGenreId, GenreId } from './types.js'
import { isSearchGenre, labelFromGenreId } from './types.js'

type GenreRule = {
  /** このジャンルらしい語（1つ以上必要） */
  include: RegExp
  /** 明らかに他ジャンルで、include が弱いときに除外 */
  exclude?: RegExp
}

const RULES: Record<BuiltinGenreId, GenreRule> = {
  politics: {
    include:
      /政治|国会|内閣|首相|総理|議員|選挙|与党|野党|法案|政策|官邸|政権|議会|外相|防衛|憲法|政党|市長|知事|大統領|ホワイトハウス|連邦|議会|外交|制裁|条約|閣僚|国会答弁|election|president|parliament|congress|senate|minister|diplomat|sanctions|legislation|government|首相/i,
    exclude:
      /野球|サッカー|大相撲|映画公開|ドラマ|アイドル|レシピ|グルメ|ファッション(?!政治)/i,
  },
  business: {
    include:
      /経済|景気|株|株式|日経|為替|円安|円高|金利|企業|決算|業績|売上|投資|市場|銀行|金融|GDP|インフレ|雇用|経営|商社|証券|上場|株主|ビジネス|economy|market|stock|shares|earnings|revenue|inflation|bank|invest|company|corporate|trade|business|CEO|売上高/i,
    exclude: /野球|サッカー|映画|ドラマ|アイドル|レシピ/i,
  },
  tech: {
    include:
      /テック|IT|アプリ|スマホ|スマートフォン|ガジェット|半導体|チップ|ソフトウェア|ハードウェア|クラウド|サイバー|プログラミング|開発者|スタートアップ|iPhone|Android|Google|Apple|Microsoft|メタバース|XR|VR|AR|tech|software|hardware|semiconductor|chip|startup|app\b|smartphone|cyber|cloud computing|developer/i,
    exclude: /国会答弁|選挙公報|野球|サッカー|大相撲/i,
  },
  ai: {
    include:
      /AI|ＡＩ|人工知能|生成AI|ChatGPT|GPT|Gemini|Claude|機械学習|ディープラーニング|LLM|大規模言語|オンデバイスAI|生成系|ニューラルネットワーク|OpenAI|Anthropic|machine learning|deep learning|artificial intelligence/i,
  },
  sports: {
    include:
      /スポーツ|試合|選手|優勝|決勝|リーグ|野球|サッカー|テニス|ゴルフ|バスケ|ラグビー|陸上|オリンピック|五輪|ワールドカップ|大相撲|ボクシング|格闘技|F1|NBA|MLB|サッカー|goal|match|tournament|championship|athlete|オリンピック/i,
    exclude: /国会|内閣|為替介入|日銀会合|決算発表(?!.*球)/i,
  },
  entertainment: {
    include:
      /エンタメ|映画|ドラマ|音楽|俳優|女優|歌手|アイドル|芸能|アニメ|漫画|マンガ|放送|配信|Netflix|ライブ|コンサート|映画祭|アカデミー|グラミー|entertainment|movie|film|drama|music|celebrity|actor|actress|anime|concert/i,
    exclude: /日銀|為替|補正予算|野球(?!映画)|サッカー(?!映画)/i,
  },
  world: {
    include:
      /国際|海外|外交|米|アメリカ|中国|欧州|EU|国連|紛争|戦争|停戦|侵攻|難民|サミット|NATO|中東|ウクライナ|ロシア|台湾|朝鮮|韓国|イギリス|フランス|ドイツ|国際社会|foreign|international|war|conflict|diplomat|ukraine|russia|china|middle east|nato|summit|embassy/i,
    exclude:
      /競馬|競輪|国内芸能|乃木坂|ジャニーズ|日経平均だけ|東京地方裁判/i,
  },
  science: {
    include:
      /科学|研究|宇宙|天文|惑星|物理|化学|生物|医学|ゲノム|気候|温暖化|発見|実験|論文|ノーベル|NASA|ESA|量子|サイエンス|science|research|space|astronomy|physics|biology|climate|genome|nobel|laboratory|scientist/i,
    exclude: /芸能|アイドル|競馬|サッカー試合/i,
  },
  life: {
    include:
      /暮らし|生活|健康|医療|育児|教育|住まい|料理|グルメ|旅行|観光|天気|防災|年金|介護|レシピ|インテリア|ライフスタイル|life|health|lifestyle|parenting|recipe|travel|housing|wellness/i,
    exclude: /衆院選|日経平均|ワールドカップ決勝|大統領選挙/i,
  },
}

/** フィード自体が専門的でキーワードが薄くても許す */
const SPECIALIST_FEED =
  /aiplus|soccer-king|baseballking|nature\.com|science\.org|politico\.com|itmedia\.co\.jp\/rss\/2\.0\/aiplus|bloomberg\.com\/markets/i

function scoreMatches(re: RegExp, text: string): number {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
  const global = new RegExp(re.source, flags)
  return (text.match(global) ?? []).length
}

export function isRelevantToGenre(
  genre: GenreId,
  title: string,
  description: string,
  feedUrl = '',
): boolean {
  const text = `${title}\n${description}`

  if (isSearchGenre(genre)) {
    const query = labelFromGenreId(genre).trim()
    if (!query) return true
    if (title.includes(query) || description.includes(query)) return true
    const tokens = query
      .split(/[\s　・/｜|]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
    if (tokens.length === 0) return false
    // タイトルに主要語が1つ以上、または本文に全トークン
    if (tokens.some((token) => title.includes(token))) return true
    return tokens.every((token) => text.includes(token))
  }

  const rule = RULES[genre as BuiltinGenreId]
  if (!rule) return true

  const includeHits = scoreMatches(rule.include, text)
  const excludeHits = rule.exclude ? scoreMatches(rule.exclude, text) : 0

  if (SPECIALIST_FEED.test(feedUrl)) {
    // 専門フィードは除外語が明らかに勝つときだけ落とす
    if (excludeHits >= 2 && includeHits === 0) return false
    return true
  }

  if (includeHits === 0) return false
  if (excludeHits > includeHits) return false
  return true
}
