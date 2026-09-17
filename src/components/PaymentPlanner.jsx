import { useState } from 'react'
import { formatDate, formatMoney, todayISO } from '../utils/format.js'
import { generateSchedule } from '../services/loanEngine.js'
import { Card, EmptyState, Modal } from './ui.jsx'

function statusLabel(s) {
  if (s === 'buffer-covered') return 'Buffer covered'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function PaymentPlanner({ config, setConfig, schedule, setSchedule, onPay, pushToast }) {
  const [draft, setDraft] = useState(config)
  const [tab, setTab] = useState('upcoming')
  const [payTarget, setPayTarget] = useState(null)

  const regen = (e) => {
    e.preventDefault()
    const principal = Number(draft.principal)
    const rate = Number(draft.annualRatePct)
    const tenure = Number(draft.tenureMonths)
    if (!Number.isFinite(principal) || principal < 1000) { pushToast('Principal must be at least Rs 1,000.', 'error'); return }
    if (!Number.isFinite(rate) || rate < 0 || rate > 60) { pushToast('Rate must be between 0 and 60 percent.', 'error'); return }
    if (!Number.isFinite(tenure) || tenure < 1 || tenure > 60) { pushToast('Tenure must be between 1 and 60 months.', 'error'); return }
    if (!draft.startDate) { pushToast('Pick a start date.', 'error'); return }
    const next = { ...draft, principal, annualRatePct: rate, tenureMonths: tenure }
    setConfig(next)
    setSchedule(generateSchedule(next))
    pushToast('Repayment schedule updated.', 'ok')
  }

  const list = schedule.filter((p) =>
    tab === 'upcoming' ? (p.status === 'upcoming' || p.status === 'paused')
    : tab === 'completed' ? (p.status === 'completed' || p.status === 'buffer-covered')
    : p.status === 'missed',
  )
  const visible = list.slice(0, 20)

  return (
    <Card
      title="Payment plan"
      sub="The schedule updates when amount, tenure, rate, frequency, or start date changes."
      actions={
        <div className="tabs" role="tablist" aria-label="Payment filter">
          {['upcoming', 'completed', 'missed'].map((t) => (
            <button key={t} className={tab === t ? '' : 'ghost'} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      }
    >
      <form className="planner-form" onSubmit={regen}>
        <label>Loan amount (Rs)<input type="number" min="1000" value={draft.principal} onChange={(e) => setDraft({ ...draft, principal: e.target.value })} /></label>
        <label>Tenure (months)<input type="number" min="1" max="60" value={draft.tenureMonths} onChange={(e) => setDraft({ ...draft, tenureMonths: e.target.value })} /></label>
        <label>Rate (pct p.a.)<input type="number" min="0" max="60" step="0.1" value={draft.annualRatePct} onChange={(e) => setDraft({ ...draft, annualRatePct: e.target.value })} /></label>
        <label>Frequency
          <select value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}>
            <option>Monthly</option><option>Weekly</option><option>Daily</option>
          </select>
        </label>
        <label>Start date<input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></label>
        <button type="submit">Update schedule</button>
      </form>

      {list.length === 0 ? <EmptyState title={`No ${tab} payments`} hint="Nothing in this group." /> : (
        <div className="table-wrap">
          <table className="schedule">
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Due date</th>
                <th scope="col" className="num">Expected</th>
                <th scope="col" className="num">Principal</th>
                <th scope="col" className="num">Interest</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="label" style={{ margin: 0 }}>Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td><strong>#{p.index}</strong></td>
                  <td>{formatDate(p.dueDate)}</td>
                  <td className="num">{formatMoney(p.expectedTotal)}</td>
                  <td className="num">{formatMoney(p.principalPart)}</td>
                  <td className="num">{formatMoney(p.interestPart)}</td>
                  <td><span className={`pill ${p.status}`}><span className={`dot ${p.status}`} aria-hidden="true" />{statusLabel(p.status)}</span></td>
                  <td>
                    {(p.status === 'upcoming' || p.status === 'missed') ? (
                      <button className="small-btn" onClick={() => setPayTarget(p)}>Pay</button>
                    ) : (
                      <span className="muted small">Recorded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.length > visible.length && <p className="muted small">Showing {visible.length} of {list.length}.</p>}

      <Modal open={!!payTarget} title={`Confirm payment ${payTarget ? `#${payTarget.index}` : ''}`} onClose={() => setPayTarget(null)}>
        {payTarget && (
          <div>
            <p>Pay <strong>{formatMoney(payTarget.expectedTotal)}</strong> due <strong>{formatDate(payTarget.dueDate)}</strong>?</p>
            <p className="muted small">Payment date is recorded as {formatDate(todayISO())}. Overview, map, record, and summary update together.</p>
            <div className="row">
              <button onClick={() => { onPay(payTarget.id); setPayTarget(null) }}>Confirm payment</button>
              <button className="ghost" onClick={() => setPayTarget(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  )
}
