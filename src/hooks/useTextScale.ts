import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'myline.textScale.v1'

/** Relative scale applied to title and body text on slides */
export const TEXT_SCALE_STEPS = [0.9, 1, 1.15, 1.3, 1.5] as const

export type TextScale = (typeof TEXT_SCALE_STEPS)[number]

const DEFAULT_SCALE: TextScale = 1.15

function clampScale(value: number): TextScale {
  let best: TextScale = DEFAULT_SCALE
  let bestDiff = Number.POSITIVE_INFINITY
  for (const step of TEXT_SCALE_STEPS) {
    const diff = Math.abs(step - value)
    if (diff < bestDiff) {
      best = step
      bestDiff = diff
    }
  }
  return best
}

function readScale(): TextScale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SCALE
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return DEFAULT_SCALE
    return clampScale(parsed)
  } catch {
    return DEFAULT_SCALE
  }
}

export function useTextScale() {
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState<TextScale>(DEFAULT_SCALE)

  useEffect(() => {
    setScale(readScale())
    setReady(true)
  }, [])

  const persist = useCallback((next: TextScale) => {
    setScale(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* ignore quota / private mode */
    }
  }, [])

  const canDecrease = scale > TEXT_SCALE_STEPS[0]
  const canIncrease = scale < TEXT_SCALE_STEPS[TEXT_SCALE_STEPS.length - 1]

  const decrease = useCallback(() => {
    const index = TEXT_SCALE_STEPS.indexOf(scale)
    if (index <= 0) return
    persist(TEXT_SCALE_STEPS[index - 1])
  }, [persist, scale])

  const increase = useCallback(() => {
    const index = TEXT_SCALE_STEPS.indexOf(scale)
    if (index < 0 || index >= TEXT_SCALE_STEPS.length - 1) return
    persist(TEXT_SCALE_STEPS[index + 1])
  }, [persist, scale])

  return {
    ready,
    scale,
    canDecrease,
    canIncrease,
    decrease,
    increase,
  }
}
