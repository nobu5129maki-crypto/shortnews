import type { Genre, GenreId } from '../types'

type Props = {
  index: number
  isActive: boolean
  currentLabel: string
  articleCount: number
  otherGenres: Array<{
    genre: Genre
    count: number
    hasNew: boolean
  }>
  onSelectGenre: (id: GenreId) => void
  onRefresh: () => void
  refreshing: boolean
}

export function LaneContinue({
  index,
  isActive,
  currentLabel,
  articleCount,
  otherGenres,
  onSelectGenre,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <section
      className={`lane-continue${isActive ? ' is-active' : ''}`}
      data-slide
      data-index={index}
      aria-hidden={!isActive}
      aria-label={`${currentLabel}の続き`}
    >
      <div className="lane-continue-inner">
        <p className="lane-continue-kicker">LANE END</p>
        <h2 className="lane-continue-title">
          {articleCount > 0
            ? `${currentLabel}はここまで`
            : `${currentLabel}のニュースはまだありません`}
        </h2>
        <p className="lane-continue-copy">
          {otherGenres.length > 0
            ? 'ほかのジャンルへ進むか、最新を取り直してください。'
            : '設定でジャンルを増やすと、スワイプできる記事が増えます。'}
        </p>

        {otherGenres.length > 0 && (
          <div className="lane-continue-genres" role="list">
            {otherGenres.map(({ genre, count, hasNew }) => (
              <button
                key={genre.id}
                type="button"
                role="listitem"
                className={`lane-continue-chip${hasNew ? ' has-new' : ''}`}
                onClick={() => onSelectGenre(genre.id)}
              >
                {hasNew && <span className="genre-new-dot" aria-hidden="true" />}
                <span className="lane-continue-chip-label">{genre.label}</span>
                <span className="lane-continue-chip-count">{count}本</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className={`lane-continue-refresh${refreshing ? ' is-busy' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? '更新中…' : '最新を取得'}
        </button>
      </div>
    </section>
  )
}
