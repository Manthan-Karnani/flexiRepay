import { useState } from 'react'
import { formatDate, formatMoney, todayISO, uid } from '../utils/format.js'
import { checkPauseEligibility, pauseEffect } from '../services/loanEngine.js'
import { Card, Modal } from './ui.jsx'

export default function PauseManager({ schedule, setSchedule, config, summary, pauses, setPauses, pushToast }) {
  const [confirm, setConfirm] = useState(false)
  const { eligible, reasons } = checkPauseEligibility(summary)
  const effect = pauseEffect(schedule, config)
  const alreadyPaused = pauses.length > 0

  const apply = () => {
    const target = schedule.find((p) => p.status === 'upcoming')
    if (!target) { pushToast('No upcoming payment to pause', 'error'); return }
    setSchedule(schedule.map((p) => (p.id === target.id ? { ...p, status: 'paused' } : p)))
    setPauses([...pauses, { id: uid(), date: todayISO(), paymentId: target.id }])
    setConfirm(false)
    pushToast('Emergency pause approved for one period', 'ok')
  }

  return (
    <Card title="Payment pause" sub="Eligible accounts can skip one period. Interest still accrues and the end date moves later.">
      <p>
        <span className={`pill ${eligible && !alreadyPaused ? 'completed' : 'missed'}`}>
          {alreadyPaused ? 'pause used' : eligible ? 'eligible' : 'not eligible'}
        </span>
      </p>
      {!eligible && <ul className="mini-list">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
      <div className="stat-grid">
        <div className="stat"><span className="label">Extends tenure by</span><strong>{effect.extendsBy}</strong></div>
        <div className="stat"><span className="label">Extra interest ≈</span><strong>{formatMoney(effect.extraInterest)}</strong></div>
        <div className="stat"><span className="label">Next due</span><strong>{effect.nextDue ? formatDate(effect.nextDue) : 'None'}</strong></div>
      </div>
      <div className="row">
        <button disabled={!eligible || alreadyPaused} onClick={() => setConfirm(true)}>
          {alreadyPaused ? 'Pause already used' : 'Request no-payment period'}
        </button>
      </div>
      <Modal open={confirm} title="Confirm pause" onClose={() => setConfirm(false)}>
        <p>Skip one payment? The end date moves by {effect.extendsBy} and about {formatMoney(effect.extraInterest)} in interest accrues.</p>
        <p className="muted small">Paused periods are left out of the on time run.</p>
        <div className="row"><button onClick={apply}>Confirm pause</button><button className="ghost" onClick={() => setConfirm(false)}>Cancel</button></div>
      </Modal>
    </Card>
  )
}
