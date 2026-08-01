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

/** 表示中ジャンルの記事だけを返す（他ジャンルを混ぜない） */
function buildFeedItems(tab: GenreId, liveItems: NewsItem[]): NewsItem[] {
  return liveItems.filter((item) => item.genre === tab)
}

/** API由来の本番記事（デモ補完は除外） */
function isLiveArticle(item: NewsItem): boolean {
  return item.id.startsWith('live-')
}

/**
 * スワイプ案内用の本数。
 * 本番記事が1本でもある場合はデモを数に入れない（「1本なのに案内が出る」を防ぐ）。
 * フォールバックのみのときはデモ本数を使う。
 */
function countSwipeNews(items: NewsItem[]): number {
  const liveCount = items.filter(isLiveArticle).length
  if (liveCount > 0) return liveCount
  return items.length
}

export function Feed({ myGenres, onAddGenre, onRemoveGenre }: Props) {
  const feedRef = useRef<HTMLDivElement>(null)
  const prevGenresRef = useRef<GenreId[]>([])
  const [tab, setTab] = useState<GenreId | null>(null)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [showHint, setShowHint] = useState(false)
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

  const { newGenreIds, unseenIdsByGenre, markItemSeen } = useGenreSeen(
    myGenres,
    liveItems,
  )

  const items = useMemo(() => {
    if (!activeTab || myGenres.length === 0) return []
    // 古い → 新しい（上スワイプで最新、下スワイプで過去）
    return buildFeedItems(activeTab, liveItems)
  }, [activeTab, liveItems, myGenres.length])

  const primaryCount = items.length

  /** タブを開いたときの着地位置：最新（未読があればその最新）。古い記事から始まらない */
  const landingIndex = useMemo(() => {
    if (items.length === 0) return 0
    if (activeTab) {
      const unseen = unseenIdsByGenre.get(activeTab)
      if (unseen && unseen.length > 0) {
        const indices = unseen
          .map((id) => items.findIndex((item) => item.id === id))
          .filter((index) => index >= 0)
        if (indices.length > 0) return Math.max(...indices)
      }
    }
    return items.length - 1
  }, [items, activeTab, unseenIdsByGenre])

  const continueGenres = useMemo(() => {
    if (!activeTab) return []
    return barGenres
      .filter((genre) => genre.id !== activeTab)
      .map((genre) => ({
        genre,
        count: liveItems.filter((item) => item.genre === genre.id).length,
        hasNew: newGenreIds.has(genre.id),
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => Number(b.hasNew) - Number(a.hasNew) || b.count - a.count)
  }, [barGenres, activeTab, liveItems, newGenreIds])

  const awaitingGenre =
    Boolean(activeTab) && items.length === 0 && (loading || refreshing)
  const showContinue =
    Boolean(activeTab) && myGenres.length > 0 && !awaitingGenre && !loading
  // 続きカードは最新のさらに先（上スワイプ方向）へ
  const slideCount = items.length + (showContinue ? 1 : 0)
  const swipeNewsCount = useMemo(() => countSwipeNews(items), [items])
  const canSwipeToNextNews =
    !loading && !awaitingGenre && !editorOpen && swipeNewsCount >= 2
  const activeIndex = useActiveSlide(
    feedRef,
    slideCount,
    // 記事IDの差し替えごとにはリセットしない（自動更新で読書位置が飛ばない）
    `${activeTab ?? 'none'}:${items.length === 0 ? 'empty' : 'ready'}`,
    landingIndex,
  )
  const canGoNewer =
    activeIndex < items.length - 1 ||
    (showContinue && activeIndex < slideCount - 1 && activeIndex >= 0)
  const canGoOlder = activeIndex > 0 && activeIndex < items.length

  // 新規ジャンル追加時はそのタブへ切替。削除時は残存ジャンルへ。
  useEffect(() => {
    const prev = prevGenresRef.current
    const added = myGenres.filter((id) => !prev.includes(id))
    prevGenresRef.current = myGenres

    if (myGenres.length === 0) {
      setTab(null)
      return
    }
    if (added.length > 0) {
      setTab(added[added.length - 1])
      return
    }
    if (!tab || !myGenreSet.has(tab)) {
      setTab(myGenres[0])
    }
  }, [myGenres, myGenreSet, tab])

  // スワイプ可能な本数が揃ってからだけ案内を出す
  useEffect(() => {
    if (!canSwipeToNextNews) {
      setShowHint(false)
      return
    }
    setShowHint(true)
  }, [activeTab, canSwipeToNextNews, swipeNewsCount])

  // 表示中のスライドを既読にする（タブを開いただけでは消さない）
  useEffect(() => {
    if (!activeTab) return
    const current = items[activeIndex]
    if (!current) return
    markItemSeen(activeTab, current.id)
  }, [activeTab, activeIndex, items, markItemSeen])

  const landedTabRef = useRef<GenreId | null>(null)

  // タブ切替（または初回の記事到着）時だけ最新側へ着地。
  // 自動更新・手動更新では読書中の過去記事から飛ばさない。
  useEffect(() => {
    const node = feedRef.current
    if (!node || !activeTab || items.length === 0) return

    const tabChanged = landedTabRef.current !== activeTab
    if (!tabChanged) return
    landedTabRef.current = activeTab

    const index = Math.max(0, Math.min(landingIndex, items.length - 1))
    if (index <= 0) {
      node.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    node
      .querySelector<HTMLElement>(`[data-index="${index}"]`)
      ?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [activeTab, items, landingIndex])

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

  // 詳細パネル上でも、端／速いスワイプならスライド単位で新旧へ移動する
  useEffect(() => {
    const feed = feedRef.current
    if (!feed || feedLocked) return

    const SWIPE_DISTANCE = 56
    const SWIPE_VELOCITY = 0.45
    const EDGE_PX = 2

    const isScrollableMeta = (meta: HTMLElement) =>
      meta.classList.contains('is-scrollable') &&
      meta.scrollHeight > meta.clientHeight + 8

    const atMetaTop = (meta: HTMLElement) => meta.scrollTop <= EDGE_PX
    const atMetaBottom = (meta: HTMLElement) =>
      meta.scrollTop + meta.clientHeight >= meta.scrollHeight - EDGE_PX

    const currentSlideIndex = () => {
      const slides = Array.from(
        feed.querySelectorAll<HTMLElement>('[data-slide]'),
      )
      if (slides.length === 0) return 0
      const mid = feed.scrollTop + feed.clientHeight / 2
      let best = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (const slide of slides) {
        const center = slide.offsetTop + slide.offsetHeight / 2
        const dist = Math.abs(center - mid)
        if (dist < bestDist) {
          bestDist = dist
          best = Number(slide.dataset.index) || 0
        }
      }
      return best
    }

    const goTo = (next: number) => {
      const clamped = Math.max(0, Math.min(slideCount - 1, next))
      const slide = feed.querySelector<HTMLElement>(`[data-index="${clamped}"]`)
      if (!slide) return
      const prevBehavior = feed.style.scrollBehavior
      feed.style.scrollBehavior = 'auto'
      slide.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        feed.style.scrollBehavior = prevBehavior
      }, 420)
    }

    let wheelLockUntil = 0
    const onWheel = (event: WheelEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const meta = target.closest('[data-slide-meta]')
      if (!(meta instanceof HTMLElement)) return
      if (!isScrollableMeta(meta)) return

      const towardNewer = event.deltaY > 0
      const towardOlder = event.deltaY < 0
      const atEdge =
        (towardOlder && atMetaTop(meta)) || (towardNewer && atMetaBottom(meta))
      if (!atEdge) return

      event.preventDefault()
      const now = performance.now()
      if (now < wheelLockUntil) return
      if (Math.abs(event.deltaY) < 8) return
      wheelLockUntil = now + 480
      goTo(currentSlideIndex() + (towardNewer ? 1 : -1))
    }

    let tracking: HTMLElement | null = null
    let startY = 0
    let lastY = 0
    let startTime = 0
    let feeding = false
    let accumulated = 0

    const onTouchStart = (event: TouchEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('a, button, [role="button"]')) {
        tracking = null
        feeding = false
        return
      }
      const meta = target.closest('[data-slide-meta]')
      if (!(meta instanceof HTMLElement) || !isScrollableMeta(meta)) {
        tracking = null
        feeding = false
        return
      }
      tracking = meta
      startY = event.touches[0]?.clientY ?? 0
      lastY = startY
      startTime = performance.now()
      feeding = false
      accumulated = 0
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking) return
      const y = event.touches[0]?.clientY ?? lastY
      const dy = lastY - y
      lastY = y
      const totalDy = startY - y
      const elapsed = Math.max(performance.now() - startTime, 1)
      const velocity = totalDy / elapsed

      // 速い／長いスワイプは本文の途中からでもフィード遷移を優先
      const flickToFeed =
        Math.abs(velocity) >= SWIPE_VELOCITY ||
        Math.abs(totalDy) >= SWIPE_DISTANCE * 1.75

      const towardNewer = dy > 0
      const towardOlder = dy < 0
      const atEdge =
        feeding ||
        flickToFeed ||
        (towardOlder && atMetaTop(tracking)) ||
        (towardNewer && atMetaBottom(tracking))

      if (!atEdge) {
        accumulated = 0
        return
      }

      // 端・フリックは詳細内スクロールを止め、フィード遷移の意図として積む
      event.preventDefault()
      feeding = true
      accumulated += dy
      const prevBehavior = feed.style.scrollBehavior
      feed.style.scrollBehavior = 'auto'
      feed.scrollTop += dy
      feed.style.scrollBehavior = prevBehavior
    }

    const finishTouch = () => {
      if (!tracking) return
      const elapsed = Math.max(performance.now() - startTime, 1)
      const totalDy = startY - lastY
      const velocity = totalDy / elapsed
      const shouldFlip =
        feeding &&
        (Math.abs(totalDy) >= SWIPE_DISTANCE ||
          Math.abs(velocity) >= SWIPE_VELOCITY ||
          Math.abs(accumulated) >= SWIPE_DISTANCE)

      if (shouldFlip) {
        const direction = totalDy > 0 || accumulated > 0 ? 1 : -1
        goTo(currentSlideIndex() + direction)
      } else if (feeding) {
        // 閾値未満は現在スライドへスナップバック
        goTo(currentSlideIndex())
      }

      tracking = null
      feeding = false
      accumulated = 0
      startY = 0
      lastY = 0
      startTime = 0
    }

    feed.addEventListener('wheel', onWheel, { passive: false })
    feed.addEventListener('touchstart', onTouchStart, { passive: true })
    feed.addEventListener('touchmove', onTouchMove, { passive: false })
    feed.addEventListener('touchend', finishTouch)
    feed.addEventListener('touchcancel', finishTouch)
    return () => {
      feed.removeEventListener('wheel', onWheel)
      feed.removeEventListener('touchstart', onTouchStart)
      feed.removeEventListener('touchmove', onTouchMove)
      feed.removeEventListener('touchend', finishTouch)
      feed.removeEventListener('touchcancel', finishTouch)
    }
  }, [feedLocked, items.length, activeTab, slideCount])

  const onTabChange = (id: GenreId) => {
    setTab(id)
  }

  const handleAddGenre = (id: GenreId) => {
    onAddGenre(id)
    setTab(id)
    setEditorOpen(false)
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
            <GenreSearch myGenres={myGenres} onAdd={handleAddGenre} autofocus />
          </div>
        ) : awaitingGenre ? (
          <div className="empty-state">
            <p>ニュースを取得中です</p>
          </div>
        ) : items.length === 0 && !showContinue ? (
          <div className="empty-state">
            <p>このジャンルのニュースはまだありません</p>
            <button type="button" className="empty-cta" onClick={() => setEditorOpen(true)}>
              設定
            </button>
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

      <SwipeHint
        enabled={showHint && canSwipeToNextNews}
        canGoNewer={canGoNewer && activeIndex < items.length}
        canGoOlder={canGoOlder}
      />

      <GenreEditor
        open={editorOpen}
        selected={myGenres}
        onClose={() => setEditorOpen(false)}
        onAdd={handleAddGenre}
        onRemove={onRemoveGenre}
      />
    </div>
  )
}
