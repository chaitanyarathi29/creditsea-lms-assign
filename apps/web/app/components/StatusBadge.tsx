import type { LoanStatus, BreStatus } from '../lib/types'

type BadgeStatus = LoanStatus | BreStatus

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  const classMap: Record<string, string> = {
    APPLIED: 'badge-applied',
    SANCTIONED: 'badge-sanctioned',
    DISBURSED: 'badge-disbursed',
    CLOSED: 'badge-closed',
    REJECTED: 'badge-rejected',
    PASSED: 'badge-passed',
    FAILED: 'badge-failed',
    PENDING: 'badge-pending',
  }

  return (
    <span className={`badge ${classMap[status] || 'badge-pending'}`}>
      {status}
    </span>
  )
}
