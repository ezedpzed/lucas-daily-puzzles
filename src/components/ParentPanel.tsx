import { useState } from 'react'
import type { Meta } from '../engine/storage'
import { resetAll, resetToday } from '../engine/storage'
import { GAMES } from '../games/registry'

export default function ParentPanel({
  meta,
  onMetaChange,
  onBack,
  onDayReset,
}: {
  meta: Meta
  onMetaChange: (m: Meta) => void
  onBack: () => void
  onDayReset: () => void
}) {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)

  if (!unlocked) {
    return (
      <div className="page parent-page">
        <header className="play-header">
          <button className="back-btn" onClick={onBack}>‹ Back</button>
          <h2>Parent Settings</h2>
          <span />
        </header>
        <div className="pin-box">
          <p>Enter PIN</p>
          <input
            className={`pin-input ${error ? 'wrong' : ''}`}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              setPin(v)
              setError(false)
              if (v.length === 4) {
                if (v === meta.settings.pin) setUnlocked(true)
                else {
                  setError(true)
                  setPin('')
                }
              }
            }}
            autoFocus
          />
          {error && <p className="hint-text">Wrong PIN</p>}
        </div>
      </div>
    )
  }

  const update = (fn: (m: Meta) => void) => {
    const next = structuredClone(meta)
    fn(next)
    onMetaChange(next)
  }

  return (
    <div className="page parent-page">
      <header className="play-header">
        <button className="back-btn" onClick={onBack}>‹ Back</button>
        <h2>Parent Settings</h2>
        <span />
      </header>

      <section className="parent-section">
        <h3>Stats</h3>
        <p>
          Streak {meta.streak} · Best {meta.bestStreak} · Total solved {meta.totalSolved}
        </p>
      </section>

      <section className="parent-section">
        <h3>Games & difficulty</h3>
        {GAMES.map((g) => {
          const li = meta.levels[g.id]
          return (
            <div key={g.id} className="parent-row">
              <label className="parent-toggle">
                <input
                  type="checkbox"
                  checked={meta.settings.enabled[g.id]}
                  onChange={(e) => update((m) => (m.settings.enabled[g.id] = e.target.checked))}
                />
                {g.emoji} {g.name}
              </label>
              <div className="level-ctl">
                <button
                  className="tool-btn"
                  onClick={() => update((m) => (m.levels[g.id].level = Math.max(1, li.level - 1)))}
                >
                  −
                </button>
                <span>
                  L{li.level}/{g.maxLevel}
                </span>
                <button
                  className="tool-btn"
                  onClick={() => update((m) => (m.levels[g.id].level = Math.min(g.maxLevel, li.level + 1)))}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
        <p className="hint-text">Difficulty also rises automatically after 10 hint-free solves.</p>
      </section>

      <section className="parent-section">
        <h3>Options</h3>
        <label className="parent-toggle">
          <input
            type="checkbox"
            checked={meta.settings.mistakeHighlight}
            onChange={(e) => update((m) => (m.settings.mistakeHighlight = e.target.checked))}
          />
          Highlight mistakes in red
        </label>
      </section>

      <section className="parent-section">
        <h3>Danger zone</h3>
        <button
          className="tool-btn danger"
          onClick={() => {
            if (confirm("Reset today's puzzles? Progress today will be lost.")) {
              resetToday()
              onDayReset()
            }
          }}
        >
          Reset today
        </button>
        <button
          className="tool-btn danger"
          onClick={() => {
            if (confirm('Reset ALL progress, streaks, and levels? This cannot be undone.')) {
              resetAll()
              location.reload()
            }
          }}
        >
          Reset everything
        </button>
      </section>
    </div>
  )
}
