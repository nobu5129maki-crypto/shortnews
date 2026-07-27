import { useMemo, useState } from 'react'
import { genres } from '../data/news'
import type { ContentGenreId } from '../types'

type Props = {
  myGenres: ContentGenreId[]
  onAdd: (id: ContentGenreId) => void
  autofocus?: boolean
  placeholder?: string
}

export function GenreSearch({
  myGenres,
  onAdd,
  autofocus = false,
  placeholder = 'ジャンルを検索（例: AI、経済）',
}: Props) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const available = genres.filter((genre) => !myGenres.includes(genre.id))
    if (!q) return available
    return available.filter((genre) => {
      const haystack = `${genre.label} ${genre.blurb} ${genre.id}`.toLowerCase()
      return haystack.includes(q) || genre.label.includes(query.trim())
    })
  }, [query, myGenres])

  return (
    <div className="genre-search">
      <label className="genre-search-label" htmlFor="genre-search-input">
        ジャンル検索
      </label>
      <input
        id="genre-search-input"
        className="genre-search-input"
        type="search"
        value={query}
        autoFocus={autofocus}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="genre-search-results" role="listbox" aria-label="検索結果">
        {results.length === 0 ? (
          <p className="genre-search-empty">
            {query.trim()
              ? '一致するジャンルがありません'
              : '追加できるジャンルはありません'}
          </p>
        ) : (
          results.map((genre) => (
            <button
              key={genre.id}
              type="button"
              className="genre-search-item"
              role="option"
              onClick={() => {
                onAdd(genre.id)
                setQuery('')
              }}
            >
              <span className="genre-search-item-label">{genre.label}</span>
              <span className="genre-search-item-blurb">{genre.blurb}</span>
              <span className="genre-search-item-add">追加</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
