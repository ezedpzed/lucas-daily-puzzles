import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { GameBoardProps } from '../../engine/types'
import { generateNonogram } from './nonogram'

// 0 empty, 1 filled, 2 X mark
interface NonogramState {
  marks: number[]
  undo: { idx: number; prev: number }[]
}

export default function NonogramBoard({
  seed,
  level,
  savedState,
  mistakeHighlight,
  onStateChange,
  onUsedHint,
  onSolved,
}: GameBoardProps) {
  const puzzle = useMemo(() => generateNonogram(seed, level), [seed, level])
  const { n, rows, cols, solution, picture } = puzzle

  const [state, setState] = useState<NonogramState>(() => {
    const s = savedState as NonogramState | undefined
    if (s && Array.isArray(s.marks) && s.marks.length === n * n) return { marks: s.marks, undo: s.undo ?? [] }
    return { marks: new Array(n * n).fill(0), undo: [] }
  })
  const [revealed, setRevealed] = useState(false)
  const solvedRef = useRef(false)

  useEffect(() => {
    onStateChange(state)
    if (!solvedRef.current && solution.every((v, i) => (state.marks[i] === 1) === v)) {
      solvedRef.current = true
      setRevealed(true)
      // short beat so he sees the finished picture before the celebration
      setTimeout(onSolved, picture ? 1400 : 300)
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
    const target = solution.findIndex((v, i) => (state.marks[i] === 1) !== v)
    if (target === -1) return
    onUsedHint()
    setState((s) => ({
      marks: s.marks.map((v, i) => (i === target ? (solution[target] ? 1 : 2) : v)),
      undo: [...s.undo, { idx: target, prev: s.marks[target] }],
    }))
  }

  const isWrong = (i: number) => mistakeHighlight && state.marks[i] === 1 && !solution[i]

  return (
    <div className="board-wrap">
      <div className="nono-layout" style={{ gridTemplateColumns: `auto repeat(${n}, 1fr)`, maxWidth: 440 }}>
        <div />
        {cols.map((clue, c) => (
          <div key={`c${c}`} className="nono-clue nono-clue-col">
            {clue.map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
        ))}
        {Array.from({ length: n }, (_, r) => (
          <Fragment key={`row${r}`}>
            <div className="nono-clue nono-clue-row">
              {rows[r].join(' ')}
            </div>
            {Array.from({ length: n }, (_, c) => {
              const i = r * n + c
              return (
                <button
                  key={i}
                  className={`nono-cell ${state.marks[i] === 1 ? 'filled' : ''} ${isWrong(i) ? 'wrong' : ''}`}
                  onClick={() => tap(i)}
                >
                  {state.marks[i] === 2 ? '✕' : ''}
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>
      {revealed && picture && (
        <p className="nono-reveal">
          It's {picture.name}! {picture.emoji}
        </p>
      )}
      <div className="toolbar">
        <button className="tool-btn" onClick={handleUndo} disabled={state.undo.length === 0}>
          ↩ Undo
        </button>
        <button className="tool-btn" onClick={handleHint}>
          💡 Hint
        </button>
      </div>
      <p className="hint-text">Numbers show runs of filled squares · tap for ⬛, twice for ✕</p>
    </div>
  )
}
