import type { Genre, GenreId } from '../types'

type Props = {
  genres: Genre[]
  active: GenreId
  newGenreIds?: Set<GenreId>
  onChange: (id: GenreId) => void
}

export function GenreBar({ genres, active, newGenreIds, onChange }: Props) {
  return (
    <div className="genre-bar" role="tablist" aria-label="ジャンル">
      {genres.map((genre) => {
        const isActive = genre.id === active
        const hasNew = Boolean(newGenreIds?.has(genre.id)) && !isActive
        return (
          <button
            key={genre.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={hasNew ? `${genre.label}（新着あり）` : genre.label}
            className={`genre-chip${isActive ? ' is-active' : ''}${hasNew ? ' has-new' : ''}`}
            onClick={(event) => {
              event.preventDefault()
              onChange(genre.id)
            }}
          >
            {hasNew && <span className="genre-new-dot" aria-hidden="true" />}
            {genre.label}
          </button>
        )
      })}
    </div>
  )
}
