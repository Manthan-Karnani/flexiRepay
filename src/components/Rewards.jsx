import { formatMoney } from '../utils/format.js'
import { Card } from './ui.jsx'

export default function Rewards({ rewards, summary }) {
  if (!rewards.unlocked) {
    const left = Math.max(0, summary.totalPrincipal / 2 - summary.repaidPrincipal)
    return (
      <Card title="Benefits" sub="Unlocks after 50 percent of principal is repaid.">
        <div className="progress"><div className="progress-fill" style={{ width: `${rewards.progress}%` }} /></div>
        <p className="muted small">{summary.repaymentPct.toFixed(1)} percent repaid. {formatMoney(left)} left to unlock.</p>
        <p className="muted small">Points, badges, and benefits will appear here after unlocking.</p>
      </Card>
    )
  }
  return (
    <Card title="Benefits" sub="50 percent of principal repaid." className="unlocked">
      <div className="stat-grid">
        <div className="stat"><span className="label">Points</span><strong>{rewards.points}</strong></div>
        <div className="stat"><span className="label">Badges</span><strong>{rewards.badges.length}</strong></div>
      </div>
      <div className="badges">
        {rewards.badges.map((b) => <span key={b.id} className="badge on" title={b.desc}>{b.name}</span>)}
      </div>
      <h3 className="small-head">Available benefits</h3>
      <ul className="mini-list">{rewards.benefits.map((b) => <li key={b.id}><strong>{b.name}</strong>: {b.desc}</li>)}</ul>
    </Card>
  )
}
