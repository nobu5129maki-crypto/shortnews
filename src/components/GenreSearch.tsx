import { useMemo, useState } from 'react'
import { genres as catalog } from '../data/news'
import { normalizeGenreId, resolveGenre } from '../lib/genres'
import type { Genre, GenreId } from '../types'
import { toSearchGenreId } from '../types'

type Props = {
  myGenres: GenreId[]
  onAdd: (id: GenreId) => void
  autofocus?: boolean
  placeholder?: string
}

export function GenreSearch({
  myGenres,
  onAdd,
  autofocus = false,
  placeholder = 'ジャンルを検索',
}: Props) {
  const [query, setQuery] = useState('')

  const { catalogMatches, customOption } = useMemo(() => {
    const q = query.trim()
    if (!q) return { catalogMatches: [] as Genre[], customOption: null as Genre | null }

    const lower = q.toLowerCase()
    const matches = catalog.filter((genre) => {
      if (myGenres.includes(genre.id)) return false
      const haystack = `${genre.label} ${genre.blurb ?? ''} ${genre.id}`.toLowerCase()
      return haystack.includes(lower) || genre.label.includes(q)
    })

    const exactBuiltin = catalog.some((genre) => genre.label === q || genre.id === q)
    const customId = toSearchGenreId(q)
    const alreadyAdded =
      myGenres.includes(customId) ||
      myGenres.some((id) => resolveGenre(id).label === q)

    const custom =
      !exactBuiltin && !alreadyAdded
        ? {
            id: customId,
            label: q,
            blurb: 'このキーワードの最新ニュース',
          }
        : null

    return { catalogMatches: matches, customOption: custom }
  }, [query, myGenres])

  const add = (id: string) => {
    const normalized = normalizeGenreId(id)
    if (!normalized) return
    onAdd(normalized)
    setQuery('')
  }

  const q = query.trim()

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
        enterKeyHint="search"
        onChange={(event) => setQuery(event.target.value)}
        onFocus={(event) => {
          // Keep the caret visible without letting the snap feed fight the browser.
          event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || event.key === 'Process') return
          if (event.key === 'Enter' && q) {
            event.preventDefault()
            add(customOption?.id ?? catalogMatches[0]?.id ?? q)
          }
        }}
      />

      {q && (
        <div className="genre-search-results" role="listbox" aria-label="検索結果">
          {customOption && (
            <button
              type="button"
              className="genre-search-item is-custom"
              role="option"
              onClick={() => add(customOption.id)}
            >
              <span className="genre-search-item-label">{customOption.label}</span>
              <span className="genre-search-item-blurb">{customOption.blurb}</span>
              <span className="genre-search-item-add">追加</span>
            </button>
          )}

          {catalogMatches.map((genre) => (
            <button
              key={genre.id}
              type="button"
              className="genre-search-item"
              role="option"
              onClick={() => add(genre.id)}
            >
              <span className="genre-search-item-label">{genre.label}</span>
              <span className="genre-search-item-blurb">{genre.blurb}</span>
              <span className="genre-search-item-add">追加</span>
            </button>
          ))}

          {!customOption && catalogMatches.length === 0 && (
            <p className="genre-search-empty">すでに追加済みです</p>
          )}
        </div>
      )}
    </div>
  )
}
