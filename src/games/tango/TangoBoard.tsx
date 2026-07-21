import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameBoardProps } from '../../engine/types'
import { generateTango, tangoViolations } from './tango'

interface TangoState {
  grid: number[]
  undo: { idx: number; prev: number }[]
}

const SYMBOL = ['', '☀️', '🌙']

export default function TangoBoard({
  seed,
  level,
  savedState,
  mistakeHighlight,
  onStateChange,
  onUsedHint,
  onSolved,
}: GameBoardProps) {
  const puzzle = useMemo(() => generateTango(seed, level), [seed, level])
  const { n, givens, solution, constraints } = puzzle

  const [state, setState] = useState<TangoState>(() => {
    const s = savedState as TangoState | undefined
    if (s && Array.isArray(s.grid) && s.grid.length === n * n) return { grid: s.grid, undo: s.undo ?? [] }
    return { grid: givens.slice(), undo: [] }
  })
  const solvedRef = useRef(false)

  const violations = mistakeHighlight ? tangoViolations(state.grid, n, constraints) : new Set<number>()

  useEffect(() => {
    onStateChange(state)
    if (!solvedRef.current && state.grid.every((v, i) => v === solution[i])) {
      solvedRef.current = true
      onSolved()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const tap = (idx: number) => {
    if (givens[idx] !== 0 || solvedRef.current) return
    setState((s) => ({
      grid: s.grid.map((v, i) => (i === idx ? (v + 1) % 3 : v)),
      undo: [...s.undo, { idx, prev: s.grid[idx] }],
    }))
  }

  const handleUndo = () => {
    setState((s) => {
      if (s.undo.length === 0) return s
      const last = s.undo[s.undo.length - 1]
      return {
        grid: s.grid.map((v, i) => (i === last.idx ? last.prev : v)),
        undo: s.undo.slice(0, -1),
      }
    })
  }

  const handleHint = () => {
    if (solvedRef.current) return
    const target = state.grid.findIndex((v, i) => givens[i] === 0 && v !== solution[i])
    if (target === -1) return
    onUsedHint()
    setState((s) => ({
      grid: s.grid.map((v, i) => (i === target ? solution[target] : v)),
      undo: [...s.undo, { idx: target, prev: s.grid[target] }],
    }))
  }

  const pctMid = (v: number) => `${((v + 0.5) / n) * 100}%`
  const pctEdge = (v: number) => `${(v / n) * 100}%`

  return (
    <div className="board-wrap">
      <div
        className="grid tango-grid"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, maxWidth: n === 4 ? 320 : 420, position: 'relative' }}
      >
        {state.grid.map((v, i) => (
          <button
            key={i}
            className={`cell tango-cell ${givens[i] !== 0 ? 'given' : ''} ${violations.has(i) ? 'wrong' : ''}`}
            onClick={() => tap(i)}
          >
            {SYMBOL[v]}
          </button>
        ))}
        {constraints.map((con, k) => {
          const horizontal = con.b === con.a + 1
          const r = Math.floor(con.a / n)
          const c = con.a % n
          return (
            <span
              key={k}
              className="tango-link"
              style={
                horizontal
                  ? { left: pctEdge(c + 1), top: pctMid(r) }
                  : { left: pctMid(c), top: pctEdge(r + 1) }
              }
            >
              {con.eq ? '=' : '×'}
            </span>
          )
        })}
      </div>
      <div className="toolbar">
        <button className="tool-btn" onClick={handleUndo} disabled={state.undo.length === 0}>
          ↩ Undo
        </button>
        <button className="tool-btn" onClick={handleHint}>
          💡 Hint
        </button>
      </div>
      <p className="hint-text">Tap for ☀️, tap again for 🌙 · = must match, × must differ</p>
    </div>
  )
}
