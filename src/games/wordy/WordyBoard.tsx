import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameBoardProps } from '../../engine/types'
import { answerFor, scoreGuess, type LetterState } from './wordy'

interface WordyState {
  guesses: string[]
  current: string
  revealed: number[] // positions revealed by hints
}

const BASE_ROWS = 6
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

export default function WordyBoard({
  seed,
  level,
  savedState,
  onStateChange,
  onUsedHint,
  onSolved,
}: GameBoardProps) {
  const answer = useMemo(() => answerFor(seed, level), [seed, level])
  const len = answer.length

  const [state, setState] = useState<WordyState>(() => {
    const s = savedState as WordyState | undefined
    if (s && Array.isArray(s.guesses)) return { guesses: s.guesses, current: s.current ?? '', revealed: s.revealed ?? [] }
    return { guesses: [], current: '', revealed: [] }
  })
  const [shake, setShake] = useState(false)
  const solvedRef = useRef(state.guesses.includes(answer))

  useEffect(() => {
    onStateChange(state)
    if (!solvedRef.current && state.guesses.includes(answer)) {
      solvedRef.current = true
      setTimeout(onSolved, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // physical keyboard support (Chromebook!)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') press('ENTER')
      else if (e.key === 'Backspace') press('⌫')
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const press = (key: string) => {
    if (solvedRef.current) return
    if (key === 'ENTER') {
      if (state.current.length !== len) {
        setShake(true)
        setTimeout(() => setShake(false), 350)
        return
      }
      // rows beyond the standard six each cost a hint (never a fail state)
      if (state.guesses.length >= BASE_ROWS) onUsedHint()
      setState((s) => ({ ...s, guesses: [...s.guesses, s.current], current: '' }))
    } else if (key === '⌫') {
      setState((s) => ({ ...s, current: s.current.slice(0, -1) }))
    } else if (state.current.length < len) {
      setState((s) => ({ ...s, current: s.current + key }))
    }
  }

  const handleHint = () => {
    if (solvedRef.current) return
    const pos = Array.from({ length: len }, (_, i) => i).find((i) => !state.revealed.includes(i))
    if (pos === undefined) return
    onUsedHint()
    setState((s) => ({ ...s, revealed: [...s.revealed, pos] }))
  }

  // best-known state per letter for the keyboard
  const keyStates = useMemo(() => {
    const rank = { absent: 0, present: 1, correct: 2 }
    const m = new Map<string, LetterState>()
    for (const g of state.guesses) {
      const score = scoreGuess(g, answer)
      for (let i = 0; i < len; i++) {
        const prev = m.get(g[i])
        if (!prev || rank[score[i]] > rank[prev]) m.set(g[i], score[i])
      }
    }
    return m
  }, [state.guesses, answer, len])

  const rowCount = Math.max(BASE_ROWS, state.guesses.length + (solvedRef.current ? 0 : 1))

  return (
    <div className="board-wrap">
      {state.revealed.length > 0 && (
        <p className="wordy-reveal">
          {Array.from({ length: len }, (_, i) =>
            state.revealed.includes(i) ? answer[i] : '·',
          ).join(' ')}
        </p>
      )}
      <div className="wordy-rows">
        {Array.from({ length: rowCount }, (_, r) => {
          const guess = state.guesses[r]
          const isCurrent = r === state.guesses.length
          const score = guess ? scoreGuess(guess, answer) : null
          return (
            <div key={r} className={`wordy-row ${isCurrent && shake ? 'shake' : ''}`}>
              {Array.from({ length: len }, (_, i) => (
                <div
                  key={i}
                  className={`wordy-tile ${score ? score[i] : isCurrent && state.current[i] ? 'typed' : ''}`}
                >
                  {guess ? guess[i] : isCurrent ? (state.current[i] ?? '') : ''}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div className="wordy-kb">
        {KEY_ROWS.map((row, r) => (
          <div key={r} className="wordy-kb-row">
            {r === 2 && (
              <button className="wordy-key wide" onClick={() => press('ENTER')}>
                ✓
              </button>
            )}
            {[...row].map((k) => (
              <button key={k} className={`wordy-key ${keyStates.get(k) ?? ''}`} onClick={() => press(k)}>
                {k}
              </button>
            ))}
            {r === 2 && (
              <button className="wordy-key wide" onClick={() => press('⌫')}>
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="toolbar">
        <button className="tool-btn" onClick={handleHint}>
          💡 Hint
        </button>
      </div>
      <p className="hint-text">Guess the {len}-letter word · 🟩 right spot · 🟨 wrong spot</p>
    </div>
  )
}
