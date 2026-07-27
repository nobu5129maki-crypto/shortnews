import type { BuiltinGenreId, Genre, NewsItem } from '../types'

export const genres: Genre[] = [
  { id: 'politics', label: '政治', blurb: '国会・政策・地方' },
  { id: 'business', label: '経済', blurb: '市場・企業・投資' },
  { id: 'tech', label: 'テック', blurb: 'ガジェット・IT' },
  { id: 'ai', label: 'AI', blurb: '生成AI・活用動向' },
  { id: 'sports', label: 'スポーツ', blurb: '試合・記録・選手' },
  { id: 'entertainment', label: 'エンタメ', blurb: '映画・音楽・ドラマ' },
  { id: 'world', label: '国際', blurb: '海外情勢・外交' },
  { id: 'science', label: '科学', blurb: '宇宙・研究・発見' },
  { id: 'life', label: 'ライフ', blurb: '暮らし・街・健康' },
]

export type { BuiltinGenreId }

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
    detail:
      '補正予算案をめぐり、与党は医療逼迫地域への支援と防災インフラ更新を柱に据えた。野党は財源の透明性と家計負担への影響を質しており、修正協議が続いている。AI要約では「採決タイミング」と「支出の優先順位」が最大の論点と整理される。',
    keyPoints: [
      '医療・防災が追加支出の中心',
      '与野党は週内採決を目指し最終調整',
      '財源の示し方が合意の鍵',
    ],
    related: [
      {
        id: 'r1a',
        label: '予算の内訳',
        detail:
          '追加枠の多くは医療機関の逼迫緩和と、災害リスクの高い地域の設備更新に充てられる見込み。地方交付との調整も並行して進む。',
      },
      {
        id: 'r1b',
        label: '与野党の対立点',
        detail:
          '野党は「場当たり的な補正」を懸念し、恒久財源の明示を要求。与党は緊急対応の必要性を強調し、早期成立を優先する姿勢だ。',
      },
    ],
    source: 'MYLINE政治',
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
    detail:
      '東京市場は半導体装置や自動車など輸出主導銘柄が買われ、日経平均は年初来高値を更新した。円安進行と海外勢の先物買いが重なり、幅広いセクターに資金が流入。短期的な過熱感も指摘される一方、企業業績の上方修正期待が下支えとなっている。',
    keyPoints: [
      '半導体・輸出関連が上昇を主導',
      '海外投資家の買い越しが継続',
      '終値は前日比約1.8%高',
    ],
    related: [
      {
        id: 'r2a',
        label: '注目セクター',
        detail:
          'AIサーバー向け需要を背景に半導体装置が強い。自動車も北米需要の回復期待で買いが入り、指数寄与度上位を占めた。',
      },
      {
        id: 'r2b',
        label: '為替の影響',
        detail:
          'ドル円の円安局面が輸出企業の収益期待を押し上げた。一方で輸入コスト増への警戒も残るため、水準次第で選別が進む可能性がある。',
      },
    ],
    source: 'MYLINE経済',
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
    detail:
      '国内半導体メーカーは次世代AI向けチップの量産開始を当初計画より前倒しすると発表した。新ラインでは電力効率を従来比約40%改善し、データセンター需要の急拡大に対応する。人材確保と装置調達がボトルネックになりうる点も同時に示された。',
    keyPoints: [
      '量産開始が前倒し',
      '消費電力を約40%削減',
      'データセンター需要が背景',
    ],
    related: [
      {
        id: 'r3a',
        label: '技術の要点',
        detail:
          '新しいプロセスと冷却設計の組み合わせで、推論処理あたりの電力を大幅に抑える。エッジ用途への展開も視野に入る。',
      },
      {
        id: 'r3b',
        label: '供給リスク',
        detail:
          '装置リードタイムと熟練技術者の不足が量産ペースを左右する。提携先との共同調達でリスク分散を図る方針だ。',
      },
    ],
    source: 'MYLINEテック',
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
    detail:
      'アウェーの国際試合は終了間際の同点弾で2-2の引き分け。前半は押し込まれ失点したものの、後半の攻撃で巻き返した。監督は「守備のコミュニケーション不足」を課題に挙げ、次戦に向けた修正を急ぐ考えを示した。',
    keyPoints: [
      'スコアは2-2の引き分け',
      '終了間際に同点弾',
      '次戦の焦点は守備の立て直し',
    ],
    related: [
      {
        id: 'r4a',
        label: '試合の流れ',
        detail:
          '相手のサイド攻撃から2失点。途中出場の攻撃的選手が起点となり同点まで持ち込んだ。セットプレー精度の高さが光った。',
      },
      {
        id: 'r4b',
        label: '次戦の見通し',
        detail:
          '中3日での試合となるため、疲労管理が重要。守備陣の配置変更と、前線のプレス強度の調整が検討されている。',
      },
    ],
    source: 'MYLINEスポーツ',
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
    detail:
      '人気連続ドラマの最終回がシリーズ最高視聴率を記録し、配信プラットフォームでも同時再生数が過去最多となった。結末の余韻とキャストの化学反応が話題で、続編・スピンオフを求める声がSNSで急増している。制作側は現時点で正式発表は控えている。',
    keyPoints: [
      '最終回がシリーズ最高視聴率',
      '配信の同時再生も過去最多',
      '続編期待がSNSで拡散',
    ],
    related: [
      {
        id: 'r5a',
        label: 'SNSの反応',
        detail:
          '感動の結末を振り返る投稿がトレンド入り。主要キャストの名シーン切り抜きが短尺動画でも拡散した。',
      },
      {
        id: 'r5b',
        label: '続編の可能性',
        detail:
          '制作会社は「まずは最終回の反響を見極めたい」とコメント。海外配信の伸びも判断材料になる見通し。',
      },
    ],
    source: 'MYLINEエンタメ',
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
    detail:
      '欧州連合は気候対策の新枠組みで合意し、中期の排出削減目標を引き上げた。再生可能エネルギー投資の加速が柱となる一方、エネルギー集約産業への移行支援が次の交渉焦点だ。加盟国間の産業構造差をどう埋めるかが実効性を左右する。',
    keyPoints: [
      '排出削減目標を引き上げ',
      '再エネ投資の加速が柱',
      '産業界への影響緩和が論点',
    ],
    related: [
      {
        id: 'r6a',
        label: '目標の中身',
        detail:
          '電力部門の脱炭素を優先し、運輸・建物の効率基準も段階強化。炭素国境調整との整合も議論された。',
      },
      {
        id: 'r6b',
        label: '産業への影響',
        detail:
          '鉄鋼・化学などはコスト増を懸念。移行基金の配分と技術支援のスピードが競争力維持の鍵になる。',
      },
    ],
    source: 'MYLINE国際',
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
    detail:
      '月面探査ミッションの着陸候補地が南極付近の永久影領域に正式決定した。太陽光が届きにくい地形に水氷が存在する可能性があり、将来の有人活動の資源確保につながる。着陸精度と通信遅延への対策が技術課題として残る。',
    keyPoints: [
      '着陸地は月南極付近',
      '主目的は水氷の確認',
      '有人探査の資源調査にも寄与',
    ],
    related: [
      {
        id: 'r7a',
        label: 'なぜ南極か',
        detail:
          '永久影クレーターは温度が極めて低く、揮発性物質が保存されやすい。過去の軌道観測でも水分の兆候が報告されている。',
      },
      {
        id: 'r7b',
        label: '技術課題',
        detail:
          '急斜面と通信の見通し外が難題。自律着陸アルゴリズムと中継衛星の運用が成功の条件となる。',
      },
    ],
    source: 'MYLINE科学',
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
    detail:
      '都市部で徒歩15分以内に日常サービスが揃う「15分生活圏」の実証が広がっている。スーパー、診療所、公園の配置を見直し、自動車依存を減らす狙いだ。参加自治体では住民満足度が上昇し、空き店舗の再活用も進んでいる。',
    keyPoints: [
      '徒歩圏で生活機能を完結',
      '住民満足度が向上',
      '空き店舗の再活用も進行',
    ],
    related: [
      {
        id: 'r8a',
        label: '実証の成果',
        detail:
          '買い物・通院の移動時間が短縮し、高齢者の外出頻度が増加。地域イベントの参加率も改善した。',
      },
      {
        id: 'r8b',
        label: '課題と反論',
        detail:
          '地価上昇や店舗賃料の負担増を懸念する声もある。公共交通との接続設計が持続性のポイントだ。',
      },
    ],
    source: 'MYLINEライフ',
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
    detail:
      '主要スマホOSが秋の大型アップデートでプライバシー機能を強化する。アプリごとの通信状況を可視化し、不要な送信をワンタップで遮断できる。位置情報やマイク権限の再確認フローも簡素化され、利用者の制御権を高める設計だ。',
    keyPoints: [
      '通信の可視化と遮断が可能に',
      '権限管理の導線を簡素化',
      '秋の大型アップデートで提供',
    ],
    related: [
      {
        id: 'r9a',
        label: '新機能の使い方',
        detail:
          '設定のプライバシー画面からアプリ単位で通信ログを確認できる。怪しい送信先は一覧から即遮断できる。',
      },
      {
        id: 'r9b',
        label: '開発者への影響',
        detail:
          'バックグラウンド通信の説明責任が強まる。正当な用途でもユーザー向けの透明性表示が求められる。',
      },
    ],
    source: 'MYLINEテック',
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
    detail:
      '国内スタートアップの資金調達額が四半期ベースで過去最高を更新した。生成AIと気候テックに資金の約半数が集中し、大型ラウンドが目立った。海外VCの国内参入も加速し、シリーズB以降の成長資金が厚くなっている。',
    keyPoints: [
      '四半期調達額が過去最高',
      '生成AI・気候テックが約半分',
      '海外VCの参入が加速',
    ],
    related: [
      {
        id: 'r10a',
        label: '資金の流れ',
        detail:
          'シードは選別が進む一方、実績あるAI基盤・再エネ効率化領域に大型資金が集中している。',
      },
      {
        id: 'r10b',
        label: '海外VCの動き',
        detail:
          'アジア拠点を持つ海外ファンドが日本法人設立を増やし、共同投資を通じて案件獲得を急いでいる。',
      },
    ],
    source: 'MYLINE経済',
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
    detail:
      '国内主要マラソンで日本記録更新への期待が高まっている。天気予報は追い風傾向で、有力ランナー3人が記録更新圏のペース設定で最終調整を終えた。ペースメーカー配置と給水計画が勝負の分かれ目になる。',
    keyPoints: [
      '追い風予報で好条件',
      '有力3選手が記録更新圏で調整',
      'ペースメイクが勝敗を左右',
    ],
    related: [
      {
        id: 'r11a',
        label: '記録の条件',
        detail:
          '気温・風・湿度のバランスが重要。前半の抑えすぎも後半失速も禁物で、均等ペースが理想とされる。',
      },
      {
        id: 'r11b',
        label: '注目選手',
        detail:
          '直近レースで自己ベストを出した選手が軸。海外招待選手との駆け引きも見どころだ。',
      },
    ],
    source: 'MYLINEスポーツ',
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
    detail:
      '地方創生向けデジタル交付金の新制度が始動した。遠隔医療と公共交通のDXを重点分野とし、初年度は約200自治体が採択された。成果指標の可視化が要件で、使い切れない予算の再配分ルールも導入される。',
    keyPoints: [
      '遠隔医療と交通DXが重点',
      '初年度200自治体が対象',
      '成果指標の可視化が要件',
    ],
    related: [
      {
        id: 'r12a',
        label: '対象事業',
        detail:
          'オンライン診療の拠点整備、デマンド交通のアプリ化、行政手続きのワンストップ化などが中心となる。',
      },
      {
        id: 'r12b',
        label: '自治体の課題',
        detail:
          '専門人材の不足が共通課題。広域連携や民間委託でノウハウを共有する動きが広がっている。',
      },
    ],
    source: 'MYLINE政治',
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
    detail:
      '対話型AIを使ったカルテ要約の実証で、医師の確認時間が平均で約半分に短縮された。誤要約を防ぐため、重要所見はハイライト表示し、最終判断は必ず医師が行う運用が条件だ。個人情報の院内完結処理も導入判断を後押ししている。',
    keyPoints: [
      '確認時間が約半分に短縮',
      '最終判断は医師が実施',
      '院内完結の処理で導入加速',
    ],
    related: [
      {
        id: 'r13a',
        label: '精度と安全',
        detail:
          '要約の根拠文をカルテ原文へ遡れる機能が評価された。誤情報リスクを下げる監査ログも必須要件となっている。',
      },
      {
        id: 'r13b',
        label: '現場の声',
        detail:
          '若手医師は下調べ時間の短縮を歓迎。ベテラン層は「見落とし防止の二重確認」が負担減の前提だと指摘する。',
      },
    ],
    source: 'MYLINE AI',
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
    detail:
      '業界団体が生成AIの著作権に関する利用ガイドラインを公開した。学習データの出どころ開示、商用利用時の許諾範囲、出力物の権利帰属を整理し、クリエイター保護と開発促進の両立を目指す。違反時の相談窓口も新設される。',
    keyPoints: [
      '学習データの透明性を要求',
      '商用利用の範囲を明確化',
      '相談窓口を新設',
    ],
    related: [
      {
        id: 'r14a',
        label: 'ガイドライン要点',
        detail:
          '学習に使ったデータ種別の表示、オプトアウト手段の提供、類似出力への対応方針の明示が柱となる。',
      },
      {
        id: 'r14b',
        label: 'クリエイター視点',
        detail:
          '作風の無断学習への懸念が強い。収益還元やクレジット表示を求める声がガイドライン議論を後押しした。',
      },
    ],
    source: 'MYLINE AI',
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
    detail:
      '次期スマホではオンデバイスAIが標準搭載される見通しだ。通信なしでも翻訳や写真編集が可能になり、プライバシーと低遅延が利点となる。一方でモデル実行時の発熱とバッテリー消費が課題で、専用NPUの効率化が普及の鍵とされる。',
    keyPoints: [
      'オフラインで翻訳・編集が可能',
      'プライバシーと低遅延が利点',
      'バッテリー効率が普及の鍵',
    ],
    related: [
      {
        id: 'r15a',
        label: 'できること',
        detail:
          'リアルタイム翻訳、背景除去、音声の文字起こしなどが端末内で完結。機内モードでも主要機能が使える。',
      },
      {
        id: 'r15b',
        label: '残る課題',
        detail:
          '大型モデルはまだクラウド依存が残る。端末側は小型モデルの品質向上と、熱設計の最適化が焦点だ。',
      },
    ],
    source: 'MYLINE AI',
    publishedAt: '5時間前',
    videoUrl: videos[14],
    posterUrl:
      'https://images.unsplash.com/photo-1535378620166-273708d23931?w=800&q=80',
    likes: 3354,
    comments: 197,
  },
]
