import { formatDate, formatMoney } from '../utils/format.js'
import { Card, ProgressRing, Stat } from './ui.jsx'

export default function LoanOverview({ summary, config }) {
  return (
    <Card title="Loan summary" sub={`Instalment ${formatMoney(summary.emi)} per ${config.frequency.toLowerCase()} at ${config.annualRatePct}% p.a.`}>
      <div className="overview-grid">
        <ProgressRing pct={summary.repaymentPct} />
        <div className="stat-grid">
          <Stat label="Total principal" value={formatMoney(summary.totalPrincipal)} />
          <Stat label="Principal repaid" value={formatMoney(summary.repaidPrincipal)} tone="ok" />
          <Stat label="Remaining principal" value={formatMoney(summary.remainingPrincipal)} />
          <Stat label="Interest paid" value={formatMoney(summary.interestPaid)} />
          <Stat label="Next payment" value={summary.next ? formatMoney(summary.next.expectedTotal) : 'None'} hint={summary.next ? formatDate(summary.next.dueDate) : 'All done'} />
          <Stat label="Frequency" value={config.frequency} />
          <Stat label="Paid and missed" value={`${summary.completed} paid, ${summary.missed} missed`} />
          <Stat label="Debt free date" value={formatDate(summary.debtFreeDate)} hint={`Interest saved ${formatMoney(summary.interestSaved)}`} />
        </div>
      </div>
    </Card>
  )
}
