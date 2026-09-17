import { useState } from 'react'
import { formatDate, formatMoney } from '../utils/format.js'
import { MILESTONES, STREAK_MESSAGES } from '../services/loanEngine.js'
import { Card } from './ui.jsx'

export default function StreakTracker({ streak, schedule }) {
  const done = schedule.filter((p) => p.status === 'completed' || p.status === 'buffer-covered').slice(-14)
  const pct = streak.nextMilestone ? (streak.current / streak.nextMilestone) * 100 : 100
  const atTarget = MILESTONES.includes(streak.current)
  const [picked, setPicked] = useState(null)
  const [selected, setSelected] = useState(null)

  return (
    <Card title="On time record" sub="Consecutive payments made on or before the due date. Buffer covered counts. A missed payment restarts the current run.">
      <div className="record-grid">
        <div className="stat"><span className="label">Current run</span><strong>{streak.current}</strong></div>
        <div className="stat"><span className="label">Best run</span><strong>{streak.longest}</strong></div>
        <div className="stat"><span className="label">Next target</span><strong>{streak.nextMilestone ?? 'Done'}</strong></div>
      </div>

      {atTarget && <p className="milestone-msg" role="status">Target reached. {STREAK_MESSAGES[streak.current]}</p>}
      {!atTarget && (
        <p className="muted small">
          {streak.nextMilestone
            ? `${streak.nextMilestone - streak.current} more on time payments to reach ${streak.nextMilestone}. Select a target below for detail.`
            : 'All targets reached.'}
        </p>
      )}

      <div className="progress" title="Progress to next target"><div className="progress-fill" style={{ width: `${Math.min(100, pct)}%` }} /></div>

      <ul className="milestones">
        {MILESTONES.map((m) => {
          const reached = streak.current >= m || streak.longest >= m
          const isNext = streak.nextMilestone === m
          return (
            <li key={m}>
              <button
                className={`badge ${reached ? 'on' : ''} ${isNext ? 'next' : ''}`}
                title={STREAK_MESSAGES[m]}
                onClick={() => setPicked(picked === m ? null : m)}
              >
                {m}: {reached ? 'Reached' : isNext ? 'Next' : 'Open'}
              </button>
            </li>
          )
        })}
      </ul>
      {picked && (
        <div className="detail-line">
          <strong>Target {picked}:</strong> {STREAK_MESSAGES[picked]}
        </div>
      )}

      <p className="label" style={{ marginTop: 12 }}>Recent on time payments</p>
      <div className="mini-cal" aria-label="Recent on time payments">
        {done.map((p) => (
          <button
            key={p.id}
            className={`mini-day ${p.status === 'buffer-covered' ? 'buffer' : ''} ${selected?.id === p.id ? 'picked' : ''}`}
            title={`Period ${p.index}, ${p.dueDate}`}
            onClick={() => setSelected(selected?.id === p.id ? null : p)}
          >
            {p.status === 'buffer-covered' ? 'B' : 'P'}
          </button>
        ))}
        {done.length === 0 && <span className="muted small">No on time payments yet.</span>}
      </div>
      {selected ? (
        <div className="detail-line">
          <strong>Period {selected.index} on {formatDate(selected.dueDate)}</strong>
          {' '}paid {formatMoney(selected.actualAmount)}
          {selected.status === 'buffer-covered' ? ' from buffer' : ''}
        </div>
      ) : (
        <p className="muted small">Latest: {done.length ? formatDate(done[done.length - 1].paidDate || done[done.length - 1].dueDate) : 'None yet'}.</p>
      )}
    </Card>
  )
}
