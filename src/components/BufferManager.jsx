import { useState } from 'react'
import { formatDate, formatMoney, todayISO, uid } from '../utils/format.js'
import { Card } from './ui.jsx'

export default function BufferManager({ buffer, setBuffer, schedule, setSchedule, pushToast }) {
  const [amt, setAmt] = useState('1000')
  const missed = schedule.filter((p) => p.status === 'missed')

  const add = () => {
    const n = Number(amt)
    if (!Number.isFinite(n) || n < 100) { pushToast('Add at least Rs 100.', 'error'); return }
    setBuffer({ balance: buffer.balance + n, txns: [...buffer.txns, { id: uid(), date: todayISO(), type: 'add', amount: n, note: 'Top-up' }] })
    pushToast(`Buffer balance increased by ${formatMoney(n)}.`, 'ok')
  }

  const cover = (id) => {
    const p = schedule.find((x) => x.id === id)
    if (!p) return
    if (buffer.balance < p.expectedTotal) { pushToast('Buffer balance is too low. Add funds first.', 'error'); return }
    setBuffer({
      balance: buffer.balance - p.expectedTotal,
      txns: [...buffer.txns, { id: uid(), date: todayISO(), type: 'use', amount: p.expectedTotal, note: `Cover ${p.index}` }],
    })
    setSchedule(schedule.map((x) => (x.id === id ? { ...x, status: 'buffer-covered', actualAmount: x.expectedTotal, paidDate: todayISO(), coveredByBuffer: true } : x)))
    pushToast(`Period ${p.index} paid from buffer. On time run kept.`, 'ok')
  }

  return (
    <Card title="Safety buffer" sub="A reserve balance that can cover one missed payment and keep the on time run.">
      <div className="stat-grid">
        <div className="stat"><span className="label">Buffer balance</span><strong>{formatMoney(buffer.balance)}</strong></div>
        <div className="stat"><span className="label">Missed needing cover</span><strong>{missed.length}</strong></div>
      </div>
      <div className="row wrap">
        <input type="number" min="100" value={amt} onChange={(e) => setAmt(e.target.value)} aria-label="Buffer amount" style={{ maxWidth: 200 }} />
        <button onClick={add}>Add funds</button>
      </div>
      {missed.length === 0 ? <p className="muted small">No missed payments now. A buffer near one instalment is a good reserve.</p> : (
        <ul className="pay-list">
          {missed.map((p) => (
            <li key={p.id} className="pay missed">
              <div><strong>#{p.index}, {formatDate(p.dueDate)}</strong><span className="muted small"> {formatMoney(p.expectedTotal)}</span></div>
              <button className="small-btn" onClick={() => cover(p.id)}>Pay from buffer</button>
            </li>
          ))}
        </ul>
      )}
      {buffer.txns.length > 0 && (
        <ul className="mini-list">{buffer.txns.slice(-5).reverse().map((t) => <li key={t.id}>{formatDate(t.date)}, {t.type === 'add' ? '+' : '-'}{formatMoney(t.amount)}, {t.note}</li>)}</ul>
      )}
    </Card>
  )
}
