import type {
  BuiltinGenreId,
  GenreId,
  NewsApiResponse,
  NewsItem,
} from './types.js'
import { isSearchGenre, labelFromGenreId } from './types.js'
import { enrichArticleBody } from './enrichArticle.js'
import { isRelevantToGenre, titleMatchesSearchQuery } from './genreRelevance.js'
import { cleanDetailText, isBoilerplateDetail, isThinDetail } from './textClean.js'
import { translateToJapanese } from './translate.js'

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
  // 国内
  { host: 'news.yahoo.co.jp', label: 'Yahoo!ニュース' },
  { host: 'www.asahi.com', label: '朝日新聞' },
  { host: 'mainichi.jp', label: '毎日新聞' },
  { host: 'www.nikkei.com', label: '日本経済新聞' },
  { host: 'www.nhk.or.jp', label: 'NHK' },
  { host: 'www.nikkansports.com', label: '日刊スポーツ' },
  { host: 'www.sponichi.co.jp', label: 'スポニチ' },
  { host: 'www.oricon.co.jp', label: 'ORICON NEWS' },
  { host: 'www.itmedia.co.jp', label: 'ITmedia' },
  { host: 'toyokeizai.net', label: '東洋経済オンライン' },
  { host: 'www.fnn.jp', label: 'FNNプライムオンライン' },
  { host: 'www.jiji.com', label: '時事通信' },
  // 海外（信頼度の高い国際メディア）
  { host: 'www.bbc.com', label: 'BBC' },
  { host: 'www.reuters.com', label: 'Reuters' },
  { host: 'apnews.com', label: 'AP News' },
  { host: 'www.theguardian.com', label: 'The Guardian' },
  { host: 'www.nytimes.com', label: 'The New York Times' },
  { host: 'www.washingtonpost.com', label: 'The Washington Post' },
  { host: 'www.npr.org', label: 'NPR' },
  { host: 'www.aljazeera.com', label: 'Al Jazeera' },
  { host: 'www.dw.com', label: 'Deutsche Welle' },
  { host: 'www.bloomberg.com', label: 'Bloomberg' },
  { host: 'www.ft.com', label: 'Financial Times' },
  { host: 'www.economist.com', label: 'The Economist' },
  { host: 'edition.cnn.com', label: 'CNN' },
  { host: 'www.abc.net.au', label: 'ABC News Australia' },
  { host: 'www.nature.com', label: 'Nature' },
  { host: 'www.espn.com', label: 'ESPN' },
  { host: 'www.theverge.com', label: 'The Verge' },
  { host: 'www.wired.com', label: 'WIRED' },
  { host: 'variety.com', label: 'Variety' },
  { host: 'techcrunch.com', label: 'TechCrunch' },
]

/** 組み込みジャンル向け: 日英の横断検索クエリ（多角的収集＋海外→日本語訳） */
const GENRE_SEARCH_QUERIES: Record<
  BuiltinGenreId,
  { ja: string; en: string }
> = {
  politics: { ja: '政治 国会 政策', en: 'politics government election' },
  business: { ja: '経済 市場 企業', en: 'business markets economy' },
  tech: { ja: 'テック IT ガジェット', en: 'technology gadgets software' },
  ai: {
    ja: 'AI 人工知能 生成AI',
    en: 'artificial intelligence generative AI ChatGPT',
  },
  sports: { ja: 'スポーツ 試合 選手', en: 'sports match championship' },
  entertainment: {
    ja: 'エンタメ 映画 音楽',
    en: 'entertainment movie music celebrity',
  },
  world: { ja: '国際 外交 海外', en: 'world news international diplomacy' },
  science: { ja: '科学 宇宙 研究', en: 'science research space discovery' },
  life: { ja: '暮らし 健康 ライフ', en: 'lifestyle health wellness living' },
}

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
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    label: 'BBC News World',
    limit: 24,
  },
  {
    url: 'https://www.theguardian.com/world/rss',
    label: 'The Guardian',
    limit: 24,
  },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    label: 'The New York Times',
    limit: 24,
  },
  {
    url: 'https://feeds.npr.org/1004/rss.xml',
    label: 'NPR',
    limit: 20,
  },
  {
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    label: 'Al Jazeera',
    limit: 20,
  },
  {
    url: 'https://rss.dw.com/rdf/rss-en-all',
    label: 'Deutsche Welle',
    limit: 24,
  },
  {
    url: 'https://www.france24.com/en/rss',
    label: 'France 24',
    limit: 16,
  },
  {
    url: 'https://www.skysports.com/rss/12040',
    label: 'Sky Sports',
    limit: 16,
  },
  {
    url: 'https://www.space.com/feeds/all',
    label: 'Space.com',
    limit: 16,
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
    url: 'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
    label: 'Yahoo!ニュース エンタメ',
    limit: 20,
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
  {
    url: 'https://techcrunch.com/feed/',
    label: 'TechCrunch',
    limit: 16,
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    label: 'The Verge',
    limit: 16,
  },
]

/** ジャンル別の専門メディア + NHK（補完） + 海外ソース */
const FEEDS: FeedSource[] = [
  // 政治
  {
    genre: 'politics',
    url: 'https://www.nhk.or.jp/rss/news/cat4.xml',
    label: 'NHK NEWS WEB',
    limit: 10,
  },
  {
    genre: 'politics',
    url: 'https://news.yahoo.co.jp/rss/categories/domestic.xml',
    label: 'Yahoo!ニュース 国内',
    limit: 12,
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
  {
    genre: 'politics',
    url: 'https://rss.politico.com/politics-news.xml',
    label: 'Politico',
    limit: 10,
  },
  {
    genre: 'politics',
    url: 'https://feeds.npr.org/1001/rss.xml',
    label: 'NPR',
    limit: 10,
  },
  {
    genre: 'politics',
    url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',
    label: 'BBC Politics',
    limit: 10,
  },
  {
    genre: 'politics',
    url: 'https://www.theguardian.com/politics/rss',
    label: 'The Guardian Politics',
    limit: 8,
  },
  {
    genre: 'politics',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
    label: 'The New York Times',
    limit: 8,
  },

  // 経済
  {
    genre: 'business',
    url: 'https://www.nhk.or.jp/rss/news/cat5.xml',
    label: 'NHK NEWS WEB',
    limit: 10,
  },
  {
    genre: 'business',
    url: 'https://news.yahoo.co.jp/rss/categories/business.xml',
    label: 'Yahoo!ニュース 経済',
    limit: 12,
  },
  {
    genre: 'business',
    url: 'https://toyokeizai.net/list/feed/rss',
    label: '東洋経済オンライン',
    limit: 10,
  },
  {
    genre: 'business',
    url: 'https://assets.wor.jp/rss/rdf/nikkei/news.rdf',
    label: '日本経済新聞',
    limit: 10,
  },
  {
    genre: 'business',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    label: 'Bloomberg',
    limit: 10,
  },
  {
    genre: 'business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    label: 'BBC Business',
    limit: 10,
  },
  {
    genre: 'business',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    label: 'The New York Times',
    limit: 8,
  },
  {
    genre: 'business',
    url: 'https://www.theguardian.com/business/rss',
    label: 'The Guardian Business',
    limit: 8,
  },
  {
    genre: 'business',
    url: 'https://www.ft.com/rss/home',
    label: 'Financial Times',
    limit: 8,
  },
  {
    genre: 'business',
    url: 'https://www.economist.com/finance-and-economics/rss.xml',
    label: 'The Economist',
    limit: 8,
  },
  {
    genre: 'business',
    url: 'https://news.google.com/rss/search?q=site:reuters.com+business&hl=en&gl=US&ceid=US:en',
    label: 'Reuters Business',
    limit: 8,
  },

  // テック
  {
    genre: 'tech',
    url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
    label: 'ITmedia NEWS',
    limit: 12,
  },
  {
    genre: 'tech',
    url: 'https://news.yahoo.co.jp/rss/categories/it.xml',
    label: 'Yahoo!ニュース IT',
    limit: 12,
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
  {
    genre: 'tech',
    url: 'https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf',
    label: 'INTERNET Watch',
    limit: 8,
  },
  {
    genre: 'tech',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    label: 'BBC Technology',
    limit: 10,
  },
  {
    genre: 'tech',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    label: 'The New York Times',
    limit: 8,
  },
  {
    genre: 'tech',
    url: 'https://www.theverge.com/rss/index.xml',
    label: 'The Verge',
    limit: 10,
  },
  {
    genre: 'tech',
    url: 'https://techcrunch.com/feed/',
    label: 'TechCrunch',
    limit: 10,
  },
  {
    genre: 'tech',
    url: 'https://www.wired.com/feed/rss',
    label: 'WIRED',
    limit: 8,
  },
  {
    genre: 'tech',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    label: 'Ars Technica',
    limit: 8,
  },

  // AI
  {
    genre: 'ai',
    url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    label: 'ITmedia AI+',
    limit: 14,
  },
  {
    genre: 'ai',
    url: 'https://news.yahoo.co.jp/rss/categories/it.xml',
    label: 'Yahoo!ニュース IT',
    limit: 14,
  },
  {
    genre: 'ai',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    label: 'TechCrunch AI',
    limit: 12,
  },
  {
    genre: 'ai',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    label: 'The Verge AI',
    limit: 10,
  },
  {
    genre: 'ai',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    label: 'WIRED AI',
    limit: 10,
  },
  {
    genre: 'ai',
    url: 'https://www.technologyreview.com/feed/',
    label: 'MIT Technology Review',
    limit: 10,
  },
  {
    genre: 'ai',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    label: 'BBC Technology',
    limit: 10,
  },
  {
    genre: 'ai',
    url: 'https://venturebeat.com/category/ai/feed/',
    label: 'VentureBeat AI',
    limit: 10,
  },

  // スポーツ
  {
    genre: 'sports',
    url: 'https://www.nhk.or.jp/rss/news/cat7.xml',
    label: 'NHK NEWS WEB',
    limit: 10,
  },
  {
    genre: 'sports',
    url: 'https://news.yahoo.co.jp/rss/categories/sports.xml',
    label: 'Yahoo!ニュース スポーツ',
    limit: 12,
  },
  {
    genre: 'sports',
    url: 'https://www.soccer-king.jp/feed',
    label: 'サッカーキング',
    limit: 10,
  },
  {
    genre: 'sports',
    url: 'https://baseballking.jp/feed',
    label: 'ベースボールキング',
    limit: 10,
  },
  {
    genre: 'sports',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    label: 'BBC Sport',
    limit: 12,
  },
  {
    genre: 'sports',
    url: 'https://www.espn.com/espn/rss/news',
    label: 'ESPN',
    limit: 12,
  },
  {
    genre: 'sports',
    url: 'https://www.theguardian.com/sport/rss',
    label: 'The Guardian Sport',
    limit: 10,
  },
  {
    genre: 'sports',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
    label: 'The New York Times',
    limit: 8,
  },
  {
    genre: 'sports',
    url: 'https://news.yahoo.co.jp/rss/media/nksports/all.xml',
    label: '日刊スポーツ',
    limit: 10,
  },
  {
    genre: 'sports',
    url: 'https://www.skysports.com/rss/12040',
    label: 'Sky Sports',
    limit: 10,
  },

  // エンタメ
  {
    genre: 'entertainment',
    url: 'https://www.nhk.or.jp/rss/news/cat2.xml',
    label: 'NHK NEWS WEB',
    limit: 10,
  },
  {
    genre: 'entertainment',
    url: 'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
    label: 'Yahoo!ニュース エンタメ',
    limit: 14,
  },
  {
    genre: 'entertainment',
    url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    label: 'BBC Entertainment',
    limit: 12,
  },
  {
    genre: 'entertainment',
    url: 'https://www.theguardian.com/culture/rss',
    label: 'The Guardian Culture',
    limit: 10,
  },
  {
    genre: 'entertainment',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
    label: 'The New York Times Arts',
    limit: 8,
  },
  {
    genre: 'entertainment',
    url: 'https://variety.com/feed/',
    label: 'Variety',
    limit: 10,
  },
  {
    genre: 'entertainment',
    url: 'https://www.hollywoodreporter.com/feed/',
    label: 'The Hollywood Reporter',
    limit: 8,
  },
  {
    genre: 'entertainment',
    url: 'https://deadline.com/feed/',
    label: 'Deadline',
    limit: 8,
  },
  {
    genre: 'entertainment',
    url: 'https://www.rollingstone.com/feed/',
    label: 'Rolling Stone',
    limit: 8,
  },
  {
    genre: 'entertainment',
    url: 'https://feeds.npr.org/1008/rss.xml',
    label: 'NPR Arts & Life',
    limit: 8,
  },

  // 国際
  {
    genre: 'world',
    url: 'https://www.nhk.or.jp/rss/news/cat6.xml',
    label: 'NHK NEWS WEB',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://news.yahoo.co.jp/rss/categories/world.xml',
    label: 'Yahoo!ニュース 国際',
    limit: 12,
  },
  {
    genre: 'world',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    label: 'BBC News World',
    limit: 12,
  },
  {
    genre: 'world',
    url: 'https://feeds.bbci.co.uk/japanese/rss.xml',
    label: 'BBC News 日本語',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://www.theguardian.com/world/rss',
    label: 'The Guardian',
    limit: 12,
  },
  {
    genre: 'world',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    label: 'The New York Times',
    limit: 12,
  },
  {
    genre: 'world',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    label: 'Al Jazeera',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://rss.dw.com/rdf/rss-en-all',
    label: 'Deutsche Welle',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://feeds.npr.org/1004/rss.xml',
    label: 'NPR',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://www.france24.com/en/rss',
    label: 'France 24',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://www.abc.net.au/news/feed/45910/rss.xml',
    label: 'ABC News Australia',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://news.google.com/rss/search?q=site:reuters.com+world&hl=en&gl=US&ceid=US:en',
    label: 'Reuters World',
    limit: 10,
  },
  {
    genre: 'world',
    url: 'https://news.google.com/rss/search?q=site:cnn.com+world&hl=en&gl=US&ceid=US:en',
    label: 'CNN World',
    limit: 8,
  },

  // 科学
  {
    genre: 'science',
    url: 'https://www.nhk.or.jp/rss/news/cat3.xml',
    label: 'NHK NEWS WEB',
    limit: 10,
  },
  {
    genre: 'science',
    url: 'https://news.yahoo.co.jp/rss/categories/science.xml',
    label: 'Yahoo!ニュース 科学',
    limit: 12,
  },
  {
    genre: 'science',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    label: 'BBC Science',
    limit: 12,
  },
  {
    genre: 'science',
    url: 'https://www.nature.com/nature.rss',
    label: 'Nature',
    limit: 10,
  },
  {
    genre: 'science',
    url: 'https://www.science.org/rss/news_current.xml',
    label: 'Science',
    limit: 10,
  },
  {
    genre: 'science',
    url: 'https://www.theguardian.com/science/rss',
    label: 'The Guardian Science',
    limit: 10,
  },
  {
    genre: 'science',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    label: 'The New York Times',
    limit: 8,
  },
  {
    genre: 'science',
    url: 'https://www.sciencedaily.com/rss/all.xml',
    label: 'ScienceDaily',
    limit: 10,
  },
  {
    genre: 'science',
    url: 'https://feeds.npr.org/1007/rss.xml',
    label: 'NPR Science',
    limit: 8,
  },
  {
    genre: 'science',
    url: 'https://www.space.com/feeds/all',
    label: 'Space.com',
    limit: 10,
  },
  {
    genre: 'science',
    url: 'https://www.newscientist.com/feed/home',
    label: 'New Scientist',
    limit: 8,
  },

  // ライフ
  {
    genre: 'life',
    url: 'https://www.nhk.or.jp/rss/news/cat1.xml',
    label: 'NHK NEWS WEB',
    limit: 10,
  },
  {
    genre: 'life',
    url: 'https://news.yahoo.co.jp/rss/categories/life.xml',
    label: 'Yahoo!ニュース ライフ',
    limit: 12,
  },
  {
    genre: 'life',
    url: 'https://www.lifehacker.jp/feed/index.xml',
    label: 'Lifehacker Japan',
    limit: 10,
  },
  {
    genre: 'life',
    url: 'https://www.roomie.jp/feed/',
    label: 'ROOMIE',
    limit: 8,
  },
  {
    genre: 'life',
    url: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    label: 'BBC Health',
    limit: 10,
  },
  {
    genre: 'life',
    url: 'https://www.theguardian.com/lifeandstyle/rss',
    label: 'The Guardian Life',
    limit: 10,
  },
  {
    genre: 'life',
    url: 'https://feeds.npr.org/1128/rss.xml',
    label: 'NPR Health',
    limit: 10,
  },
  {
    genre: 'life',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    label: 'The New York Times Health',
    limit: 8,
  },
  {
    genre: 'life',
    url: 'https://www.theguardian.com/society/rss',
    label: 'The Guardian Society',
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
  const candidates = [
    tagValue(block, 'content:encoded'),
    tagValue(block, 'content'),
    tagValue(block, 'description'),
    tagValue(block, 'summary'),
    tagValue(block, 'dc:description'),
    tagValue(block, 'media:description'),
  ].filter((value) => value.length > 0)

  if (candidates.length === 0) return ''
  return candidates.sort((a, b) => b.length - a.length)[0]
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
      'reuters.com': 'Reuters',
      'apnews.com': 'AP News',
      'theguardian.com': 'The Guardian',
      'nytimes.com': 'The New York Times',
      'washingtonpost.com': 'The Washington Post',
      'npr.org': 'NPR',
      'aljazeera.com': 'Al Jazeera',
      'dw.com': 'Deutsche Welle',
      'bloomberg.com': 'Bloomberg',
      'ft.com': 'Financial Times',
      'economist.com': 'The Economist',
      'cnn.com': 'CNN',
      'abc.net.au': 'ABC News Australia',
      'nature.com': 'Nature',
      'science.org': 'Science',
      'sciencedaily.com': 'ScienceDaily',
      'france24.com': 'France 24',
      'politico.com': 'Politico',
      'espn.com': 'ESPN',
      'skysports.com': 'Sky Sports',
      'theverge.com': 'The Verge',
      'wired.com': 'WIRED',
      'techcrunch.com': 'TechCrunch',
      'arstechnica.com': 'Ars Technica',
      'variety.com': 'Variety',
      'hollywoodreporter.com': 'The Hollywood Reporter',
      'deadline.com': 'Deadline',
      'rollingstone.com': 'Rolling Stone',
      'venturebeat.com': 'VentureBeat',
      'technologyreview.com': 'MIT Technology Review',
      'space.com': 'Space.com',
      'newscientist.com': 'New Scientist',
      'fnn.jp': 'FNNプライムオンライン',
      'jiji.com': '時事通信',
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
  const cleaned = cleanDetailText(description)
  if (isBoilerplateDetail(cleaned) || isThinDetail(cleaned, title)) return []

  const sentences = splitSentences(cleaned)
    .map((point) => point.replace(/[。．]$/, '').trim())
    .filter((point) => point.length >= 18)
    .filter((point) => !isBoilerplateDetail(point))
    .filter((point) => point !== title && !title.includes(point))

  return sentences.slice(0, 3)
}

function postersFor(genre: GenreId): string[] {
  if (genre in POSTERS) return POSTERS[genre as BuiltinGenreId]
  return DEFAULT_POSTERS
}

type FeedCandidate = {
  item: RssItem
  genre: GenreId
  sourceLabel: string
  feedUrl: string
}

async function toNewsItem(
  item: RssItem,
  genre: GenreId,
  sourceLabel: string,
  feedUrl = '',
): Promise<NewsItem | null> {
  const seed = hashId(item.link || item.title)
  let description = cleanDetailText(item.description || '')
  if (isBoilerplateDetail(description)) description = ''

  const enriched = await enrichArticleBody(item.link, description, item.title)
  description = cleanDetailText(enriched.detail)
  if (isBoilerplateDetail(description)) description = ''

  // 本文が取れない場合はタイトルを詳細の代わりに使う（定型文は載せない）
  const detail = description || cleanDetailText(item.title)
  if (!detail || isBoilerplateDetail(detail)) return null

  // ジャンル / キーワード適合（検索ジャンルも含む）
  if (!isRelevantToGenre(genre, item.title, detail, feedUrl)) {
    return null
  }

  // 検索キーワードはタイトル一致を必須（詳細文だけの一致は不可）
  if (isSearchGenre(genre)) {
    const query = labelFromGenreId(genre).trim()
    if (query && !titleMatchesSearchQuery(item.title, query)) return null
  }

  const summary = buildSummary(detail)
  const resolvedUrl = enriched.resolvedUrl || item.link || undefined

  return {
    id: `live-${seed.toString(16)}`,
    genre,
    title: cleanDetailText(item.title) || item.title,
    summary,
    detail,
    keyPoints: buildKeyPoints(item.title, detail),
    related: [],
    source: resolveSourceLabel(sourceLabel, item),
    publishedAt: toIso(item.pubDate),
    url: resolvedUrl,
    videoUrl: pick(VIDEOS, seed),
    posterUrl: pick(postersFor(genre), seed),
    likes: 200 + (seed % 8000),
    comments: 20 + (seed % 500),
  }
}

async function localizeNewsItem(item: NewsItem): Promise<NewsItem> {
  const [title, detailRaw] = await Promise.all([
    translateToJapanese(item.title),
    translateToJapanese(item.detail),
  ])
  const detail = cleanDetailText(detailRaw)
  if (
    (title === item.title && detail === item.detail) ||
    isBoilerplateDetail(detail)
  ) {
    return {
      ...item,
      detail: isBoilerplateDetail(item.detail) ? item.title : item.detail,
      keyPoints: buildKeyPoints(
        item.title,
        isBoilerplateDetail(item.detail) ? item.title : item.detail,
      ),
    }
  }
  const safeDetail = detail || title
  return {
    ...item,
    title,
    detail: safeDetail,
    summary: buildSummary(safeDetail),
    keyPoints: buildKeyPoints(title, safeDetail),
  }
}

/** RSS だけ軽く取得し、本文補完前の候補を返す（多ソース向け） */
async function fetchFeedCandidates(source: FeedSource): Promise<FeedCandidate[]> {
  const response = await fetch(source.url, {
    headers: {
      Accept:
        'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      'User-Agent': 'MYLINE-NewsBot/1.0 (+https://shortnews-theta.vercel.app)',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) {
    throw new Error(`RSS ${source.label} failed: ${response.status}`)
  }
  const xml = await response.text()
  const items = parseFeed(xml)
  const limit = source.limit ?? 10

  let filtered = items

  // AI枠の汎用フィードはAI関連のみ残す（AI専門フィードは除外）
  if (
    source.genre === 'ai' &&
    !/aiplus|artificial-intelligence|\/ai\/|tag\/ai|venturebeat\.com\/category\/ai|technologyreview/i.test(
      source.url,
    )
  ) {
    filtered = filtered.filter((item) =>
      AI_PATTERN.test(`${item.title} ${item.description}`),
    )
  }

  const isEngineSearch =
    /news\.google\.com\/rss\/search|bing\.com\/news\/search/i.test(source.url)

  if (isSearchGenre(source.genre)) {
    // 横断RSSはクエリ一致必須。検索エンジン結果はエンジンの関連度を信頼
    if (source.query && !isEngineSearch) {
      filtered = filtered.filter((item) => matchesQuery(item, source.query!))
    }
  } else {
    filtered = filtered.filter((item) =>
      isRelevantToGenre(source.genre, item.title, item.description, source.url),
    )
  }

  // 検索ジャンルはタイトル一致を優先して並べ替え
  if (isSearchGenre(source.genre)) {
    const q = labelFromGenreId(source.genre)
    filtered = filtered.slice().sort((a, b) => {
      const aTitle = a.title.includes(q) ? 1 : 0
      const bTitle = b.title.includes(q) ? 1 : 0
      return bTitle - aTitle
    })
  }

  return filtered.slice(0, limit).map((item) => ({
    item,
    genre: source.genre,
    sourceLabel: source.label,
    feedUrl: source.url,
  }))
}

function matchesQuery(item: RssItem, query: string): boolean {
  return isRelevantToGenre(
    // ダミーの search id ではなくクエリ直接判定のため、一時 id を組む
    `search:${encodeURIComponent(query)}`,
    item.title,
    item.description,
  )
}

function dedupeCandidates(items: FeedCandidate[]): FeedCandidate[] {
  const seen = new Set<string>()
  const result: FeedCandidate[] = []
  for (const candidate of items) {
    const key = candidate.item.title.replace(/\s+/g, '')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(candidate)
  }
  return result
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

function balanceCandidates(
  items: FeedCandidate[],
  perGenre = 36,
  total = 240,
): FeedCandidate[] {
  const groups = new Map<GenreId, FeedCandidate[]>()
  for (const item of items) {
    const list = groups.get(item.genre) ?? []
    list.push(item)
    groups.set(item.genre, list)
  }

  const genreCount = Math.max(groups.size, 1)
  const dynamicPerGenre =
    genreCount <= 2 ? Math.max(perGenre, 90) : perGenre
  const dynamicTotal =
    genreCount <= 2 ? Math.max(total, 140) : total

  const picked: FeedCandidate[] = []
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        Date.parse(b.item.pubDate || '') - Date.parse(a.item.pubDate || '') ||
        0,
    )
    picked.push(...list.slice(0, dynamicPerGenre))
  }

  return picked
    .sort(
      (a, b) =>
        Date.parse(b.item.pubDate || '') - Date.parse(a.item.pubDate || '') ||
        0,
    )
    .slice(0, dynamicTotal)
}

function balanceByGenre(
  items: NewsItem[],
  perGenre = 28,
  total = 200,
): NewsItem[] {
  const groups = new Map<GenreId, NewsItem[]>()
  for (const item of items) {
    const list = groups.get(item.genre) ?? []
    list.push(item)
    groups.set(item.genre, list)
  }

  const genreCount = Math.max(groups.size, 1)
  const dynamicPerGenre =
    genreCount <= 2 ? Math.max(perGenre, 72) : perGenre
  const dynamicTotal =
    genreCount <= 2 ? Math.max(total, 120) : total

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

function isDomesticHost(host: string): boolean {
  return /\.jp$|yahoo\.co\.jp|nhk\.or\.jp|nikkei\.com|asahi\.com|mainichi\.jp|oricon\.co\.jp|itmedia\.co\.jp|toyokeizai\.net|fnn\.jp|jiji\.com|sponichi\.co\.jp|nikkansports\.com/.test(
    host,
  )
}

/** 組み込みジャンル向け: Google/Bing 横断で国内外を追加収集 */
function genreSupplementFeeds(
  id: BuiltinGenreId,
  compact: boolean,
): FeedSource[] {
  const queries = GENRE_SEARCH_QUERIES[id]
  if (!queries) return []

  const ja = encodeURIComponent(queries.ja)
  const en = encodeURIComponent(queries.en)
  const primary: FeedSource[] = [
    {
      genre: id,
      url: `https://news.google.com/rss/search?q=${ja}&hl=ja&gl=JP&ceid=JP:ja`,
      label: `Google ニュース · ${queries.ja}`,
      limit: compact ? 6 : 10,
    },
    {
      genre: id,
      url: `https://www.bing.com/news/search?q=${ja}&format=RSS&mkt=ja-JP`,
      label: `Bing ニュース · ${queries.ja}`,
      limit: compact ? 6 : 10,
    },
  ]

  if (compact) return primary

  return [
    ...primary,
    {
      genre: id,
      url: `https://news.google.com/rss/search?q=${en}&hl=en&gl=US&ceid=US:en`,
      label: `Google News World · ${queries.en}`,
      limit: 8,
    },
    {
      genre: id,
      url: `https://www.bing.com/news/search?q=${en}&format=RSS&mkt=en-US`,
      label: `Bing News World · ${queries.en}`,
      limit: 8,
    },
  ]
}

function feedsForGenre(id: GenreId, compact = false): FeedSource[] {
  if (isSearchGenre(id)) {
    const query = labelFromGenreId(id)
    const encoded = encodeURIComponent(query)
    const primary: FeedSource[] = [
      {
        genre: id,
        url: `https://www.bing.com/news/search?q=${encoded}&format=RSS&mkt=ja-JP`,
        label: `Bing ニュース · ${query}`,
        limit: compact ? 10 : 10,
      },
      {
        genre: id,
        url: `https://news.google.com/rss/search?q=${encoded}&hl=ja&gl=JP&ceid=JP:ja`,
        label: `Google ニュース · ${query}`,
        limit: compact ? 8 : 10,
      },
    ]

    if (compact) {
      // 複数ジャンル時はタイムアウト回避のため主要ソースに絞る
      return [
        ...primary,
        {
          genre: id,
          url: `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`,
          label: `Google News World · ${query}`,
          limit: 6,
        },
        ...SEARCH_MEDIA.slice(0, 8).map((feed) => ({
          ...feed,
          genre: id,
          query,
          limit: Math.min(feed.limit ?? 12, 6),
        })),
      ]
    }

    return [
      ...primary,
      {
        genre: id,
        url: `https://www.bing.com/news/search?q=${encoded}&format=RSS&mkt=en-US`,
        label: `Bing News World · ${query}`,
        limit: 10,
      },
      {
        genre: id,
        url: `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`,
        label: `Google News World · ${query}`,
        limit: 8,
      },
      ...SEARCH_SITES.slice(0, 18).map((site) => {
        const market = isDomesticHost(site.host) ? 'ja-JP' : 'en-US'
        return {
          genre: id,
          url: `https://www.bing.com/news/search?q=${encodeURIComponent(`${query} site:${site.host}`)}&format=RSS&mkt=${market}`,
          label: site.label,
          limit: 4,
        }
      }),
      ...SEARCH_MEDIA.map((feed) => ({
        ...feed,
        genre: id,
        query,
        limit: Math.min(feed.limit ?? 12, 6),
      })),
    ]
  }

  const specialist = FEEDS.filter((feed) => feed.genre === id)
  if (!(id in GENRE_SEARCH_QUERIES)) return specialist
  return [
    ...specialist,
    ...genreSupplementFeeds(id as BuiltinGenreId, compact),
  ]
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

  const compact = Boolean(genreIds && genreIds.length > 1)
  const feeds =
    genreIds && genreIds.length > 0
      ? genreIds.flatMap((id) => feedsForGenre(id, compact))
      : FEEDS

  if (feeds.length === 0) return []

  // 1) 多ソースから候補だけ高速収集（本文補完は後段）
  const settled = await mapSettled(feeds, compact ? 10 : 14, (feed) =>
    fetchFeedCandidates(feed),
  )
  const collected: FeedCandidate[] = []
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

  const scoped =
    genreIds && genreIds.length > 0
      ? collected.filter((item) => genreIds.includes(item.genre))
      : collected

  const shortlisted = balanceCandidates(dedupeCandidates(scoped))

  // 2) 採用候補だけ本文補完（Edge タイムアウト回避）
  const enriched = await mapSettled(shortlisted, compact ? 4 : 5, (candidate) =>
    toNewsItem(
      candidate.item,
      candidate.genre,
      candidate.sourceLabel,
      candidate.feedUrl,
    ),
  )

  const newsItems = enriched
    .filter(
      (result): result is PromiseFulfilledResult<NewsItem> =>
        result.status === 'fulfilled' && result.value !== null,
    )
    .map((result) => result.value as NewsItem)

  const balanced = balanceByGenre(dedupe(newsItems))
  const localized = await mapSettled(balanced, 4, localizeNewsItem)

  const results = localized.map((result, index) =>
    result.status === 'fulfilled' ? result.value : balanced[index],
  )

  // 翻訳後もキーワード適合を再確認（英語タイトル経由の誤通過を防ぐ）
  if (genreIds && genreIds.length > 0) {
    return results.filter((item) => {
      if (!genreIds.includes(item.genre)) return false
      if (!isSearchGenre(item.genre)) {
        return isRelevantToGenre(item.genre, item.title, item.detail)
      }
      return titleMatchesSearchQuery(item.title, labelFromGenreId(item.genre))
    })
  }

  return results
}

export function parseGenreQuery(value: string | null): GenreId[] | undefined {
  if (value === null) return undefined
  if (value.trim() === '') return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}
