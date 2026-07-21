import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameBoardProps } from '../../engine/types'
import { generateQueens, queensConflicts } from './queens'

// 0 = empty, 1 = X mark, 2 = queen
interface QueensState {
  marks: number[]
  undo: { idx: number; prev: number }[]
}

const REGION_COLORS = [
  '#bcd6f2', '#f9e2ae', '#cde8c5', '#f2c4c4', '#dcd0f0', '#f7d4ae', '#c6e6e8',
]

export default function QueensBoard({
  seed,
  level,
  savedState,
  mistakeHighlight,
  onStateChange,
  onUsedHint,
  onSolved,
}: GameBoardProps) {
  const puzzle = useMemo(() => generateQueens(seed, level), [seed, level])
  const { n, regions, solution } = puzzle

  const [state, setState] = useState<QueensState>(() => {
    const s = savedState as QueensState | undefined
    if (s && Array.isArray(s.marks) && s.marks.length === n * n) return { marks: s.marks, undo: s.undo ?? [] }
    return { marks: new Array(n * n).fill(0), undo: [] }
  })
  const solvedRef = useRef(false)

  const queens = state.marks.map((m, i) => (m === 2 ? i : -1)).filter((i) => i >= 0)
  const conflicts = mistakeHighlight ? queensConflicts(n, regions, queens) : new Set<number>()

  useEffect(() => {
    onStateChange(state)
    if (!solvedRef.current && queens.length === n) {
      const solved = solution.every((c, r) => state.marks[r * n + c] === 2)
      if (solved) {
        solvedRef.current = true
        onSolved()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const tap = (idx: number) => {
    if (solvedRef.current) return
    setState((s) => ({
      marks: s.marks.map((v, i) => (i === idx ? (v + 1) % 3 : v)),
      undo: [...s.undo, { idx, prev: s.marks[idx] }],
    }))
  }

  const handleUndo = () => {
    setState((s) => {
      if (s.undo.length === 0) return s
      const last = s.undo[s.undo.length - 1]
      return {
        marks: s.marks.map((v, i) => (i === last.idx ? last.prev : v)),
        undo: s.undo.slice(0, -1),
      }
    })
  }

  const handleHint = () => {
    if (solvedRef.current) return
    const target = solution.map((c, r) => r * n + c).find((idx) => state.marks[idx] !== 2)
    if (target === undefined) return
    onUsedHint()
    setState((s) => ({
      marks: s.marks.map((v, i) => (i === target ? 2 : v)),
      undo: [...s.undo, { idx: target, prev: s.marks[target] }],
    }))
  }

  return (
    <div className="board-wrap">
      <div className="grid queens-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, maxWidth: 420 }}>
        {state.marks.map((m, i) => {
          const r = Math.floor(i / n)
          const c = i % n
          const reg = regions[i]
          const borders = [
            c + 1 < n && regions[i + 1] !== reg ? 'reg-right' : '',
            r + 1 < n && regions[i + n] !== reg ? 'reg-bottom' : '',
          ].join(' ')
          return (
            <button
              key={i}
              className={`cell queens-cell ${borders} ${conflicts.has(i) ? 'wrong' : ''}`}
              style={{ background: REGION_COLORS[reg % REGION_COLORS.length] }}
              onClick={() => tap(i)}
            >
              {m === 2 ? '👑' : m === 1 ? <span className="xmark">✕</span> : ''}
            </button>
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
      <p className="hint-text">Tap once for ✕, twice for 👑</p>
    </div>
  )
}
