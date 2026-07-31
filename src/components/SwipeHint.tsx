type Props = {
  visible: boolean
}

export function SwipeHint({ visible }: Props) {
  if (!visible) return null

  return (
    <div className="swipe-hint" aria-hidden="true">
      <div className="swipe-hint-card">
        <span className="swipe-arrow" />
        <p>上にスワイプで次のニュース</p>
      </div>
    </div>
  )
}
