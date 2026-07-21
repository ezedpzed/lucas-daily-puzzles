import type { DayRecord, Meta } from '../engine/storage'
import { GAMES } from '../games/registry'
import { formatTime, friendlyDate } from '../engine/daily'

function Stars({ n }: { n: number }) {
  return <span className="stars">{'⭐'.repeat(n)}</span>
}

export default function Home({
  meta,
  day,
  onPlay,
}: {
  meta: Meta
  day: DayRecord
  onPlay: (gameId: string) => void
}) {
  const enabled = GAMES.filter((g) => meta.settings.enabled[g.id])
  const doneCount = enabled.filter((g) => day[g.id]?.done).length
  const allDone = enabled.length > 0 && doneCount === enabled.length

  return (
    <div className="page">
      <header className="home-header">
        <h1>Lucas's Daily Puzzles</h1>
        <p className="date-line">{friendlyDate()}</p>
        {meta.streak > 0 && (
          <p className="streak-line">
            🔥 {meta.streak}-day streak{meta.bestStreak > meta.streak ? ` · best ${meta.bestStreak}` : ''}
          </p>
        )}
      </header>

      {allDone && (
        <div className="all-done-banner">
          <div className="all-done-emoji">🎉</div>
          <h2>All done for today!</h2>
          <p>Amazing work, Lucas. Come back tomorrow for new puzzles!</p>
        </div>
      )}

      <div className="card-list">
        {enabled.map((g) => {
          const rec = day[g.id]
          const done = rec?.done
          return (
            <div key={g.id} className={`game-card ${done ? 'done' : ''}`}>
              <div className="game-card-emoji">{g.emoji}</div>
              <div className="game-card-info">
                <h3>{g.name}</h3>
                {done ? (
                  <p>
                    {formatTime(rec!.timeMs ?? 0)} · <Stars n={rec!.stars ?? 1} />
                  </p>
                ) : (
                  <p>{g.tagline}</p>
                )}
              </div>
              {done ? (
                <span className="done-check">✓</span>
              ) : (
                <button className="play-btn" onClick={() => onPlay(g.id)}>
                  {rec?.state ? 'Resume' : 'Play'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <footer className="home-footer">
        {doneCount}/{enabled.length} puzzles today
      </footer>
    </div>
  )
}
