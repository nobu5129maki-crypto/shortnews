type Props = {
  enabled: boolean
  /** 上にまだ新しい記事がある */
  canGoNewer: boolean
  /** 下に過去記事がある */
  canGoOlder: boolean
}

/**
 * 上スワイプ＝最新方向、下スワイプ＝過去方向。
 */
export function SwipeHint({ enabled, canGoNewer, canGoOlder }: Props) {
  if (!enabled) return null

  let message = 'スワイプで記事を移動'
  if (canGoNewer && canGoOlder) {
    message = '上スワイプで最新 / 下スワイプで過去'
  } else if (canGoNewer) {
    message = '上にスワイプで最新の記事'
  } else if (canGoOlder) {
    message = '下にスワイプで過去の記事'
  } else {
    return null
  }

  return (
    <div className="swipe-hint" aria-hidden="true">
      <div className="swipe-hint-card">
        <span className={`swipe-arrow${canGoOlder && !canGoNewer ? ' is-down' : ''}`} />
        <p>{message}</p>
      </div>
    </div>
  )
}
