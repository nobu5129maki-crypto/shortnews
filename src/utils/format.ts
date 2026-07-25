export function formatCount(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}千`
  return String(value)
}

export function formatRelativeTime(value: string, now = Date.now()): string {
  const time = Date.parse(value)
  if (Number.isNaN(time)) return value

  const diffSec = Math.max(0, Math.floor((now - time) / 1000))
  if (diffSec < 60) return 'たった今'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}分前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}時間前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}日前`
  return new Date(time).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatClock(value: string): string {
  const time = Date.parse(value)
  if (Number.isNaN(time)) return value
  return new Date(time).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
