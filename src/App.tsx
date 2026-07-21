import { useCallback, useEffect, useState } from 'react'
import { GAMES, gameById } from './games/registry'
import {
  loadMeta,
  saveMeta,
  loadDay,
  saveDay,
  recordSolve,
  recordAllDone,
  type Meta,
  type DayRecord,
  type GameDayRecord,
} from './engine/storage'
import { dayKey } from './engine/daily'
import Home from './components/Home'
import GamePlay from './components/GamePlay'
import ParentPanel from './components/ParentPanel'

const GAME_IDS = GAMES.map((g) => g.id)

function useHashRoute(): [string, (h: string) => void] {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const fn = () => setHash(location.hash)
    window.addEventListener('hashchange', fn)
    return () => window.removeEventListener('hashchange', fn)
  }, [])
  return [hash, (h: string) => (location.hash = h)]
}

export default function App() {
  const [hash, navigate] = useHashRoute()
  const [meta, setMeta] = useState<Meta>(() => loadMeta(GAME_IDS))
  const [day, setDay] = useState<DayRecord>(() => loadDay())
  const [today, setToday] = useState(dayKey())

  // roll over at local midnight (checked when the app regains focus or every minute)
  useEffect(() => {
    const check = () => {
      const now = dayKey()
      if (now !== today) {
        setToday(now)
        setDay(loadDay(now))
        navigate('')
      }
    }
    const iv = setInterval(check, 60_000)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(iv)
      window.removeEventListener('focus', check)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const updateMeta = useCallback((m: Meta) => {
    setMeta(m)
    saveMeta(m)
  }, [])

  const updateDay = useCallback(
    (rec: DayRecord) => {
      setDay(rec)
      saveDay(rec, today)
    },
    [today],
  )

  const enabled = GAMES.filter((g) => meta.settings.enabled[g.id])

  if (hash.startsWith('#/parent')) {
    return (
      <ParentPanel
        meta={meta}
        onMetaChange={updateMeta}
        onBack={() => navigate('')}
        onDayReset={() => setDay(loadDay(today))}
      />
    )
  }

  if (hash.startsWith('#/play/')) {
    const id = hash.slice('#/play/'.length)
    const game = gameById(id)
    if (game && meta.settings.enabled[id]) {
      const rec: GameDayRecord = day[id] ?? { level: meta.levels[id].level, hints: 0 }
      const othersDone = enabled.filter((g) => g.id !== id).every((g) => day[g.id]?.done)
      return (
        <GamePlay
          key={`${id}-${today}`}
          game={game}
          record={rec}
          mistakeHighlight={meta.settings.mistakeHighlight}
          allDoneAfterThis={othersDone}
          onRecordChange={(r) => updateDay({ ...day, [id]: r })}
          onSolvedFinal={(r) => {
            const nextDay = { ...day, [id]: r }
            updateDay(nextDay)
            let m = recordSolve(meta, id, r.hints ?? 0, game.maxLevel)
            const allDone = enabled.every((g) => nextDay[g.id]?.done)
            if (allDone) m = recordAllDone(m, today)
            updateMeta(m)
          }}
          onBack={() => navigate('')}
        />
      )
    }
  }

  return <Home meta={meta} day={day} onPlay={(id) => navigate(`#/play/${id}`)} />
}
