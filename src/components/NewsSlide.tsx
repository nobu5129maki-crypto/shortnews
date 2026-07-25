import { useEffect, useRef, useState } from 'react'
import type { NewsItem } from '../types'
import { genres } from '../data/news'
import { formatRelativeTime } from '../utils/format'
import { ActionRail } from './ActionRail'

type DetailFocus = 'overview' | string

type Props = {
  item: NewsItem
  index: number
  isActive: boolean
  liked: boolean
  saved: boolean
  detailOpen: boolean
  onLike: () => void
  onSave: () => void
  onOpenDetail: (focus: DetailFocus) => void
}

export function NewsSlide({
  item,
  index,
  isActive,
  liked,
  saved,
  detailOpen,
  onLike,
  onSave,
  onOpenDetail,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const genreLabel = genres.find((g) => g.id === item.genre)?.label ?? item.genre

  useEffect(() => {
    setVideoFailed(false)
    setVideoReady(false)
    setProgress(0)
    setPaused(false)
  }, [item.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video || videoFailed) return

    const shouldPlay = isActive && !paused && !detailOpen
    if (shouldPlay) {
      const playPromise = video.play()
      if (playPromise) playPromise.catch(() => undefined)
    } else {
      video.pause()
      if (!isActive) {
        video.currentTime = 0
        setProgress(0)
        setPaused(false)
      }
    }
  }, [isActive, paused, videoFailed, detailOpen])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isActive || videoFailed) return

    const onTime = () => {
      if (!video.duration) return
      setProgress(video.currentTime / video.duration)
    }

    video.addEventListener('timeupdate', onTime)
    return () => video.removeEventListener('timeupdate', onTime)
  }, [isActive, videoFailed])

  const togglePause = () => {
    if (!isActive || detailOpen) return
    setPaused((value) => !value)
  }

  const share = async () => {
    const shareData = {
      title: item.title,
      text: `${item.title} — ${item.summary}`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${item.title}\n${window.location.href}`)
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <article
      className={`news-slide${isActive ? ' is-active' : ''}${videoFailed ? ' is-fallback' : ''}`}
      data-slide
      data-index={index}
      aria-hidden={!isActive}
    >
      <button
        type="button"
        className="video-hit"
        onClick={togglePause}
        aria-label={paused ? '再生' : '一時停止'}
      >
        <img
          className={`slide-poster${videoReady && !videoFailed ? ' is-hidden' : ''}`}
          src={item.posterUrl}
          alt=""
          draggable={false}
        />
        {!videoFailed && (
          <video
            ref={videoRef}
            className={`slide-video${videoReady ? ' is-ready' : ''}`}
            src={item.videoUrl}
            muted
            playsInline
            loop
            preload={isActive || index < 2 ? 'auto' : 'metadata'}
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          />
        )}
        <div className="slide-scrim" aria-hidden="true" />
        {paused && isActive && !detailOpen && (
          <span className="pause-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 6v12l10-6-10-6z" fill="currentColor" />
            </svg>
          </span>
        )}
      </button>

      <div className="slide-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${videoFailed ? (isActive ? 1 : 0) : progress})` }} />
      </div>

      <div className="slide-meta">
        <div className="meta-top">
          <span className="genre-tag">{genreLabel}</span>
          <span className="ai-badge">AI要約</span>
          <span className="meta-time">{formatRelativeTime(item.publishedAt)}</span>
        </div>
        <h2 className="slide-title">{item.title}</h2>
        <p className="slide-summary">{item.summary}</p>

        <div className="related-row" aria-label="関連トピック">
          <button
            type="button"
            className="related-btn is-primary"
            onClick={() => onOpenDetail('overview')}
          >
            詳しく
          </button>
          {item.related.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="related-btn"
              onClick={() => onOpenDetail(topic.id)}
            >
              {topic.label}
            </button>
          ))}
        </div>

        <p className="slide-source">{item.source}</p>
      </div>

      <ActionRail
        likes={item.likes}
        comments={item.comments}
        liked={liked}
        saved={saved}
        onLike={onLike}
        onSave={onSave}
        onShare={share}
      />
    </article>
  )
}
