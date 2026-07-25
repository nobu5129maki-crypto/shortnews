import { useEffect, useState, type RefObject } from 'react'

export function useActiveSlide(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
) {
  const [activeIndex, setActiveIndex] = useState(0)

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
  }, [containerRef, itemCount])

  return activeIndex
}
