import { useEffect, useState } from 'react'
import { genres } from '../data/news'
import type { ContentGenreId } from '../types'
import { GenrePicker } from './GenrePicker'

type Props = {
  open: boolean
  selected: ContentGenreId[]
  onClose: () => void
  onSave: (selected: ContentGenreId[]) => boolean
}

export function GenreEditor({ open, selected, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<ContentGenreId[]>(selected)

  useEffect(() => {
    if (open) setDraft(selected)
  }, [open, selected])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggle = (id: ContentGenreId) => {
    setDraft((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }

  const save = () => {
    if (onSave(draft)) onClose()
  }

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <button type="button" className="editor-backdrop" aria-label="閉じる" onClick={onClose} />
      <div className="editor-sheet">
        <div className="editor-handle" aria-hidden="true" />
        <header className="editor-header">
          <div>
            <h2 id="editor-title">マイジャンル</h2>
            <p>追加・削除してフィードをカスタム</p>
          </div>
          <button type="button" className="editor-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <GenrePicker catalog={genres} selected={draft} onToggle={toggle} />

        <div className="editor-actions">
          <button type="button" className="editor-cancel" onClick={onClose}>
            キャンセル
          </button>
          <button
            type="button"
            className="setup-cta"
            disabled={draft.length === 0}
            onClick={save}
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  )
}
