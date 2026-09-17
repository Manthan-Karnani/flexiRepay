import { useEffect } from 'react'

export function Card({ title, sub, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p className="muted small">{sub}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, hint, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <span className="label">{label}</span>
      <strong>{value}</strong>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  )
}

export function ProgressRing({ pct }) {
  const r = 52
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, pct))
  return (
    <div className="ring-wrap" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin="0" aria-valuemax="100" aria-label="Repayment progress">
      <svg viewBox="0 0 130 130" className="ring">
        <circle cx="65" cy="65" r={r} className="ring-bg" />
        <circle
          cx="65" cy="65" r={r} className="ring-fg"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
        />
      </svg>
      <div className="ring-label">
        <strong>{v.toFixed(1)}%</strong>
        <span className="muted small">repaid</span>
      </div>
    </div>
  )
}

export function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="ghost icon-btn" onClick={onClose} aria-label="Close">X</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Toasts({ toasts }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind || ''}`}>{t.msg}</div>
      ))}
    </div>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="empty">
      <p><strong>{title}</strong></p>
      {hint && <p className="muted small">{hint}</p>}
    </div>
  )
}
