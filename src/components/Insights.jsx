import { Cell, Pie, PieChart, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts'
import { formatDate, formatMoney } from '../utils/format.js'
import { Card, Stat } from './ui.jsx'

export default function Insights({ summary, streak, schedule }) {
  const pie = [
    { name: 'Repaid', value: Math.round(summary.repaidPrincipal) },
    { name: 'Remaining', value: Math.round(summary.remainingPrincipal) },
  ]
  const bars = [
    { name: 'Paid', n: summary.completed },
    { name: 'Missed', n: summary.missed },
    { name: 'Due', n: schedule.filter((p) => p.status === 'upcoming' || p.status === 'paused').length },
  ]
  return (
    <Card title="Summary" sub="Totals from the same schedule used above.">
      <div className="stat-grid">
        <Stat label="Total interest paid" value={formatMoney(summary.interestPaid)} />
        <Stat label="Interest saved (extra)" value={formatMoney(summary.interestSaved)} tone="ok" />
        <Stat label="Repayment" value={`${summary.repaymentPct.toFixed(1)}%`} />
        <Stat label="Missed" value={summary.missed} tone={summary.missed ? 'warn' : 'ok'} />
        <Stat label="Current run" value={streak.current} hint={`Best ${streak.longest}`} />
        <Stat label="Buffer used" value={formatMoney(summary.bufferUsed)} />
        <Stat label="Debt free" value={formatDate(summary.debtFreeDate)} />
        <Stat label="Instalment" value={formatMoney(summary.emi)} />
      </div>
      <div className="charts">
        <div className="chart-box">
          <h3 className="small-head">Principal repaid and remaining</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" outerRadius={80} label>
                  <Cell fill="#1B5E3B" /><Cell fill="#D8D5CC" />
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-box">
          <h3 className="small-head">Payments by status</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={bars}>
                <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                <Bar dataKey="n" fill="#1B5E3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
}
