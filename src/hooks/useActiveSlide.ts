import { useEffect, useRef, useState, type RefObject } from 'react'

export function useActiveSlide(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
  resetKey: string | number = '',
  initialIndex = 0,
) {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(itemCount - 1, 0))),
  )
  const initialIndexRef = useRef(initialIndex)
  const itemCountRef = useRef(itemCount)
  initialIndexRef.current = initialIndex
  itemCountRef.current = itemCount

  // タブ切替など resetKey 変化時だけ着地。既読更新や記事追加では飛ばさない
  useEffect(() => {
    const count = itemCountRef.current
    const clamped = Math.max(
      0,
      Math.min(initialIndexRef.current, Math.max(count - 1, 0)),
    )
    setActiveIndex(clamped)
  }, [resetKey])

  // 記事数が減ったときだけ現在位置をクランプ（増えたときは読書位置を維持）
  useEffect(() => {
    setActiveIndex((prev) => {
      if (itemCount <= 0) return 0
      return Math.min(prev, itemCount - 1)
    })
  }, [itemCount])

  useEffect(() => {
    const root = containerRef.current
    if (!root || itemCount === 0) return

    const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'))
    if (slides.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visible) return
        const index = Number((visible.target as HTMLElement).dataset.index)
        if (!Number.isNaN(index)) setActiveIndex(index)
      },
      { root, threshold: [0.55, 0.7, 0.85] },
    )

    slides.forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [containerRef, itemCount, resetKey])

  return activeIndex
}
