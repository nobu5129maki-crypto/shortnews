type Props = {
  scale: number
  canDecrease: boolean
  canIncrease: boolean
  onDecrease: () => void
  onIncrease: () => void
}

export function TextScaleControl({
  scale,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: Props) {
  const percent = Math.round(scale * 100)

  return (
    <div className="text-scale" role="group" aria-label="文字サイズ">
      <button
        type="button"
        className="text-scale-btn"
        onClick={onDecrease}
        disabled={!canDecrease}
        aria-label="文字を小さく"
      >
        A−
      </button>
      <span className="text-scale-value" aria-live="polite">
        {percent}%
      </span>
      <button
        type="button"
        className="text-scale-btn is-large"
        onClick={onIncrease}
        disabled={!canIncrease}
        aria-label="文字を大きく"
      >
        A＋
      </button>
    </div>
  )
}
