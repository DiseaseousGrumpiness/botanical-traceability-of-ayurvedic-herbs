import { CheckCircle, XCircle, Clock, Package, ArrowRight, AlertCircle } from 'lucide-react'

/**
 * Color-coded badge for qualityStatus and status fields.
 * qualityStatus: PENDING | APPROVED | REJECTED
 * status: COLLECTED | TRANSFERRED | ...
 */
export function QualityBadge({ status }) {
  if (!status) return null

  const normalized = status.toUpperCase()

  const map = {
    PENDING: {
      className: 'badge badge-pending',
      icon: <Clock size={11} />,
      label: 'Pending',
    },
    APPROVED: {
      className: 'badge badge-approved',
      icon: <CheckCircle size={11} />,
      label: 'Approved',
    },
    REJECTED: {
      className: 'badge badge-rejected',
      icon: <XCircle size={11} />,
      label: 'Rejected',
    },
  }

  const cfg = map[normalized] || {
    className: 'badge badge-default',
    icon: <AlertCircle size={11} />,
    label: status,
  }

  return (
    <span className={cfg.className} role="status" aria-label={`Quality: ${cfg.label}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

export function StatusBadge({ status }) {
  if (!status) return null

  const normalized = status.toUpperCase()

  const map = {
    COLLECTED: {
      className: 'badge badge-collected',
      icon: <Package size={11} />,
      label: 'Collected',
    },
    TRANSFERRED: {
      className: 'badge badge-transferred',
      icon: <ArrowRight size={11} />,
      label: 'Transferred',
    },
  }

  const cfg = map[normalized] || {
    className: 'badge badge-default',
    icon: <Package size={11} />,
    label: status,
  }

  return (
    <span className={cfg.className} role="status" aria-label={`Status: ${cfg.label}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

export default StatusBadge
