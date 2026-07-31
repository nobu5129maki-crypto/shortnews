type Props = {
  /** false またはニュースが2本未満なら何も描画しない */
  enabled: boolean
}

/**
 * 次のニュースへスワイプできるときだけ案内を出す。
 * 呼び出し側で「本番記事が2本以上」を保証すること。
 */
export function SwipeHint({ enabled }: Props) {
  if (!enabled) return null

  return (
    <div className="swipe-hint" aria-hidden="true">
      <div className="swipe-hint-card">
        <span className="swipe-arrow" />
        <p>上にスワイプで次のニュース</p>
      </div>
    </div>
  )
}
