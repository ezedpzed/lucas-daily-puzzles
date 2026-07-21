import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameBoardProps } from '../../engine/types'
import { generateZip } from './zip'

interface ZipState {
  path: number[] // ordered cell indices, always starting at waypoint 1
}

export default function ZipBoard({
  seed,
  level,
  savedState,
  onStateChange,
  onUsedHint,
  onSolved,
}: GameBoardProps) {
  const puzzle = useMemo(() => generateZip(seed, level), [seed, level])
  const { n, waypoints, solution } = puzzle
  const total = n * n
  const wpOrder = useMemo(() => {
    const m = new Map<number, number>()
    waypoints.forEach((cell, k) => m.set(cell, k))
    return m
  }, [waypoints])

  const [state, setState] = useState<ZipState>(() => {
    const s = savedState as ZipState | undefined
    if (s && Array.isArray(s.path) && s.path[0] === waypoints[0]) return { path: s.path }
    return { path: [waypoints[0]] }
  })
  const [shake, setShake] = useState(false)
  const solvedRef = useRef(false)
  const dragging = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onStateChange(state)
    if (!solvedRef.current && state.path.length === total && state.path[state.path.length - 1] === waypoints[waypoints.length - 1]) {
      solvedRef.current = true
      onSolved()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const adjacent = (a: number, b: number) => {
    const ar = Math.floor(a / n), ac = a % n
    const br = Math.floor(b / n), bc = b % n
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1
  }

  const nextWaypointNeeded = (path: number[]) => {
    let next = 1
    for (const cell of path) {
      if (wpOrder.get(cell) === next) next++
    }
    return next
  }

  const tryExtend = (idx: number) => {
    if (solvedRef.current) return
    setState((s) => {
      const path = s.path
      const pos = path.indexOf(idx)
      if (pos >= 0) return { path: path.slice(0, pos + 1) } // drag back = truncate
      const head = path[path.length - 1]
      if (!adjacent(head, idx)) return s
      const w = wpOrder.get(idx)
      if (w !== undefined) {
        const need = nextWaypointNeeded(path)
        if (w !== need || (w === waypoints.length - 1 && path.length + 1 !== total)) {
          setShake(true)
          setTimeout(() => setShake(false), 350)
          return s
        }
      }
      return { path: [...path, idx] }
    })
  }

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    const idx = el?.closest('[data-cell]')?.getAttribute('data-cell')
    return idx != null ? Number(idx) : null
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    const idx = cellFromPoint(e.clientX, e.clientY)
    if (idx !== null) tryExtend(idx)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const idx = cellFromPoint(e.clientX, e.clientY)
    if (idx !== null) tryExtend(idx)
  }
  const stopDrag = () => (dragging.current = false)

  const handleUndo = () => {
    setState((s) => (s.path.length > 1 ? { path: s.path.slice(0, -1) } : s))
  }

  const handleHint = () => {
    if (solvedRef.current) return
    onUsedHint()
    setState((s) => {
      // longest prefix of the player's path matching the unique solution
      let match = 0
      while (match < s.path.length && s.path[match] === solution[match]) match++
      if (match < s.path.length) return { path: solution.slice(0, match) } // diverged: trim back
      return { path: solution.slice(0, Math.min(s.path.length + 1, total)) } // on track: reveal next
    })
  }

  const inPath = new Set(state.path)
  const cellSize = 100 / n

  return (
    <div className="board-wrap">
      <div
        ref={gridRef}
        className={`zip-grid ${shake ? 'shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, maxWidth: 420, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        {Array.from({ length: total }, (_, i) => {
          const w = wpOrder.get(i)
          const isHead = state.path[state.path.length - 1] === i
          return (
            <div
              key={i}
              data-cell={i}
              className={`zip-cell ${inPath.has(i) ? 'zip-visited' : ''} ${isHead ? 'zip-head' : ''}`}
            >
              {w !== undefined && <span className="zip-wp">{w + 1}</span>}
            </div>
          )
        })}
        <svg className="zip-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {state.path.length > 1 && (
            <polyline
              points={state.path
                .map((c) => `${(c % n) * cellSize + cellSize / 2},${Math.floor(c / n) * cellSize + cellSize / 2}`)
                .join(' ')}
              fill="none"
              stroke="#0a66c2"
              strokeWidth={cellSize * 0.35}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.55"
            />
          )}
        </svg>
      </div>
      <div className="toolbar">
        <button className="tool-btn" onClick={handleUndo} disabled={state.path.length <= 1}>
          ↩ Undo
        </button>
        <button className="tool-btn" onClick={handleHint}>
          💡 Hint
        </button>
      </div>
      <p className="hint-text">Drag from 1 through every square, in number order</p>
    </div>
  )
}
