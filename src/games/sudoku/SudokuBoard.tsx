import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameBoardProps } from '../../engine/types'
import { generateSudoku } from './sudoku'
import { randInt, makeRng } from '../../engine/rng'

interface SudokuState {
  entries: number[] // 0 = empty; includes givens as-is for simplicity
  undo: { idx: number; prev: number }[]
}

export default function SudokuBoard({
  seed,
  level,
  savedState,
  mistakeHighlight,
  onStateChange,
  onUsedHint,
  onSolved,
}: GameBoardProps) {
  const puzzle = useMemo(() => generateSudoku(seed, level), [seed, level])
  const { n, givens, solution, boxW, boxH } = puzzle

  const [state, setState] = useState<SudokuState>(() => {
    const s = savedState as SudokuState | undefined
    if (s && Array.isArray(s.entries) && s.entries.length === n * n) return { entries: s.entries, undo: s.undo ?? [] }
    return { entries: givens.slice(), undo: [] }
  })
  const [selected, setSelected] = useState<number | null>(null)
  const solvedRef = useRef(false)

  useEffect(() => {
    onStateChange(state)
    if (!solvedRef.current && state.entries.every((v, i) => v === solution[i])) {
      solvedRef.current = true
      onSolved()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const setCell = (idx: number, val: number) => {
    if (givens[idx] !== 0 || solvedRef.current) return
    setState((s) => ({
      entries: s.entries.map((v, i) => (i === idx ? val : v)),
      undo: [...s.undo, { idx, prev: s.entries[idx] }],
    }))
  }

  const handleUndo = () => {
    setState((s) => {
      if (s.undo.length === 0) return s
      const last = s.undo[s.undo.length - 1]
      return {
        entries: s.entries.map((v, i) => (i === last.idx ? last.prev : v)),
        undo: s.undo.slice(0, -1),
      }
    })
  }

  const handleHint = () => {
    if (solvedRef.current) return
    // prefer the selected cell if it's empty/wrong, else a random unsolved cell
    let target = selected
    if (target === null || givens[target] !== 0 || state.entries[target] === solution[target]) {
      const wrong = state.entries.map((v, i) => (givens[i] === 0 && v !== solution[i] ? i : -1)).filter((i) => i >= 0)
      if (wrong.length === 0) return
      target = wrong[randInt(makeRng(`${seed}-hint-${state.undo.length}`), wrong.length)]
    }
    onUsedHint()
    setCell(target, solution[target])
    setSelected(target)
  }

  const isWrong = (idx: number) =>
    mistakeHighlight && givens[idx] === 0 && state.entries[idx] !== 0 && state.entries[idx] !== solution[idx]

  return (
    <div className="board-wrap">
      <div
        className="grid sudoku-grid"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, maxWidth: n === 4 ? 320 : 420 }}
      >
        {state.entries.map((v, i) => {
          const r = Math.floor(i / n)
          const c = i % n
          const cls = [
            'cell',
            givens[i] !== 0 ? 'given' : '',
            selected === i ? 'selected' : '',
            isWrong(i) ? 'wrong' : '',
            c % boxW === boxW - 1 && c !== n - 1 ? 'box-right' : '',
            r % boxH === boxH - 1 && r !== n - 1 ? 'box-bottom' : '',
          ].join(' ')
          return (
            <button key={i} className={cls} onClick={() => setSelected(i)}>
              {v !== 0 ? v : ''}
            </button>
          )
        })}
      </div>
      <div className="numpad">
        {Array.from({ length: n }, (_, i) => i + 1).map((v) => (
          <button key={v} className="numpad-btn" onClick={() => selected !== null && setCell(selected, v)}>
            {v}
          </button>
        ))}
        <button className="numpad-btn erase" onClick={() => selected !== null && setCell(selected, 0)}>
          ⌫
        </button>
      </div>
      <div className="toolbar">
        <button className="tool-btn" onClick={handleUndo} disabled={state.undo.length === 0}>
          ↩ Undo
        </button>
        <button className="tool-btn" onClick={handleHint}>
          💡 Hint
        </button>
      </div>
    </div>
  )
}
