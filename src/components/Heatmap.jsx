import { useMemo, useState } from 'react'
import { formatDate, formatMoney } from '../utils/format.js'
import { Card, EmptyState } from './ui.jsx'

function cellClass(p) {
  if (p.status === 'completed') return 'paid'
  if (p.status === 'buffer-covered') return 'buffer'
  if (p.status === 'missed') return 'missed-cell'
  if (p.status === 'paused') return 'paused-cell'
  return ''
}

function cellMark(p) {
  if (p.status === 'completed') return 'P'
  if (p.status === 'buffer-covered') return 'B'
  if (p.status === 'missed') return 'X'
  if (p.status === 'paused') return 'S'
  return ''
}

function statusLabel(s) {
  if (s === 'buffer-covered') return 'Buffer covered'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function Heatmap({ schedule, config }) {
  const [view, setView] = useState(config.frequency)
  const [sel, setSel] = useState(null)

  const cells = useMemo(() => {
    if (view === config.frequency) return schedule
    const size = view === 'Monthly' ? 4 : view === 'Weekly' ? 7 : 1
    const groups = []
    for (let i = 0; i < schedule.length; i += size) {
      const chunk = schedule.slice(i, i + size)
      const expectedTotal = chunk.reduce((s, p) => s + p.expectedTotal, 0)
      const actualAmount = chunk.reduce((s, p) => s + p.actualAmount, 0)
      const status = chunk.every((p) => p.status === 'completed' || p.status === 'buffer-covered')
        ? 'completed' : chunk.some((p) => p.status === 'missed') ? 'missed' : 'upcoming'
      groups.push({ id: `g-${i}`, index: `${chunk[0].index}-${chunk[chunk.length - 1].index}`, dueDate: chunk[0].dueDate, expectedTotal, actualAmount, status, principalPart: 0, interestPart: 0 })
    }
    return groups
  }, [schedule, view, config.frequency])

  const runIds = useMemo(() => {
    const ids = new Set()
    const past = cells.filter((p) => p.status !== 'upcoming' && p.status !== 'paused')
    for (let i = past.length - 1; i >= 0; i--) {
      if (past[i].status === 'completed' || past[i].status === 'buffer-covered') ids.add(past[i].id)
      else break
    }
    return ids
  }, [cells])

  const paid = cells.filter((p) => p.status === 'completed' || p.status === 'buffer-covered').length

  return (
    <Card
      title="Payment map"
      sub={`${paid} of ${cells.length} periods paid. Select a square for expected and actual amounts.`}
      actions={
        <div className="tabs" role="tablist" aria-label="Map grouping">
          {['Daily', 'Weekly', 'Monthly'].map((v) => (
            <button key={v} className={view === v ? '' : 'ghost'} onClick={() => { setView(v); setSel(null) }}>{v}</button>
          ))}
        </div>
      }
    >
      {cells.length === 0 ? <EmptyState title="No periods" /> : (
        <div className="heat" role="grid" aria-label="Payment map">
          {cells.map((p) => (
            <button
              key={p.id} role="gridcell"
              title={`Period ${p.index}, ${p.dueDate}, ${statusLabel(p.status)}`}
              className={`cell ${cellClass(p)} ${runIds.has(p.id) ? 'current-run' : ''} ${sel?.id === p.id ? 'sel' : ''}`}
              onClick={() => setSel(sel?.id === p.id ? null : p)}
              aria-label={`Period ${p.index}, ${statusLabel(p.status)}`}
            >
              <span aria-hidden="true">{cellMark(p)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="heat-legend muted small">
        <span className="legend-item"><span className="sw paid" /> Paid</span>
        <span className="legend-item"><span className="sw buffer" /> Buffer</span>
        <span className="legend-item"><span className="sw missed-cell" /> Missed</span>
        <span className="legend-item"><span className="sw pending" /> Due</span>
        <span>Outline marks the current on time run.</span>
      </div>
      {sel ? (
        <div className="heat-detail">
          <strong>Period {sel.index} on {formatDate(sel.dueDate)}</strong>
          <span>Expected {formatMoney(sel.expectedTotal)}</span>
          <span>Paid {formatMoney(sel.actualAmount)}</span>
          <span className={`pill ${sel.status}`}>{statusLabel(sel.status)}</span>
        </div>
      ) : <p className="muted small">No period selected.</p>}
    </Card>
  )
}
