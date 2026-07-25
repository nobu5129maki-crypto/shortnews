import { formatCount } from '../utils/format'

type Props = {
  likes: number
  comments: number
  liked: boolean
  saved: boolean
  onLike: () => void
  onSave: () => void
  onShare: () => void
}

export function ActionRail({
  likes,
  comments,
  liked,
  saved,
  onLike,
  onSave,
  onShare,
}: Props) {
  return (
    <aside className="action-rail" aria-label="アクション">
      <button
        type="button"
        className={`action-btn${liked ? ' is-liked' : ''}`}
        onClick={onLike}
        aria-pressed={liked}
        aria-label="いいね"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s-7.2-4.35-9.6-8.4C.6 9.3 2.1 5.7 5.4 5.1c1.8-.3 3.6.5 4.6 1.9 1-1.4 2.8-2.2 4.6-1.9 3.3.6 4.8 4.2 3 7.5C19.2 16.65 12 21 12 21z"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        <span>{formatCount(likes + (liked ? 1 : 0))}</span>
      </button>

      <button type="button" className="action-btn" aria-label="コメント">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        <span>{formatCount(comments)}</span>
      </button>

      <button
        type="button"
        className={`action-btn${saved ? ' is-saved' : ''}`}
        onClick={onSave}
        aria-pressed={saved}
        aria-label="保存"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1z"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        <span>保存</span>
      </button>

      <button type="button" className="action-btn" onClick={onShare} aria-label="共有">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4v10M8 8l4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>共有</span>
      </button>
    </aside>
  )
}
