import { addDays, addMonths } from '../utils/format.js'

export const PERIODS_PER_YEAR = { Daily: 365, Weekly: 52, Monthly: 12 }
export const MILESTONES = [5, 10, 25, 50]

export function periodsPerYear(freq) {
  return PERIODS_PER_YEAR[freq] || 12
}

export function totalPeriods(tenureMonths, freq) {
  const ppy = periodsPerYear(freq)
  return Math.max(1, Math.round((tenureMonths * ppy) / 12))
}

export function periodRate(annualRatePct, freq) {
  return (Number(annualRatePct) || 0) / 100 / periodsPerYear(freq)
}

export function installment(principal, annualRatePct, tenureMonths, freq) {
  const n = totalPeriods(tenureMonths, freq)
  const r = periodRate(annualRatePct, freq)
  const P = Number(principal) || 0
  if (n <= 0) return 0
  if (r === 0) return P / n
  const pow = Math.pow(1 + r, n)
  return (P * r * pow) / (pow - 1)
}

export function addPeriod(iso, freq, k = 1) {
  if (freq === 'Daily') return addDays(iso, k)
  if (freq === 'Weekly') return addDays(iso, 7 * k)
  return addMonths(iso, k)
}

/** Build base amortisation schedule with seeded demo history. */
export function generateSchedule(config) {
  const { principal, annualRatePct, tenureMonths, frequency, startDate } = config
  const n = totalPeriods(tenureMonths, frequency)
  const emi = installment(principal, annualRatePct, tenureMonths, frequency)
  const r = periodRate(annualRatePct, frequency)
  let balance = Number(principal) || 0
  const out = []
  for (let i = 0; i < n; i++) {
    const dueDate = addPeriod(startDate, frequency, i + 1)
    const interestPart = balance * r
    let principalPart = emi - interestPart
    if (i === n - 1) principalPart = balance
    balance = Math.max(0, balance - principalPart)
    out.push({
      id: `p-${i + 1}`,
      index: i + 1,
      dueDate,
      expectedTotal: i === n - 1 ? principalPart + interestPart : emi,
      principalPart,
      interestPart,
      actualAmount: 0,
      paidDate: null,
      status: 'upcoming', // upcoming | completed | missed | paused | buffer-covered
      coveredByBuffer: false,
    })
  }
  // Seed realistic history: first 4 paid (one via buffer), 5th missed, rest upcoming.
  // Only seed if start is in the past enough; otherwise seed first 2 as completed for demo.
  const seedCount = Math.min(4, out.length)
  for (let i = 0; i < seedCount; i++) {
    out[i].status = 'completed'
    out[i].actualAmount = out[i].expectedTotal
    out[i].paidDate = out[i].dueDate
  }
  if (out.length > 4) {
    if (out[3]) { out[3].status = 'buffer-covered'; out[3].coveredByBuffer = true }
    out[4].status = 'missed'
    out[4].actualAmount = 0
  }
  return out
}

export function summarize(schedule, config, extras = [], pauses = []) {
  const totalPrincipal = Number(config.principal) || 0
  let repaidPrincipal = 0
  let interestPaid = 0
  let completed = 0
  let missed = 0
  let bufferUsed = 0
  schedule.forEach((p) => {
    if (p.status === 'completed' || p.status === 'buffer-covered') {
      repaidPrincipal += p.principalPart
      interestPaid += p.interestPart
      completed += 1
      if (p.status === 'buffer-covered') bufferUsed += p.expectedTotal
    } else if (p.status === 'missed') {
      missed += 1
    }
  })
  const extraTotal = extras.reduce((s, e) => s + Number(e.amount || 0), 0)
  repaidPrincipal += extraTotal
  const remainingPrincipal = Math.max(0, totalPrincipal - repaidPrincipal)
  const repaymentPct = totalPrincipal > 0 ? (repaidPrincipal / totalPrincipal) * 100 : 0
  const next = schedule.find((p) => p.status === 'upcoming' || p.status === 'missed') || null
  const emi = installment(config.principal, config.annualRatePct, config.tenureMonths, config.frequency)
  // Debt-free date: last due shifted earlier by extra prepayment, later by pauses.
  const impact = estimateExtraImpact(schedule, config, extraTotal)
  let debtFree = schedule.length ? schedule[schedule.length - 1].dueDate : config.startDate
  if (impact.periodsSaved > 0) {
    // move back N periods from last *unpaid* due date
    const unpaid = schedule.filter((p) => p.status === 'upcoming' || p.status === 'missed' || p.status === 'paused')
    const lastUnpaidIdx = unpaid.length
      ? schedule.indexOf(unpaid[unpaid.length - 1])
      : schedule.length - 1
    const targetIdx = Math.max(0, lastUnpaidIdx - impact.periodsSaved)
    debtFree = schedule[targetIdx] ? schedule[targetIdx].dueDate : debtFree
  }
  if (pauses.length) {
    // each pause pushes tenure by 1 period
    let d = debtFree
    pauses.forEach(() => { d = addPeriod(d, config.frequency, 1) })
    debtFree = d
  }
  return {
    totalPrincipal, repaidPrincipal, remainingPrincipal, interestPaid,
    completed, missed, repaymentPct, next, emi,
    extraTotal, interestSaved: impact.interestSaved,
    debtFreeDate: debtFree, bufferUsed,
    totalPeriods: schedule.length,
  }
}

/** Estimate effect of extra principal prepayment on remaining schedule. */
export function estimateExtraImpact(schedule, config, extraTotal) {
  const r = periodRate(config.annualRatePct, config.frequency)
  const emi = installment(config.principal, config.annualRatePct, config.tenureMonths, config.frequency)
  if (!extraTotal || extraTotal <= 0 || emi <= 0) return { periodsSaved: 0, interestSaved: 0, newDebtFree: null }
  // Remaining balance & remaining periods
  let paidPrincipal = 0
  let remainingCount = 0
  schedule.forEach((p) => {
    if (p.status === 'completed' || p.status === 'buffer-covered') paidPrincipal += p.principalPart
    else remainingCount += 1
  })
  const B0 = Math.max(0, Number(config.principal) - paidPrincipal)
  const B1 = Math.max(0, B0 - extraTotal)
  if (B1 <= 0) return { periodsSaved: remainingCount, interestSaved: remainingCount * emi - B0, newDebtFree: null }
  if (r === 0) {
    const n0 = Math.ceil(B0 / emi)
    const n1 = Math.ceil(B1 / emi)
    return { periodsSaved: Math.max(0, n0 - n1), interestSaved: 0, newDebtFree: null }
  }
  const nFor = (B) => {
    const x = 1 - (r * B) / emi
    if (x <= 0) return remainingCount
    return Math.ceil(-Math.log(x) / Math.log(1 + r))
  }
  const n0 = nFor(B0)
  const n1 = nFor(B1)
  const periodsSaved = Math.max(0, Math.min(remainingCount, n0 - n1))
  const interestSaved = Math.max(0, (n0 * emi - B0) - (n1 * emi - B1))
  return { periodsSaved, interestSaved, newDebtFree: null }
}

export function pauseEffect(schedule, config) {
  const r = periodRate(config.annualRatePct, config.frequency)
  const upcoming = schedule.find((p) => p.status === 'upcoming')
  const balance = remainingBalance(schedule, config)
  const extraInterest = balance * r
  return { extraInterest, extendsBy: `1 ${config.frequency === 'Monthly' ? 'month' : config.frequency === 'Weekly' ? 'week' : 'day'}`, nextDue: upcoming ? upcoming.dueDate : null }
}

function remainingBalance(schedule, config) {
  let paid = 0
  schedule.forEach((p) => {
    if (p.status === 'completed' || p.status === 'buffer-covered') paid += p.principalPart
  })
  return Math.max(0, Number(config.principal) - paid)
}

export function checkPauseEligibility(summary) {
  const reasons = []
  if (summary.completed < 3) reasons.push('Need at least 3 completed payments')
  if (summary.missed > 2) reasons.push('Too many missed payments (max 2)')
  if (summary.repaymentPct < 10) reasons.push('Need at least 10% principal repaid')
  return { eligible: reasons.length === 0, reasons }
}

export function calcStreak(schedule) {
  let longest = 0
  let run = 0
  const good = (p) => p.status === 'completed' || p.status === 'buffer-covered'
  schedule.forEach((p) => {
    if (p.status === 'upcoming' || p.status === 'paused') return // ignore future
    if (good(p)) { run += 1; longest = Math.max(longest, run) }
    else if (p.status === 'missed') { run = 0 }
  })
  // current = trailing good run (excluding future)
  let current = 0
  const past = schedule.filter((p) => p.status !== 'upcoming' && p.status !== 'paused')
  for (let i = past.length - 1; i >= 0; i--) {
    if (good(past[i])) current += 1
    else break
  }
  const nextMilestone = MILESTONES.find((m) => m > current) || null
  return { current, longest, nextMilestone }
}

export const STREAK_MESSAGES = {
  5: '5 in a row. Steady record.',
  10: '10 on time payments in a row. Consistent record.',
  25: '25 in a row. Long consistent record.',
  50: '50 in a row. Longest record in this program.',
}

export function rewardsInfo(summary, streak) {
  const unlocked = summary.repaymentPct >= 50
  const progress = Math.min(100, (summary.repaymentPct / 50) * 100)
  const points = Math.floor(summary.repaidPrincipal / 100) + streak.longest * 10 + summary.completed * 5
  const badges = []
  if (summary.repaymentPct >= 50) badges.push({ id: 'half', name: 'Half repaid', desc: '50 percent of principal repaid' })
  if (streak.current >= 5) badges.push({ id: 's5', name: 'Run of 5', desc: '5 on time in a row' })
  if (streak.current >= 10) badges.push({ id: 's10', name: 'Run of 10', desc: '10 on time in a row' })
  if (streak.longest >= 25) badges.push({ id: 's25', name: 'Run of 25', desc: 'Best run of 25' })
  if (streak.longest >= 50) badges.push({ id: 's50', name: 'Run of 50', desc: 'Best run of 50' })
  if (summary.missed === 0 && summary.completed >= 3) badges.push({ id: 'clean', name: 'No missed payments', desc: 'Zero missed payments' })
  const benefits = unlocked
    ? [
      { id: 'rate', name: '0.5% loyalty rate cut', desc: 'On your next loan cycle' },
      { id: 'fee', name: 'Zero late-review fee', desc: 'One-time waiver' },
      { id: 'topup', name: 'Priority top-up', desc: 'Faster approval queue' },
    ]
    : []
  return { unlocked, progress, points, badges, benefits }
}
