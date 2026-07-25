import type { Genre, NewsItem } from '../types'

export const genres: Genre[] = [
  { id: 'all', label: 'すべて' },
  { id: 'politics', label: '政治' },
  { id: 'business', label: '経済' },
  { id: 'tech', label: 'テック' },
  { id: 'ai', label: 'AI' },
  { id: 'sports', label: 'スポーツ' },
  { id: 'entertainment', label: 'エンタメ' },
  { id: 'world', label: '国際' },
  { id: 'science', label: '科学' },
  { id: 'life', label: 'ライフ' },
]

const videos = [
  'https://cdn.coverr.co/videos/coverr-newspaper-printing-press-4421/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-stock-market-data-on-a-screen-4825/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-4255/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-football-stadium-4167/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-people-watching-a-movie-in-a-cinema-4289/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-earth-from-space-4225/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-scientist-working-in-a-lab-5082/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-modern-city-buildings-4244/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-typing-on-a-computer-keyboard-1584/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-person-working-on-a-laptop-5636/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-woman-jogging-in-the-park-4257/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-busy-city-traffic-at-night-1583/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-artificial-intelligence-robot-5084/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-a-man-working-on-his-laptop-5664/720p.mp4',
  'https://cdn.coverr.co/videos/coverr-aerial-view-of-a-city-at-night-5722/720p.mp4',
]

export const newsItems: NewsItem[] = [
  {
    id: 'n1',
    genre: 'politics',
    title: '国会、補正予算の審議が大詰めへ',
    summary:
      '与野党が最終調整に入り、医療・防災への追加支出が焦点。採決は週内の見通し。',
    source: 'BRIEF政治',
    publishedAt: '12分前',
    videoUrl: videos[0],
    posterUrl:
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    likes: 1284,
    comments: 96,
  },
  {
    id: 'n2',
    genre: 'business',
    title: '日経平均、年初来高値を更新',
    summary:
      '半導体と輸出関連が牽引。海外投資家の買いが続き、終値は前日比1.8%高。',
    source: 'BRIEF経済',
    publishedAt: '28分前',
    videoUrl: videos[1],
    posterUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    likes: 2103,
    comments: 154,
  },
  {
    id: 'n3',
    genre: 'tech',
    title: '次世代AIチップ、量産計画が前倒し',
    summary:
      '国内メーカーが新工場ラインを公開。消費電力を従来比40%削減すると発表。',
    source: 'BRIEFテック',
    publishedAt: '41分前',
    videoUrl: videos[2],
    posterUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    likes: 3560,
    comments: 287,
  },
  {
    id: 'n4',
    genre: 'sports',
    title: '代表戦、終了間際の同点弾で引き分け',
    summary:
      'アウェーの一戦は2-2。守備の立て直しが次戦の鍵になると監督がコメント。',
    source: 'BRIEFスポーツ',
    publishedAt: '1時間前',
    videoUrl: videos[3],
    posterUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    likes: 8421,
    comments: 612,
  },
  {
    id: 'n5',
    genre: 'entertainment',
    title: '話題のドラマ、最終回視聴率がシリーズ最高',
    summary:
      '配信同時再生も過去最多。キャストの続編への期待がSNSで広がる。',
    source: 'BRIEFエンタメ',
    publishedAt: '1時間前',
    videoUrl: videos[4],
    posterUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    likes: 4972,
    comments: 403,
  },
  {
    id: 'n6',
    genre: 'world',
    title: '欧州、気候対策の新枠組みで合意',
    summary:
      '加盟国が排出削減目標の引き上げで一致。産業界への影響が今後の論点に。',
    source: 'BRIEF国際',
    publishedAt: '2時間前',
    videoUrl: videos[5],
    posterUrl:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
    likes: 1650,
    comments: 118,
  },
  {
    id: 'n7',
    genre: 'science',
    title: '月面探査機、着陸候補地を正式発表',
    summary:
      '南極付近の永久影領域を選定。水氷の確認がミッションの主目的。',
    source: 'BRIEF科学',
    publishedAt: '3時間前',
    videoUrl: videos[6],
    posterUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
    likes: 2890,
    comments: 201,
  },
  {
    id: 'n8',
    genre: 'life',
    title: '都市部で「15分生活圏」の実証が拡大',
    summary:
      '徒歩圏内で買い物・医療・公園を完結させる街づくり。住民の満足度が上昇。',
    source: 'BRIEFライフ',
    publishedAt: '3時間前',
    videoUrl: videos[7],
    posterUrl:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
    likes: 980,
    comments: 67,
  },
  {
    id: 'n9',
    genre: 'tech',
    title: 'スマホOS、プライバシー機能を大幅強化',
    summary:
      'アプリごとの通信可視化とワンタップ遮断を追加。秋の大型アップデートで実装。',
    source: 'BRIEFテック',
    publishedAt: '4時間前',
    videoUrl: videos[8],
    posterUrl:
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80',
    likes: 1744,
    comments: 132,
  },
  {
    id: 'n10',
    genre: 'business',
    title: 'スタートアップ資金調達、四半期で過去最高',
    summary:
      '生成AIと気候テックが資金の約半分を占める。海外VCの国内参入も加速。',
    source: 'BRIEF経済',
    publishedAt: '5時間前',
    videoUrl: videos[9],
    posterUrl:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
    likes: 1320,
    comments: 88,
  },
  {
    id: 'n11',
    genre: 'sports',
    title: 'マラソン日本記録、大会新で更新なるか',
    summary:
      '天候は追い風予報。有力ランナー3人が記録更新圏のペースで調整完了。',
    source: 'BRIEFスポーツ',
    publishedAt: '6時間前',
    videoUrl: videos[10],
    posterUrl:
      'https://images.unsplash.com/photo-1452626038306-9aae5e071dd1?w=800&q=80',
    likes: 2201,
    comments: 175,
  },
  {
    id: 'n12',
    genre: 'politics',
    title: '地方創生、デジタル交付金の新制度が始動',
    summary:
      '遠隔医療と公共交通のDXを重点支援。初年度は200自治体が対象。',
    source: 'BRIEF政治',
    publishedAt: '7時間前',
    videoUrl: videos[11],
    posterUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    likes: 756,
    comments: 54,
  },
  {
    id: 'n13',
    genre: 'ai',
    title: '対話型AI、医療要約で医師の確認時間を半減',
    summary:
      '国内病院での実証でカルテ要約の精度が向上。最終判断は医師が行う運用を前提に導入が進む。',
    source: 'BRIEF AI',
    publishedAt: '18分前',
    videoUrl: videos[12],
    posterUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    likes: 4120,
    comments: 318,
  },
  {
    id: 'n14',
    genre: 'ai',
    title: '生成AIの著作権、業界団体が利用ガイドラインを公開',
    summary:
      '学習データの透明性と商用利用の範囲を整理。クリエイター保護とイノベーションの両立が焦点。',
    source: 'BRIEF AI',
    publishedAt: '2時間前',
    videoUrl: videos[13],
    posterUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    likes: 2688,
    comments: 241,
  },
  {
    id: 'n15',
    genre: 'ai',
    title: 'オンデバイスAI、スマホ新機種で標準搭載へ',
    summary:
      '通信なしでも翻訳・写真編集が可能に。バッテリー効率の改善が普及の鍵とされる。',
    source: 'BRIEF AI',
    publishedAt: '5時間前',
    videoUrl: videos[14],
    posterUrl:
      'https://images.unsplash.com/photo-1535378620166-273708d23931?w=800&q=80',
    likes: 3354,
    comments: 197,
  },
]
