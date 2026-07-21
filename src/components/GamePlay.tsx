import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameDef } from '../engine/types'
import type { GameDayRecord } from '../engine/storage'
import { formatTime, puzzleSeed, dayKey } from '../engine/daily'
import { starsFor } from '../engine/storage'
import Confetti from './Confetti'

export default function GamePlay({
  game,
  record,
  mistakeHighlight,
  allDoneAfterThis,
  onRecordChange,
  onSolvedFinal,
  onBack,
}: {
  game: GameDef
  record: GameDayRecord
  mistakeHighlight: boolean
  allDoneAfterThis: boolean
  onRecordChange: (rec: GameDayRecord) => void
  onSolvedFinal: (rec: GameDayRecord) => void
  onBack: () => void
}) {
  const [showHowTo, setShowHowTo] = useState(!record.state && !record.done)
  const [solvedInfo, setSolvedInfo] = useState<GameDayRecord | null>(record.done ? record : null)
  const recRef = useRef<GameDayRecord>(record)
  const seed = puzzleSeed(game.id, dayKey(), record.level)

  useEffect(() => {
    if (!recRef.current.startedAt && !recRef.current.done) {
      recRef.current = { ...recRef.current, startedAt: Date.now() }
      onRecordChange(recRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStateChange = useCallback(
    (state: unknown) => {
      if (recRef.current.done) return
      recRef.current = { ...recRef.current, state }
      onRecordChange(recRef.current)
    },
    [onRecordChange],
  )

  const handleUsedHint = useCallback(() => {
    recRef.current = { ...recRef.current, hints: (recRef.current.hints ?? 0) + 1 }
    onRecordChange(recRef.current)
  }, [onRecordChange])

  const handleSolved = useCallback(() => {
    if (recRef.current.done) return
    const timeMs = Date.now() - (recRef.current.startedAt ?? Date.now())
    const rec: GameDayRecord = {
      ...recRef.current,
      done: true,
      timeMs,
      stars: starsFor(recRef.current.hints ?? 0),
    }
    recRef.current = rec
    setSolvedInfo(rec)
    onSolvedFinal(rec)
  }, [onSolvedFinal])

  const Board = game.Board

  return (
    <div className="page">
      <header className="play-header">
        <button className="back-btn" onClick={onBack}>
          ‹ Back
        </button>
        <h2>
          {game.emoji} {game.name}
        </h2>
        <button className="howto-btn" onClick={() => setShowHowTo(true)}>
          ?
        </button>
      </header>

      {!solvedInfo && (
        <Board
          seed={seed}
          level={record.level}
          savedState={record.state}
          mistakeHighlight={mistakeHighlight}
          onStateChange={handleStateChange}
          onUsedHint={handleUsedHint}
          onSolved={handleSolved}
        />
      )}

      {solvedInfo && (
        <div className="solved-panel">
          <Confetti big={allDoneAfterThis} />
          <div className="solved-emoji">{allDoneAfterThis ? '🏆' : '🎉'}</div>
          <h2>{allDoneAfterThis ? 'You finished ALL of today’s puzzles!' : 'You did it!'}</h2>
          <p className="solved-time">
            Solved in <strong>{formatTime(solvedInfo.timeMs ?? 0)}</strong>
          </p>
          <p className="stars big-stars">{'⭐'.repeat(solvedInfo.stars ?? 1)}</p>
          {(solvedInfo.hints ?? 0) > 0 && <p className="hint-text">{solvedInfo.hints} hint{solvedInfo.hints === 1 ? '' : 's'} used</p>}
          <button className="play-btn big" onClick={onBack}>
            {allDoneAfterThis ? 'See today’s results' : 'Next puzzle ›'}
          </button>
        </div>
      )}

      {showHowTo && (
        <div className="overlay" onClick={() => setShowHowTo(false)}>
          <div className="overlay-card" onClick={(e) => e.stopPropagation()}>
            <h3>
              {game.emoji} How to play {game.name}
            </h3>
            <ul>
              {game.howTo.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <button className="play-btn big" onClick={() => setShowHowTo(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
