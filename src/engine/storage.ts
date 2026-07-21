import { dayKey, yesterdayKey } from './daily'

// All persistence is localStorage on this device (see PRD §9).

export interface GameDayRecord {
  level: number
  startedAt?: number
  state?: unknown
  done?: boolean
  timeMs?: number
  hints: number
  stars?: number
}

export type DayRecord = Record<string, GameDayRecord>

export interface LevelInfo {
  level: number
  clean: number // clean (hint-free) solves toward the next level-up
}

export interface Meta {
  streak: number
  bestStreak: number
  lastAllDoneDay: string | null
  totalSolved: number
  levels: Record<string, LevelInfo>
  settings: {
    pin: string
    mistakeHighlight: boolean
    enabled: Record<string, boolean>
  }
}

const META_KEY = 'ldp:meta'
const DAY_PREFIX = 'ldp:day:'
const CLEAN_SOLVES_PER_LEVEL = 10

function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function setJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadMeta(gameIds: string[]): Meta {
  const meta = getJSON<Meta>(META_KEY, {
    streak: 0,
    bestStreak: 0,
    lastAllDoneDay: null,
    totalSolved: 0,
    levels: {},
    settings: { pin: '1234', mistakeHighlight: true, enabled: {} },
  })
  for (const id of gameIds) {
    if (!meta.levels[id]) meta.levels[id] = { level: 1, clean: 0 }
    if (meta.settings.enabled[id] === undefined) meta.settings.enabled[id] = true
  }
  return meta
}

export function saveMeta(meta: Meta) {
  setJSON(META_KEY, meta)
}

export function loadDay(day: string = dayKey()): DayRecord {
  return getJSON<DayRecord>(DAY_PREFIX + day, {})
}

export function saveDay(rec: DayRecord, day: string = dayKey()) {
  setJSON(DAY_PREFIX + day, rec)
}

export function starsFor(hints: number): number {
  if (hints === 0) return 3
  if (hints <= 2) return 2
  return 1
}

/** Called when a single puzzle is solved: updates totals and the difficulty ramp. */
export function recordSolve(meta: Meta, gameId: string, hints: number, maxLevel: number): Meta {
  const next = structuredClone(meta)
  next.totalSolved += 1
  const li = next.levels[gameId] ?? { level: 1, clean: 0 }
  if (hints === 0) {
    li.clean += 1
    if (li.clean >= CLEAN_SOLVES_PER_LEVEL && li.level < maxLevel) {
      li.level += 1
      li.clean = 0
    }
  } else if (hints >= 3) {
    li.clean = Math.max(0, li.clean - 1)
  }
  next.levels[gameId] = li
  return next
}

/** Called when the whole daily set is complete: updates the streak once per day. */
export function recordAllDone(meta: Meta, day: string = dayKey()): Meta {
  if (meta.lastAllDoneDay === day) return meta
  const next = structuredClone(meta)
  next.streak = meta.lastAllDoneDay === yesterdayKey() ? meta.streak + 1 : 1
  next.bestStreak = Math.max(next.streak, meta.bestStreak)
  next.lastAllDoneDay = day
  return next
}

export function resetToday(day: string = dayKey()) {
  localStorage.removeItem(DAY_PREFIX + day)
}

export function resetAll() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('ldp:')) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}
