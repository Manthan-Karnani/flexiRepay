import { useState } from 'react'
import { formatDate, formatMoney, todayISO, uid } from '../utils/format.js'
import { estimateExtraImpact } from '../services/loanEngine.js'
import { Card, Modal } from './ui.jsx'

export default function ExtraPayment({ schedule, config, extras, setExtras, summary, pushToast }) {
  const [amount, setAmount] = useState('5000')
  const [confirm, setConfirm] = useState(false)
  const n = Number(amount) || 0
  const preview = estimateExtraImpact(schedule, config, summary.extraTotal + n)

  const submit = () => {
    if (!Number.isFinite(n) || n < 100) { pushToast('Extra amount must be at least Rs 100.', 'error'); return }
    if (n > summary.remainingPrincipal) { pushToast('Extra amount is more than remaining principal.', 'error'); return }
    setConfirm(true)
  }

  const apply = () => {
    setExtras([...extras, { id: uid(), date: todayISO(), amount: n }])
    setConfirm(false)
    setAmount('')
    pushToast(`Extra ${formatMoney(n)} added. Principal reduced.`, 'ok')
  }

  return (
    <Card title="Extra principal payment" sub="Pay extra principal to reduce interest and finish earlier.">
      <div className="two-col">
        <div>
          <label>Extra amount (Rs)
            <input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" />
          </label>
          <div className="row">
            <button onClick={submit}>Preview impact</button>
            <button className="ghost" onClick={() => setAmount('')}>Clear</button>
          </div>
          {extras.length > 0 && (
            <ul className="mini-list">
              {extras.map((e) => <li key={e.id}>{formatDate(e.date)}, {formatMoney(e.amount)}</li>)}
            </ul>
          )}
        </div>
        <div className="compare">
          <div><span className="label">Before</span><strong>{formatMoney(summary.remainingPrincipal + n)} remaining</strong><span className="muted small">Debt free {formatDate(summary.debtFreeDate)}</span></div>
          <div className="arrow">to</div>
          <div><span className="label">After</span><strong className="ok">{formatMoney(Math.max(0, summary.remainingPrincipal))} remaining</strong><span className="muted small">{preview.periodsSaved} fewer periods, saves {formatMoney(preview.interestSaved)}</span></div>
        </div>
      </div>
      <Modal open={confirm} title="Confirm extra payment" onClose={() => setConfirm(false)}>
        <p>Pay extra <strong>{formatMoney(n)}</strong> toward principal?</p>
        <p className="muted small">Saves about {formatMoney(preview.interestSaved)} in interest and finishes about {preview.periodsSaved} periods earlier. This cannot be undone in the demo.</p>
        <div className="row"><button onClick={apply}>Confirm</button><button className="ghost" onClick={() => setConfirm(false)}>Cancel</button></div>
      </Modal>
    </Card>
  )
}
