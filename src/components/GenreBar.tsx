import type { FeedTabId, Genre } from '../types'

type Props = {
  genres: Genre[]
  active: FeedTabId
  onChange: (id: FeedTabId) => void
}

export function GenreBar({ genres, active, onChange }: Props) {
  return (
    <div className="genre-bar" role="tablist" aria-label="マイジャンル">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'mine'}
        className={`genre-chip${active === 'mine' ? ' is-active' : ''}`}
        onClick={() => onChange('mine')}
      >
        マイ
      </button>
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
