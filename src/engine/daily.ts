// Day keys use the device's local date; a new puzzle set appears at local midnight.

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function yesterdayKey(d: Date = new Date()): string {
  const y = new Date(d)
  y.setDate(y.getDate() - 1)
  return dayKey(y)
}

export function puzzleSeed(gameId: string, day: string, level: number): string {
  return `${gameId}-${day}-L${level}`
}

export function friendlyDate(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
