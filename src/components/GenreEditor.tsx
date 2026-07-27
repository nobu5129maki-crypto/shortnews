import { useEffect } from 'react'
import { genres } from '../data/news'
import type { ContentGenreId } from '../types'
import { GenreSearch } from './GenreSearch'

type Props = {
  open: boolean
  selected: ContentGenreId[]
  onClose: () => void
  onAdd: (id: ContentGenreId) => void
  onRemove: (id: ContentGenreId) => void
}

export function GenreEditor({
  open,
  selected,
  onClose,
  onAdd,
  onRemove,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const mine = genres.filter((genre) => selected.includes(genre.id))

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <button type="button" className="editor-backdrop" aria-label="閉じる" onClick={onClose} />
      <div className="editor-sheet">
        <div className="editor-handle" aria-hidden="true" />
        <header className="editor-header">
          <div>
            <h2 id="editor-title">マイジャンル</h2>
            <p>検索して追加。不要なものは削除できます</p>
          </div>
          <button type="button" className="editor-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <section className="editor-mine" aria-label="登録中のジャンル">
          {mine.length === 0 ? (
            <p className="editor-mine-empty">まだジャンルがありません。下で検索して追加してください。</p>
          ) : (
            <ul className="editor-mine-list">
              {mine.map((genre) => (
                <li key={genre.id}>
                  <span>{genre.label}</span>
                  <button
                    type="button"
                    className="editor-remove"
                    onClick={() => onRemove(genre.id)}
                    aria-label={`${genre.label}を削除`}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <GenreSearch myGenres={selected} onAdd={onAdd} autofocus />

        <div className="editor-actions">
          <button type="button" className="setup-cta" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
