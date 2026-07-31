import { useEffect, useMemo, useRef, useState } from 'react'
import type { GenreId, NewsItem } from '../types'
import { resolveGenres } from '../lib/genres'
import { useActiveSlide } from '../hooks/useActiveSlide'
import { useGenreSeen } from '../hooks/useGenreSeen'
import { useLiveNews } from '../hooks/useLiveNews'
import { formatClock } from '../utils/format'
import { GenreBar } from './GenreBar'
import { GenreEditor } from './GenreEditor'
import { GenreSearch } from './GenreSearch'
import { LaneContinue } from './LaneContinue'
import { NewsSlide } from './NewsSlide'
import { SwipeHint } from './SwipeHint'
import { TextScaleControl } from './TextScaleControl'
import { useTextScale } from '../hooks/useTextScale'

type Props = {
  myGenres: GenreId[]
  onAddGenre: (id: GenreId) => void
  onRemoveGenre: (id: GenreId) => void
}

/** 選択中ジャンルを先頭に、他ジャンル／補完記事も続けてスワイプできる */
function buildFeedItems(tab: GenreId, liveItems: NewsItem[]): NewsItem[] {
  const primary = liveItems.filter((item) => item.genre === tab)
  const rest = liveItems.filter((item) => item.genre !== tab)
  return [...primary, ...rest]
}

export function Feed({ myGenres, onAddGenre, onRemoveGenre }: Props) {
  const feedRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<GenreId | null>(null)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [showHint, setShowHint] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const { items: liveItems, updatedAt, loading, refreshing, error, source, refresh } =
    useLiveNews(myGenres)
  const {
    scale: textScale,
    canDecrease,
    canIncrease,
    decrease,
    increase,
  } = useTextScale()

  const myGenreSet = useMemo(() => new Set(myGenres), [myGenres])
  const barGenres = useMemo(() => resolveGenres(myGenres), [myGenres])
  const activeTab = tab && myGenreSet.has(tab) ? tab : myGenres[0] ?? null

  const { newGenreIds, markGenreSeen } = useGenreSeen(myGenres, liveItems)

  const items = useMemo(() => {
    if (!activeTab || myGenres.length === 0) return []
    return buildFeedItems(activeTab, liveItems)
  }, [activeTab, liveItems, myGenres.length])

  const primaryCount = useMemo(() => {
    if (!activeTab) return 0
    return liveItems.filter((item) => item.genre === activeTab).length
  }, [liveItems, activeTab])

  const continueGenres = useMemo(() => {
    if (!activeTab) return []
    return barGenres
      .filter((genre) => genre.id !== activeTab)
      .map((genre) => ({
        genre,
        count: liveItems.filter((item) => item.genre === genre.id).length,
        hasNew: newGenreIds.has(genre.id),
      }))
      .filter((entry) => entry.count > 0 || entry.hasNew)
      .sort((a, b) => Number(b.hasNew) - Number(a.hasNew) || b.count - a.count)
  }, [barGenres, activeTab, liveItems, newGenreIds])

  const showContinue = Boolean(activeTab) && myGenres.length > 0 && !loading
  const slideCount = items.length + (showContinue ? 1 : 0)
  const activeIndex = useActiveSlide(
    feedRef,
    slideCount,
    `${activeTab ?? 'none'}:${slideCount}`,
  )

  useEffect(() => {
    if (myGenres.length === 0) {
      setTab(null)
      return
    }
    if (!tab || !myGenreSet.has(tab)) {
      setTab(myGenres[0])
    }
  }, [tab, myGenreSet, myGenres])

  useEffect(() => {
    if (!activeTab) return
    markGenreSeen(activeTab)
  }, [activeTab, liveItems, markGenreSeen])

  useEffect(() => {
    const node = feedRef.current
    if (!node) return
    node.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeTab, myGenres, items.length])

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

  const feedLocked = editorOpen || myGenres.length === 0

  useEffect(() => {
    const node = feedRef.current
    if (!node || feedLocked) return

    const goTo = (next: number) => {
      const clamped = Math.max(0, Math.min(slideCount - 1, next))
      const slide = node.querySelector<HTMLElement>(`[data-index="${clamped}"]`)
      slide?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing || event.key === 'Process') return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }

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
        const active = node.querySelector<HTMLElement>(
          `[data-index="${activeIndex}"] .video-hit`,
        )
        active?.click()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, slideCount, feedLocked])

  // 詳細パネル端までスクロールしたら、フィードの次／前へ受け渡す
  useEffect(() => {
    const feed = feedRef.current
    if (!feed || feedLocked) return

    const onWheel = (event: WheelEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const meta = target.closest('[data-slide-meta]')
      if (!(meta instanceof HTMLElement)) return

      const atTop = meta.scrollTop <= 0
      const atBottom =
        meta.scrollTop + meta.clientHeight >= meta.scrollHeight - 2
      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault()
        feed.scrollTop += event.deltaY
      }
    }

    let lastY = 0
    let tracking: HTMLElement | null = null

    const onTouchStart = (event: TouchEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const meta = target.closest('[data-slide-meta]')
      if (!(meta instanceof HTMLElement)) {
        tracking = null
        return
      }
      tracking = meta
      lastY = event.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking) return
      const y = event.touches[0]?.clientY ?? lastY
      const dy = lastY - y
      lastY = y
      const atTop = tracking.scrollTop <= 0
      const atBottom =
        tracking.scrollTop + tracking.clientHeight >= tracking.scrollHeight - 2
      if ((dy < 0 && atTop) || (dy > 0 && atBottom)) {
        event.preventDefault()
        feed.scrollTop += dy
      }
    }

    const onTouchEnd = () => {
      tracking = null
      lastY = 0
    }

    feed.addEventListener('wheel', onWheel, { passive: false })
    feed.addEventListener('touchstart', onTouchStart, { passive: true })
    feed.addEventListener('touchmove', onTouchMove, { passive: false })
    feed.addEventListener('touchend', onTouchEnd)
    feed.addEventListener('touchcancel', onTouchEnd)
    return () => {
      feed.removeEventListener('wheel', onWheel)
      feed.removeEventListener('touchstart', onTouchStart)
      feed.removeEventListener('touchmove', onTouchMove)
      feed.removeEventListener('touchend', onTouchEnd)
      feed.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [feedLocked, items.length, activeTab])

  const onTabChange = (id: GenreId) => {
    setTab(id)
    setShowHint(true)
  }

  const currentLabel =
    barGenres.find((genre) => genre.id === activeTab)?.label ?? 'このジャンル'

  return (
    <div
      className="app-shell"
      style={{ ['--slide-text-scale' as string]: String(textScale) }}
      data-text-scale={Math.round(textScale * 100)}
    >
      <header className="chrome">
        <div className="chrome-row">
          <div className="brand-block">
            <p className="brand">
              <span className="brand-lane" aria-hidden="true" />
              MYLINE
            </p>
            <p className="brand-sub">YOUR LANE</p>
          </div>
          <div className="top-actions">
            <div className="top-action-row">
              <TextScaleControl
                scale={textScale}
                canDecrease={canDecrease}
                canIncrease={canIncrease}
                onDecrease={decrease}
                onIncrease={increase}
              />
              <button
                type="button"
                className={`refresh-btn${refreshing ? ' is-busy' : ''}`}
                onClick={() => void refresh()}
                disabled={refreshing || myGenres.length === 0}
                aria-label="ニュースを更新"
              >
                {refreshing ? '更新中' : '更新'}
              </button>
              <button
                type="button"
                className="prefs-btn"
                onClick={() => setEditorOpen(true)}
                aria-label="ジャンル設定"
              >
                設定
              </button>
            </div>
            <p className="update-status" aria-live="polite">
              {myGenres.length === 0 && 'ジャンル未設定'}
              {myGenres.length > 0 && loading && !updatedAt && '取得中…'}
              {myGenres.length > 0 && !loading && updatedAt && `更新 ${formatClock(updatedAt)}`}
              {error && <span className="update-error">更新失敗</span>}
            </p>
          </div>
        </div>

        <div className="chrome-meta">
          <span className="live-pill" aria-label="最新">
            <span className="live-dot" />
            {myGenres.length === 0 ? 'READY' : source === 'fallback' ? 'DEMO' : 'LIVE'}
          </span>
        </div>

        {barGenres.length > 0 && activeTab && (
          <GenreBar
            genres={barGenres}
            active={activeTab}
            newGenreIds={newGenreIds}
            onChange={onTabChange}
          />
        )}
      </header>

      <div
        ref={feedRef}
        key={`feed-${activeTab ?? 'empty'}`}
        className={`feed${feedLocked ? ' is-static' : ''}`}
        aria-label="ニュースフィード"
      >
        {myGenres.length === 0 ? (
          <div className="empty-state empty-state-search">
            <GenreSearch myGenres={myGenres} onAdd={onAddGenre} autofocus />
          </div>
        ) : items.length === 0 && !showContinue ? (
          <div className="empty-state">
            <p>
              {loading
                ? 'ニュースを取得中です'
                : 'このジャンルのニュースはまだありません'}
            </p>
            {!loading && (
              <button type="button" className="empty-cta" onClick={() => setEditorOpen(true)}>
                設定
              </button>
            )}
          </div>
        ) : (
          <>
            {items.map((item, index) => (
              <NewsSlide
                key={`${activeTab}-${item.id}`}
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
            ))}
            {showContinue && activeTab && (
              <LaneContinue
                index={items.length}
                isActive={activeIndex === items.length}
                currentLabel={currentLabel}
                articleCount={primaryCount}
                otherGenres={continueGenres}
                onSelectGenre={onTabChange}
                onRefresh={() => void refresh()}
                refreshing={refreshing}
              />
            )}
          </>
        )}
      </div>

      <SwipeHint visible={showHint && items.length > 1 && !editorOpen} />

      <GenreEditor
        open={editorOpen}
        selected={myGenres}
        onClose={() => setEditorOpen(false)}
        onAdd={onAddGenre}
        onRemove={onRemoveGenre}
      />
    </div>
  )
}
