import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameBoardProps } from '../../engine/types'
import { generatePatches, rectArea, rectCells, rectsOverlap, shapeOf, type Rect } from './patches'

interface PatchesState {
  rects: Rect[]
  undo: { added?: Rect; removed: Rect[] }[]
}

const PATCH_COLORS = [
  'rgba(10, 102, 194, 0.25)',
  'rgba(255, 179, 0, 0.30)',
  'rgba(102, 187, 106, 0.30)',
  'rgba(171, 71, 188, 0.22)',
  'rgba(239, 83, 80, 0.24)',
  'rgba(38, 166, 154, 0.28)',
]

const sameRect = (a: Rect, b: Rect) =>
  a.r0 === b.r0 && a.c0 === b.c0 && a.r1 === b.r1 && a.c1 === b.c1

export default function PatchesBoard({
  seed,
  level,
  savedState,
  onStateChange,
  onUsedHint,
  onSolved,
}: GameBoardProps) {
  const puzzle = useMemo(() => generatePatches(seed, level), [seed, level])
  const { n, clues, solution } = puzzle
  const total = n * n
  const clueAt = useMemo(() => {
    const m = new Map<number, number>()
    clues.forEach((c, i) => m.set(c.cell, i))
    return m
  }, [clues])

  const [state, setState] = useState<PatchesState>(() => {
    const s = savedState as PatchesState | undefined
    if (s && Array.isArray(s.rects)) return { rects: s.rects, undo: s.undo ?? [] }
    return { rects: [], undo: [] }
  })
  const [preview, setPreview] = useState<Rect | null>(null)
  const [shake, setShake] = useState(false)
  const solvedRef = useRef(false)
  const anchor = useRef<number | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    onStateChange(state)
    const covered = state.rects.reduce((sum, r) => sum + rectArea(r), 0)
    if (!solvedRef.current && covered === total) {
      solvedRef.current = true
      onSolved()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const bounds = (a: number, b: number): Rect => ({
    r0: Math.min(Math.floor(a / n), Math.floor(b / n)),
    r1: Math.max(Math.floor(a / n), Math.floor(b / n)),
    c0: Math.min(a % n, b % n),
    c1: Math.max(a % n, b % n),
  })

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    const idx = el?.closest('[data-cell]')?.getAttribute('data-cell')
    return idx != null ? Number(idx) : null
  }

  const reject = () => {
    setShake(true)
    setTimeout(() => setShake(false), 350)
  }

  const commit = (rect: Rect) => {
    // a valid patch holds exactly one number, covers exactly that many
    // squares, and matches the clue's shape hint if it has one
    const inside = rectCells(rect, n).filter((cel) => clueAt.has(cel))
    const clue = inside.length === 1 ? clues[clueAt.get(inside[0])!] : null
    if (!clue || clue.size !== rectArea(rect) || (clue.shape && clue.shape !== shapeOf(rect))) {
      reject()
      return
    }
    setState((s) => {
      const removed = s.rects.filter((r) => rectsOverlap(r, rect))
      const kept = s.rects.filter((r) => !rectsOverlap(r, rect))
      return { rects: [...kept, rect], undo: [...s.undo, { added: rect, removed }] }
    })
  }

  const removeAt = (cell: number) => {
    setState((s) => {
      const r = Math.floor(cell / n)
      const c = cell % n
      const hit = s.rects.find((rc) => r >= rc.r0 && r <= rc.r1 && c >= rc.c0 && c <= rc.c1)
      if (!hit) return s
      return { rects: s.rects.filter((rc) => rc !== hit), undo: [...s.undo, { removed: [hit] }] }
    })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (solvedRef.current) return
    const idx = cellFromPoint(e.clientX, e.clientY)
    if (idx === null) return
    anchor.current = idx
    moved.current = false
    setPreview(bounds(idx, idx))
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (anchor.current === null) return
    const idx = cellFromPoint(e.clientX, e.clientY)
    if (idx === null || idx === anchor.current) return
    moved.current = true
    setPreview(bounds(anchor.current, idx))
  }
  const onPointerUp = () => {
    if (anchor.current === null) return
    const rect = preview
    const tap = !moved.current
    const cell = anchor.current
    anchor.current = null
    setPreview(null)
    if (solvedRef.current) return
    if (tap) removeAt(cell)
    else if (rect) commit(rect)
  }

  const handleUndo = () => {
    setState((s) => {
      if (s.undo.length === 0) return s
      const last = s.undo[s.undo.length - 1]
      let rects = s.rects
      if (last.added) rects = rects.filter((r) => !sameRect(r, last.added!))
      return { rects: [...rects, ...last.removed], undo: s.undo.slice(0, -1) }
    })
  }

  const handleHint = () => {
    if (solvedRef.current) return
    const missing = solution.findIndex((sr) => !state.rects.some((r) => sameRect(r, sr)))
    if (missing === -1) return
    onUsedHint()
    const rect = solution[missing]
    setState((s) => {
      const removed = s.rects.filter((r) => rectsOverlap(r, rect))
      const kept = s.rects.filter((r) => !rectsOverlap(r, rect))
      return { rects: [...kept, rect], undo: [...s.undo, { added: rect, removed }] }
    })
  }

  const pct = (v: number) => `${(v / n) * 100}%`
  const colorFor = (rect: Rect): string => {
    const inside = rectCells(rect, n).find((cel) => clueAt.has(cel))
    return PATCH_COLORS[(inside !== undefined ? clueAt.get(inside)! : 0) % PATCH_COLORS.length]
  }

  return (
    <div className="board-wrap">
      <div
        className={`patches-grid ${shake ? 'shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, maxWidth: 420, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {Array.from({ length: total }, (_, i) => {
          const clue = clueAt.has(i) ? clues[clueAt.get(i)!] : null
          return (
            <div key={i} data-cell={i} className="patches-cell">
              {clue && (
                <span className="patches-clue">
                  {clue.size}
                  {clue.shape && <span className={`shape-glyph shape-${clue.shape}`} />}
                </span>
              )}
            </div>
          )
        })}
        {state.rects.map((r, i) => (
          <div
            key={`r${i}`}
            className="patches-rect"
            style={{
              left: pct(r.c0),
              top: pct(r.r0),
              width: pct(r.c1 - r.c0 + 1),
              height: pct(r.r1 - r.r0 + 1),
              background: colorFor(r),
            }}
          />
        ))}
        {preview && (
          <div
            className="patches-rect preview"
            style={{
              left: pct(preview.c0),
              top: pct(preview.r0),
              width: pct(preview.c1 - preview.c0 + 1),
              height: pct(preview.r1 - preview.r0 + 1),
            }}
          />
        )}
      </div>
      <div className="toolbar">
        <button className="tool-btn" onClick={handleUndo} disabled={state.undo.length === 0}>
          ↩ Undo
        </button>
        <button className="tool-btn" onClick={handleHint}>
          💡 Hint
        </button>
      </div>
      <p className="hint-text">Drag to draw a patch · tap a patch to remove it</p>
    </div>
  )
}
