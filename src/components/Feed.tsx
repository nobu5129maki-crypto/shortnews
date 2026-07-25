import { useEffect, useMemo, useRef, useState } from 'react'
import { genres, newsItems } from '../data/news'
import type { GenreId } from '../types'
import { useActiveSlide } from '../hooks/useActiveSlide'
import { GenreBar } from './GenreBar'
import { NewsSlide } from './NewsSlide'
import { SwipeHint } from './SwipeHint'

export function Feed() {
  const feedRef = useRef<HTMLDivElement>(null)
  const [genre, setGenre] = useState<GenreId>('all')
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [showHint, setShowHint] = useState(true)

  const items = useMemo(
    () =>
      genre === 'all'
        ? newsItems
        : newsItems.filter((item) => item.genre === genre),
    [genre],
  )

  const activeIndex = useActiveSlide(feedRef, items.length)

  useEffect(() => {
    const node = feedRef.current
    if (!node) return
    node.scrollTo({ top: 0 })
  }, [genre])

  useEffect(() => {
    if (!showHint) return
    const timer = window.setTimeout(() => setShowHint(false), 3200)
    return () => window.clearTimeout(timer)
  }, [showHint])

  useEffect(() => {
    const node = feedRef.current
    if (!node || !showHint) return

    const hide = () => setShowHint(false)
    node.addEventListener('scroll', hide, { once: true })
    return () => node.removeEventListener('scroll', hide)
  }, [showHint])

  useEffect(() => {
    const node = feedRef.current
    if (!node) return

    const goTo = (next: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, next))
      const slide = node.querySelector<HTMLElement>(`[data-index="${clamped}"]`)
      slide?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'j') {
        event.preventDefault()
        goTo(activeIndex + 1)
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'k') {
        event.preventDefault()
        goTo(activeIndex - 1)
      }
      if (event.key === ' ') {
        event.preventDefault()
        const active = node.querySelector<HTMLButtonElement>(
          `[data-index="${activeIndex}"] .video-hit`,
        )
        active?.click()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, items.length])

  const onGenreChange = (id: GenreId) => {
    setGenre(id)
    setShowHint(true)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <p className="brand">BRIEF</p>
          <p className="brand-sub">短尺ニュース</p>
        </div>
        <span className="live-pill" aria-label="最新">
          <span className="live-dot" />
          LIVE
        </span>
      </header>

      <GenreBar genres={genres} active={genre} onChange={onGenreChange} />

      <div
        ref={feedRef}
        className="feed"
        aria-label="ニュースフィード"
      >
        {items.length === 0 ? (
          <div className="empty-state">
            <p>このジャンルのニュースはまだありません</p>
          </div>
        ) : (
          items.map((item, index) => (
            <NewsSlide
              key={`${genre}-${item.id}`}
              item={item}
              index={index}
              isActive={index === activeIndex}
              liked={Boolean(liked[item.id])}
              saved={Boolean(saved[item.id])}
              onLike={() =>
                setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
              }
              onSave={() =>
                setSaved((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
              }
            />
          ))
        )}
      </div>

      <SwipeHint visible={showHint && items.length > 1} />

      <footer className="feed-footer" aria-hidden="true">
        <span>
          {items.length === 0 ? '0' : activeIndex + 1} / {items.length}
        </span>
      </footer>
    </div>
  )
}
