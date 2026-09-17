import { useEffect, useMemo, useState } from 'react'
import useLocalStorage from './hooks/useLocalStorage.js'
import { formatDate, formatMoney, todayISO, uid } from './utils/format.js'
import { calcStreak, generateSchedule, rewardsInfo, summarize } from './services/loanEngine.js'
import { Card, Modal, Toasts } from './components/ui.jsx'
import LoanOverview from './components/LoanOverview.jsx'
import PaymentPlanner from './components/PaymentPlanner.jsx'
import Heatmap from './components/Heatmap.jsx'
import ExtraPayment from './components/ExtraPayment.jsx'
import PauseManager from './components/PauseManager.jsx'
import BufferManager from './components/BufferManager.jsx'
import StreakTracker from './components/StreakTracker.jsx'
import Rewards from './components/Rewards.jsx'
import Insights from './components/Insights.jsx'

function defaultConfig() {
  const today = todayISO()
  // start 4 periods ago so demo has history
  const d = new Date()
  d.setMonth(d.getMonth() - 4)
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { principal: 50000, annualRatePct: 12, tenureMonths: 12, frequency: 'Monthly', startDate: start, _seed: today }
}

export default function App() {
  const [config, setConfig] = useLocalStorage('mfi:config', defaultConfig)
  const [schedule, setSchedule] = useLocalStorage('mfi:schedule', null)
  const [extras, setExtras] = useLocalStorage('mfi:extras', [])
  const [pauses, setPauses] = useLocalStorage('mfi:pauses', [])
  const [buffer, setBuffer] = useLocalStorage('mfi:buffer', { balance: 2000, txns: [] })
  const [toasts, setToasts] = useState([])
  const [showReset, setShowReset] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const effectiveSchedule = useMemo(() => {
    if (Array.isArray(schedule) && schedule.length) return schedule
    return generateSchedule(config)
  }, [schedule, config])

  const summary = useMemo(
    () => summarize(effectiveSchedule, config, extras, pauses),
    [effectiveSchedule, config, extras, pauses],
  )
  const streak = useMemo(() => calcStreak(effectiveSchedule), [effectiveSchedule])
  const rewards = useMemo(() => rewardsInfo(summary, streak), [summary, streak])

  // persist generated schedule on first run
  useEffect(() => {
    if (!schedule) setSchedule(generateSchedule(config))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [wasLocked, setWasLocked] = useState(!rewards.unlocked)
  useEffect(() => {
    if (rewards.unlocked && wasLocked) {
      setCelebrate(true)
      pushToast('Benefits unlocked. 50 percent of principal repaid.', 'ok')
      setWasLocked(false)
    } else if (!rewards.unlocked && !wasLocked) {
      setWasLocked(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewards.unlocked])

  function pushToast(msg, kind) {
    const id = uid()
    setToasts((t) => [...t, { id, msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }

  const onPay = (id) => {
    const target = effectiveSchedule.find((p) => p.id === id)
    setSchedule(effectiveSchedule.map((p) =>
      p.id === id ? { ...p, status: 'completed', actualAmount: p.expectedTotal, paidDate: todayISO() } : p,
    ))
    pushToast(target ? `Payment recorded for period ${target.index}.` : 'Payment recorded.', 'ok')
  }

  const resetDemo = () => {
    const fresh = generateSchedule(config)
    setSchedule(fresh)
    setExtras([])
    setPauses([])
    setBuffer({ balance: 2000, txns: [] })
    setShowReset(false)
    pushToast('Records reset to starting values.', 'ok')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Microfinance borrower record</p>
          <h1>Repayment record</h1>
          <p className="muted small">One schedule drives payments, extra principal, pauses, buffer, on time run, and benefits.</p>
          <div className="loan-meta">
            <span>Loan <strong>{formatMoney(config.principal)}</strong></span>
            <span>Rate <strong>{config.annualRatePct}% p.a.</strong></span>
            <span>Plan <strong>{config.frequency}</strong></span>
            <span>Repaid <strong>{summary.repaymentPct.toFixed(1)}%</strong></span>
            <span>Next due <strong>{summary.next ? `${formatMoney(summary.next.expectedTotal)} on ${formatDate(summary.next.dueDate)}` : 'None'}</strong></span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={() => setShowReset(true)}>Reset</button>
          <button onClick={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })}>Pay next</button>
        </div>
      </header>

      <div className="layout">
        <LoanOverview summary={summary} config={config} />
        <div id="planner">
          <PaymentPlanner config={config} setConfig={setConfig} schedule={effectiveSchedule} setSchedule={setSchedule} onPay={onPay} pushToast={pushToast} />
        </div>
        <Heatmap schedule={effectiveSchedule} config={config} />
        <div className="grid2">
          <ExtraPayment schedule={effectiveSchedule} config={config} extras={extras} setExtras={setExtras} summary={summary} pushToast={pushToast} />
          <PauseManager schedule={effectiveSchedule} setSchedule={setSchedule} config={config} summary={summary} pauses={pauses} setPauses={setPauses} pushToast={pushToast} />
        </div>
        <div className="grid2">
          <BufferManager buffer={buffer} setBuffer={setBuffer} schedule={effectiveSchedule} setSchedule={setSchedule} pushToast={pushToast} />
          <StreakTracker streak={streak} schedule={effectiveSchedule} />
        </div>
        <Rewards rewards={rewards} summary={summary} />
        <Insights summary={summary} streak={streak} schedule={effectiveSchedule} />
        <Card title="How calculations stay consistent" sub="One engine powers every section.">
          <p className="muted small">
            EMI equals P times r times (1 plus r) to the n, divided by ((1 plus r) to the n minus 1), with r equal to APR divided by periods per year (365, 52, or 12).
            Extra prepayments re-solve remaining periods to derive periods saved and interest saved.
            Pauses accrue one period of interest and extend tenure. Buffer covered counts as on time for the run but still debits the buffer. Benefits unlock at 50 percent of principal.
          </p>
        </Card>
      </div>

      <footer className="muted small footer">Demo data is stored in this browser under keys starting with <code>mfi:</code>. Missed payments carry no extra fee in this demo.</footer>

      <Modal open={showReset} title="Reset records?" onClose={() => setShowReset(false)}>
        <p>Regenerate the starting schedule and clear extra payments, pauses, and buffer entries?</p>
        <div className="row"><button onClick={resetDemo}>Reset</button><button className="ghost" onClick={() => setShowReset(false)}>Cancel</button></div>
      </Modal>

      <Modal open={celebrate} title="Half of principal repaid" onClose={() => setCelebrate(false)}>
        <p>You repaid <strong>50 percent of principal</strong>. Points, badges, and benefits are now listed below.</p>
        <div className="row"><button onClick={() => setCelebrate(false)}>View benefits</button></div>
      </Modal>

      <Toasts toasts={toasts} />
    </div>
  )
}
