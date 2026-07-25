import type { Genre, GenreId } from '../types'

type Props = {
  genres: Genre[]
  active: GenreId
  onChange: (id: GenreId) => void
}

export function GenreBar({ genres, active, onChange }: Props) {
  return (
    <div className="genre-bar" role="tablist" aria-label="ジャンル">
      {genres.map((genre) => {
        const isActive = genre.id === active
        return (
          <button
            key={genre.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`genre-chip${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(genre.id)}
          >
            {genre.label}
          </button>
        )
      })}
    </div>
  )
}
