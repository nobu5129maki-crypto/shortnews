import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { NewsItem } from '../types'
import { resolveGenre } from '../lib/genres'
import { formatRelativeTime } from '../utils/format'
import { ActionRail } from './ActionRail'

type Props = {
  item: NewsItem
  index: number
  isActive: boolean
  liked: boolean
  saved: boolean
  textScale: number
  onLike: () => void
  onSave: () => void
}

export function NewsSlide({
  item,
  index,
  isActive,
  liked,
  saved,
  textScale,
  onLike,
  onSave,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const genreLabel = resolveGenre(item.genre).label
  const showKeyPoints =
    item.keyPoints.length > 0 &&
    !item.keyPoints.every(
      (point) =>
        item.detail.includes(point) || item.detail.includes(`${point}。`),
    )

  useEffect(() => {
    setVideoFailed(false)
    setVideoReady(false)
    setProgress(0)
    setPaused(false)
  }, [item.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video || videoFailed) return

    const shouldPlay = isActive && !paused
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
  }, [isActive, paused, videoFailed])

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
    if (!isActive) return
    setPaused((value) => !value)
  }

  const share = async () => {
    const shareData = {
      title: item.title,
      text: `${item.title} — ${item.detail}`,
      url: item.url || window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(
          `${item.title}\n${item.url || window.location.href}`,
        )
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
      <div
        className="video-hit"
        role="button"
        tabIndex={isActive ? 0 : -1}
        onClick={togglePause}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            togglePause()
          }
        }}
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
        <div className="slide-read-band" aria-hidden="true" />
        {paused && isActive && (
          <span className="pause-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 6v12l10-6-10-6z" fill="currentColor" />
            </svg>
          </span>
        )}
      </div>

      <div className="slide-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${videoFailed ? (isActive ? 1 : 0) : progress})` }} />
      </div>

      <div
        className="slide-meta"
        style={{ '--slide-text-scale': String(textScale) } as CSSProperties}
      >
        <div className="meta-top">
          <span className="genre-tag">{genreLabel}</span>
          <span className="meta-time">{formatRelativeTime(item.publishedAt)}</span>
        </div>
        <h2 className="slide-title">{item.title}</h2>
        {showKeyPoints && (
          <ul className="slide-points">
            {item.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
        <p className="slide-detail">{item.detail}</p>
        {item.related.length > 0 && (
          <div className="slide-related">
            <p className="slide-related-label">関連ポイント</p>
            {item.related.map((topic) => (
              <div key={topic.id} className="slide-related-item">
                <p className="slide-related-title">{topic.label}</p>
                <p className="slide-related-detail">{topic.detail}</p>
              </div>
            ))}
          </div>
        )}
        <p className="slide-source">{item.source}</p>
        {item.url && (
          <a
            className="slide-link"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            元記事を読む
          </a>
        )}
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
