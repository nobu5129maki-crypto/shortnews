import { useEffect, useMemo, useRef, useState } from 'react'
import { genres } from '../data/news'
import type { ContentGenreId, FeedTabId, NewsItem } from '../types'
import { useActiveSlide } from '../hooks/useActiveSlide'
import { useLiveNews } from '../hooks/useLiveNews'
import { formatClock } from '../utils/format'
import { DetailPanel } from './DetailPanel'
import { GenreBar } from './GenreBar'
import { GenreEditor } from './GenreEditor'
import { GenreSearch } from './GenreSearch'
import { NewsSlide } from './NewsSlide'
import { SwipeHint } from './SwipeHint'

type DetailFocus = 'overview' | string

type Props = {
  myGenres: ContentGenreId[]
  onAddGenre: (id: ContentGenreId) => void
  onRemoveGenre: (id: ContentGenreId) => void
}

export function Feed({ myGenres, onAddGenre, onRemoveGenre }: Props) {
  const feedRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<FeedTabId>('mine')
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [showHint, setShowHint] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<NewsItem | null>(null)
  const [detailFocus, setDetailFocus] = useState<DetailFocus>('overview')
  const { items: liveItems, updatedAt, loading, refreshing, error, source, refresh } =
    useLiveNews(myGenres)

  const myGenreSet = useMemo(() => new Set(myGenres), [myGenres])

  const barGenres = useMemo(
    () => genres.filter((genre) => myGenreSet.has(genre.id)),
    [myGenreSet],
  )

  const items = useMemo(() => {
    if (myGenres.length === 0) return []
    if (tab === 'mine') {
      return liveItems.filter((item) => myGenreSet.has(item.genre))
    }
    return liveItems.filter((item) => item.genre === tab)
  }, [tab, myGenreSet, liveItems, myGenres.length])

  const activeIndex = useActiveSlide(feedRef, items.length)
  const detailOpen = detailItem !== null

  useEffect(() => {
    if (tab !== 'mine' && !myGenreSet.has(tab)) {
      setTab('mine')
    }
  }, [tab, myGenreSet])

  useEffect(() => {
    const node = feedRef.current
    if (!node) return
    node.scrollTo({ top: 0 })
  }, [tab, myGenres])

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
    node.style.overflowY = detailOpen || editorOpen ? 'hidden' : 'auto'
  }, [detailOpen, editorOpen])

  useEffect(() => {
    const node = feedRef.current
    if (!node || editorOpen || detailOpen) return

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
  }, [activeIndex, items.length, editorOpen, detailOpen])

  const onTabChange = (id: FeedTabId) => {
    setTab(id)
    setShowHint(true)
    setDetailItem(null)
  }

  const openDetail = (item: NewsItem, focus: DetailFocus) => {
    setDetailItem(item)
    setDetailFocus(focus)
  }

  return (
    <div className="app-shell">
      <header className="chrome">
        <div className="chrome-row">
          <div className="brand-block">
            <p className="brand">BRIEF</p>
            <p className="brand-sub">YOUR NEWS</p>
          </div>
          <div className="top-actions">
            <div className="top-action-row">
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
            {myGenres.length === 0 ? 'READY' : source === 'live' ? 'LIVE' : 'DEMO'}
          </span>
        </div>

        {barGenres.length > 0 ? (
          <GenreBar genres={barGenres} active={tab} onChange={onTabChange} />
        ) : (
          <p className="genre-bar-empty">検索してマイジャンルを追加してください</p>
        )}
      </header>

      <div ref={feedRef} className="feed" aria-label="マイニュースフィード">
        {myGenres.length === 0 ? (
          <div className="empty-state empty-state-search">
            <h2 className="empty-title">マイジャンルは空です</h2>
            <p className="empty-lead">興味のあるジャンルを検索して追加すると、そのRSSが流れます。</p>
            <GenreSearch myGenres={myGenres} onAdd={onAddGenre} autofocus />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>
              {loading
                ? '選択したジャンルのニュースを取得中です'
                : 'このジャンルのニュースはまだありません'}
            </p>
            {!loading && (
              <button type="button" className="empty-cta" onClick={() => setEditorOpen(true)}>
                ジャンルを追加
              </button>
            )}
          </div>
        ) : (
          items.map((item, index) => (
            <NewsSlide
              key={`${tab}-${item.id}`}
              item={item}
              index={index}
              isActive={index === activeIndex}
              liked={Boolean(liked[item.id])}
              saved={Boolean(saved[item.id])}
              detailOpen={detailOpen && detailItem?.id === item.id}
              onLike={() =>
                setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
              }
              onSave={() =>
                setSaved((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
              }
              onOpenDetail={(focus) => openDetail(item, focus)}
            />
          ))
        )}
      </div>

      <SwipeHint
        visible={showHint && items.length > 1 && !editorOpen && !detailOpen}
      />

      <GenreEditor
        open={editorOpen}
        selected={myGenres}
        onClose={() => setEditorOpen(false)}
        onAdd={onAddGenre}
        onRemove={onRemoveGenre}
      />

      {detailItem && (
        <DetailPanel
          item={detailItem}
          open={detailOpen}
          focus={detailFocus}
          onClose={() => setDetailItem(null)}
          onFocusChange={setDetailFocus}
        />
      )}
    </div>
  )
}
