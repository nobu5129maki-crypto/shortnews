import { useState } from 'react'
import { genres } from '../data/news'
import type { ContentGenreId } from '../types'
import { GenrePicker } from './GenrePicker'

type Props = {
  onComplete: (selected: ContentGenreId[]) => void
}

export function GenreSetup({ onComplete }: Props) {
  const [selected, setSelected] = useState<ContentGenreId[]>(['ai', 'tech', 'business'])

  const toggle = (id: ContentGenreId) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }

  return (
    <div className="setup-shell">
      <div className="setup-atmosphere" aria-hidden="true" />
      <header className="setup-brand">
        <p className="brand">BRIEF</p>
        <p className="brand-sub">YOUR NEWS</p>
      </header>

      <main className="setup-main">
        <h1 className="setup-title">興味のあるジャンルを選ぶ</h1>
        <p className="setup-lead">選んだジャンルだけが、あなたのフィードになります。</p>

        <GenrePicker catalog={genres} selected={selected} onToggle={toggle} />
      </main>

      <footer className="setup-footer">
        <p className="setup-count">{selected.length}ジャンル選択中</p>
        <button
          type="button"
          className="setup-cta"
          disabled={selected.length === 0}
          onClick={() => onComplete(selected)}
        >
          はじめる
        </button>
      </footer>
    </div>
  )
}
