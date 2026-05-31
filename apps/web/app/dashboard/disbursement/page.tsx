'use client'

import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { Loan } from '../../lib/types'

interface LoansResponse {
  loans: Loan[]
  count: number
}

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchLoans = async () => {
    try {
      const data = await api.get<LoansResponse>('/dashboard/disbursement/loans')
      setLoans(data.loans || [])
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch sanctioned loans', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const handleDisburse = async (loanId: string, borrowerName: string, amount: number) => {
    if (!confirm(`Are you sure you want to disburse ₹${amount.toLocaleString('en-IN')} to ${borrowerName}?`)) {
      return
    }

    setActioning(loanId)
    try {
      await api.patch(`/dashboard/disbursement/loans/${loanId}/disburse`)
      showToast(`Disbursed loan to ${borrowerName} successfully`, 'success')
      fetchLoans()
    } catch (err: any) {
      showToast(err.message || 'Disbursement failed', 'error')
    } finally {
      setActioning(null)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Disbursement Dashboard</h1>
        <p>Manage and process payments for sanctioned loan applications.</p>
      </div>

      {loans.length === 0 ? (
        <div className="card empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>No Pending Disbursements</h3>
          <p className="text-sm text-muted">All sanctioned loans have been disbursed or closed.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>PAN</th>
                <th>Disbursement Amount</th>
                <th>Sanctioned By</th>
                <th>Sanctioned Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const profile: any = loan.profileId
                const borrower: any = loan.borrowerId
                const sanctionedBy: any = loan.sanctionedBy
                const borrowerName = profile?.fullName || borrower?.name || '—'

                return (
                  <tr key={loan._id}>
                    <td>
                      <div className="font-semibold">{borrowerName}</div>
                      <div className="text-xs text-muted">{borrower?.email || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{profile?.pan || '—'}</td>
                    <td className="font-semibold text-accent">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                    <td>{sanctionedBy?.name || '—'}</td>
                    <td>
                      {loan.sanctionedAt ? (
                        new Date(loan.sanctionedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDisburse(loan._id, borrowerName, loan.loanAmount)}
                        disabled={actioning !== null}
                      >
                        {actioning === loan._id ? 'Disbursing...' : 'Confirm Disburse'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
