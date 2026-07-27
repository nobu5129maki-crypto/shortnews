import { useEffect, useState } from 'react'
import type { NewsItem } from '../types'
import { formatRelativeTime } from '../utils/format'

type Props = {
  item: NewsItem
  open: boolean
  onClose: () => void
}

export function DetailPanel({ item, open, onClose }: Props) {
  const [visible, setVisible] = useState(open)

  useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!visible) return null

  return (
    <div
      className={`detail-overlay${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onAnimationEnd={() => {
        if (!open) setVisible(false)
      }}
    >
      <button type="button" className="detail-backdrop" aria-label="閉じる" onClick={onClose} />
      <div className="detail-sheet">
        <div className="detail-handle" aria-hidden="true" />
        <header className="detail-header">
          <div>
            <p className="detail-ai-badge">詳細</p>
            <h2 id="detail-title">{item.title}</h2>
          </div>
          <button type="button" className="detail-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <div className="detail-body">
          <h3 className="detail-section-title">全体の詳細</h3>
          <p className="detail-text">{item.detail}</p>

          <p className="detail-source">
            {item.source} · {formatRelativeTime(item.publishedAt)}
          </p>
          {item.url && (
            <a
              className="detail-link"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              元記事を読む
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
