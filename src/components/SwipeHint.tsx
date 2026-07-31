type Props = {
  visible: boolean
  /** 実際のニュース記事数（続きスライドは含めない） */
  newsCount: number
}

export function SwipeHint({ visible, newsCount }: Props) {
  // 記事が2本未満のときは絶対に出さない（続きカードだけのスワイプを案内しない）
  if (!visible || newsCount < 2) return null

  return (
    <div className="swipe-hint" aria-hidden="true">
      <div className="swipe-hint-card">
        <span className="swipe-arrow" />
        <p>上にスワイプで次のニュース</p>
      </div>
    </div>
  )
}
