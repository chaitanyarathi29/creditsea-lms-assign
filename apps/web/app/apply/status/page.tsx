'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import type { Loan, LoansResponse } from '../../lib/types'

export default function StatusPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchLoans() {
      try {
        const data = await api.get<LoansResponse>('/borrower/loans')
        setLoans(data.loans || [])
      } catch (err) {
        const error = err as Error
        showToast(error.message || 'Failed to fetch loan applications', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchLoans()
  }, [showToast])

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  // Returns progress percentage and step index for active status
  const getProgressInfo = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return { percent: 12.5, step: 1 }
      case 'SANCTIONED':
        return { percent: 37.5, step: 2 }
      case 'DISBURSED':
        return { percent: 62.5, step: 3 }
      case 'CLOSED':
        return { percent: 100, step: 4 }
      default:
        return { percent: 0, step: 0 }
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>My Loans</h1>
          <p>Track the lifecycle of your loan applications and payments.</p>
        </div>
        {loans.length > 0 && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => router.push('/apply/loan')}
          >
            Apply Again
          </button>
        )}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3>No Loan Applications Found</h3>
          <p className="text-sm text-muted mb-4">You haven&apos;t submitted any loan requests yet.</p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/apply/loan')}
          >
            Configure & Apply Now
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {loans.map((loan) => {
            const isRejected = loan.status === 'REJECTED'
            const isDisbursedOrClosed = loan.status === 'DISBURSED' || loan.status === 'CLOSED'
            const { percent, step } = getProgressInfo(loan.status)

            return (
              <div key={loan._id} className="card flex flex-col gap-6 animate-fade-in">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-muted font-medium">LOAN ID: {loan._id}</span>
                    <h3 className="mt-1" style={{ fontSize: 'var(--text-lg)' }}>
                      ₹{loan.loanAmount.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                  <div>
                    <span className="text-muted">Tenure Period:</span>{' '}
                    <span className="font-medium">{loan.tenure} Days</span>
                  </div>
                  <div>
                    <span className="text-muted">Interest Rate:</span>{' '}
                    <span className="font-medium">{loan.interestRate}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-muted">Total Repayment:</span>{' '}
                    <span className="font-medium">₹{loan.totalRepayment.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-muted">Applied On:</span>{' '}
                    <span className="font-medium">
                      {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Repayment details if disbursed */}
                {isDisbursedOrClosed && (
                  <div
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      fontSize: 'var(--text-sm)'
                    }}
                  >
                    <div className="font-semibold text-xs text-muted mb-1">REPAYMENT STATUS</div>
                    <div className="flex justify-between">
                      <span className="text-muted">Paid to Date:</span>
                      <span className="font-medium text-success">₹{loan.amountPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Outstanding Balance:</span>
                      <span className="font-medium text-danger">₹{loan.outstandingBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Progress Bar Flow */}
                {!isRejected ? (
                  <div style={{ padding: 'var(--space-2) 0' }}>
                    <div
                      style={{
                        position: 'relative',
                        height: '6px',
                        background: 'var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        marginBottom: 'var(--space-4)'
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          height: '100%',
                          background: 'var(--color-accent)',
                          borderRadius: 'var(--radius-full)',
                          width: `${percent}%`,
                          transition: 'width 0.4s ease'
                        }}
                      />
                      {/* Dots */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '0%',
                          right: '0%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          pointerEvents: 'none'
                        }}
                      >
                        {[1, 2, 3, 4].map((s) => {
                          const active = step >= s
                          return (
                            <div
                              key={s}
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                background: active ? 'var(--color-accent)' : 'var(--color-border)',
                                border: '3px solid var(--color-surface)',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'background-color 0.4s ease'
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                    {/* Labels */}
                    <div className="flex justify-between text-xs text-muted" style={{ fontWeight: 'var(--weight-medium)' }}>
                      <span className={step >= 1 ? 'text-accent' : ''}>Applied</span>
                      <span className={step >= 2 ? 'text-accent' : ''}>Sanctioned</span>
                      <span className={step >= 3 ? 'text-accent' : ''}>Disbursed</span>
                      <span className={step >= 4 ? 'text-accent' : ''}>Closed</span>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-error">
                    <div>
                      <div className="font-semibold">Loan Application Rejected</div>
                      <p className="text-xs mt-1">
                        Reason: {loan.rejectionReason || 'No rejection reason specified.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
