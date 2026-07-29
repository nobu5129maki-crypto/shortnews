import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'myline.textScale.v1'

/** Relative scale applied to title and body text on slides */
export const TEXT_SCALE_STEPS = [0.9, 1, 1.15, 1.3, 1.5] as const

export type TextScale = (typeof TEXT_SCALE_STEPS)[number]

const DEFAULT_SCALE: TextScale = 1.15

function nearestStep(value: number): TextScale {
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

function stepIndex(scale: number): number {
  const nearest = nearestStep(scale)
  return TEXT_SCALE_STEPS.indexOf(nearest)
}

function readScale(): TextScale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SCALE
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return DEFAULT_SCALE
    return nearestStep(parsed)
  } catch {
    return DEFAULT_SCALE
  }
}

export function useTextScale() {
  const [scale, setScale] = useState<TextScale>(() => {
    if (typeof window === 'undefined') return DEFAULT_SCALE
    return readScale()
  })

  useEffect(() => {
    setScale(readScale())
  }, [])

  const persist = useCallback((next: TextScale) => {
    setScale(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* ignore quota / private mode */
    }
  }, [])

  const index = stepIndex(scale)
  const canDecrease = index > 0
  const canIncrease = index >= 0 && index < TEXT_SCALE_STEPS.length - 1

  const decrease = useCallback(() => {
    setScale((current) => {
      const currentIndex = stepIndex(current)
      if (currentIndex <= 0) return nearestStep(current)
      const next = TEXT_SCALE_STEPS[currentIndex - 1]
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const increase = useCallback(() => {
    setScale((current) => {
      const currentIndex = stepIndex(current)
      if (currentIndex < 0 || currentIndex >= TEXT_SCALE_STEPS.length - 1) {
        return nearestStep(current)
      }
      const next = TEXT_SCALE_STEPS[currentIndex + 1]
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return {
    scale,
    canDecrease,
    canIncrease,
    decrease,
    increase,
    persist,
  }
}
