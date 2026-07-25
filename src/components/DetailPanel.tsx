import { useEffect, useState } from 'react'
import type { NewsItem, RelatedTopic } from '../types'
import { formatRelativeTime } from '../utils/format'

type Focus = 'overview' | string

type Props = {
  item: NewsItem
  open: boolean
  focus: Focus
  onClose: () => void
  onFocusChange: (focus: Focus) => void
}

export function DetailPanel({ item, open, focus, onClose, onFocusChange }: Props) {
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

  const related: RelatedTopic | undefined =
    focus === 'overview' ? undefined : item.related.find((topic) => topic.id === focus)

  const body = related?.detail ?? item.detail
  const heading = related ? related.label : 'AI詳細'

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
            <p className="detail-ai-badge">AI要約ベース</p>
            <h2 id="detail-title">{item.title}</h2>
          </div>
          <button type="button" className="detail-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <div className="detail-tabs" role="tablist" aria-label="詳しく見る">
          <button
            type="button"
            role="tab"
            aria-selected={focus === 'overview'}
            className={`detail-tab${focus === 'overview' ? ' is-active' : ''}`}
            onClick={() => onFocusChange('overview')}
          >
            全体の詳細
          </button>
          {item.related.map((topic) => (
            <button
              key={topic.id}
              type="button"
              role="tab"
              aria-selected={focus === topic.id}
              className={`detail-tab${focus === topic.id ? ' is-active' : ''}`}
              onClick={() => onFocusChange(topic.id)}
            >
              {topic.label}
            </button>
          ))}
        </div>

        <div className="detail-body">
          <h3 className="detail-section-title">{heading}</h3>
          <p className="detail-text">{body}</p>

          {focus === 'overview' && (
            <ul className="detail-points">
              {item.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}

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
