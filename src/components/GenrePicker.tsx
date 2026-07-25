import type { ContentGenreId, Genre } from '../types'

type Props = {
  catalog: Genre[]
  selected: ContentGenreId[]
  onToggle: (id: ContentGenreId) => void
  minOne?: boolean
}

export function GenrePicker({ catalog, selected, onToggle, minOne = true }: Props) {
  return (
    <div className="genre-picker" role="group" aria-label="ジャンル選択">
      {catalog.map((genre) => {
        const isOn = selected.includes(genre.id)
        const locked = minOne && isOn && selected.length === 1
        return (
          <button
            key={genre.id}
            type="button"
            className={`genre-pick${isOn ? ' is-on' : ''}`}
            aria-pressed={isOn}
            disabled={locked}
            onClick={() => onToggle(genre.id)}
          >
            <span className="genre-pick-label">{genre.label}</span>
            <span className="genre-pick-blurb">{genre.blurb}</span>
            <span className="genre-pick-mark" aria-hidden="true">
              {isOn ? '✓' : '+'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
