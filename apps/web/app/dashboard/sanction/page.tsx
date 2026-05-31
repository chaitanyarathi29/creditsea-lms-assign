'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import type { Loan, BorrowerProfile } from '../../lib/types'

interface LoansResponse {
  loans: Loan[]
  count: number
}

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [actioning, setActioning] = useState(false)
  
  // Rejection state
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const { showToast } = useToast()

  const fetchLoans = useCallback(async () => {
    try {
      const data = await api.get<LoansResponse>('/dashboard/sanction/loans')
      setLoans(data.loans || [])
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to fetch loans', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const handleApprove = async (loanId: string) => {
    if (!confirm('Are you sure you want to approve this loan?')) return

    setActioning(true)
    try {
      await api.patch(`/dashboard/sanction/loans/${loanId}/approve`)
      showToast('Loan approved successfully', 'success')
      setSelectedLoan(null)
      fetchLoans()
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Approve failed', 'error')
    } finally {
      setActioning(false)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoan) return
    if (!rejectionReason.trim()) {
      showToast('Please enter a rejection reason', 'error')
      return
    }

    setActioning(true)
    try {
      await api.patch(`/dashboard/sanction/loans/${selectedLoan._id}/reject`, {
        rejectionReason: rejectionReason.trim()
      })
      showToast('Loan rejected successfully', 'success')
      setSelectedLoan(null)
      setShowRejectForm(false)
      setRejectionReason('')
      fetchLoans()
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Rejection failed', 'error')
    } finally {
      setActioning(false)
    }
  }

  const openReview = (loan: Loan) => {
    setSelectedLoan(loan)
    setShowRejectForm(false)
    setRejectionReason('')
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Sanction Dashboard</h1>
        <p>Review submitted loan applications, verify details, and approve/reject.</p>
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
          <h3>No Pending Reviews</h3>
          <p className="text-sm text-muted">All applied loans have been reviewed.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>PAN</th>
                <th>Requested Amount</th>
                <th>Tenure</th>
                <th>Repayment</th>
                <th>Applied Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const profile = typeof loan.profileId === 'object' && loan.profileId !== null ? loan.profileId : null
                const borrower = typeof loan.borrowerId === 'object' && loan.borrowerId !== null ? loan.borrowerId : null
                return (
                  <tr
                    key={loan._id}
                    className="cursor-pointer"
                    onClick={() => openReview(loan)}
                  >
                    <td>
                      <div className="font-semibold">{profile?.fullName || '—'}</div>
                      <div className="text-xs text-muted">{borrower?.email || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{profile?.pan || '—'}</td>
                    <td className="font-semibold">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                    <td>{loan.tenure} Days</td>
                    <td>₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                    <td>
                      {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openReview(loan)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedLoan && (
        <Modal
          isOpen={!!selectedLoan}
          onClose={() => !actioning && setSelectedLoan(null)}
          title="Review Loan Application"
        >
          {(() => {
            const profile = typeof selectedLoan.profileId === 'object' && selectedLoan.profileId !== null ? (selectedLoan.profileId as unknown as BorrowerProfile) : null
            const borrower = typeof selectedLoan.borrowerId === 'object' && selectedLoan.borrowerId !== null ? selectedLoan.borrowerId : null
            return (
              <div className="flex flex-col gap-6">
                {/* Borrower details */}
                <div>
                  <h4 className="mb-3 text-sm text-muted">APPLICANT PROFILE</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    <div>
                      <span className="text-muted">Full Name:</span>{' '}
                      <span className="font-medium">{profile?.fullName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted">Email Address:</span>{' '}
                      <span className="font-medium">{borrower?.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted">PAN Card:</span>{' '}
                      <span className="font-medium" style={{ fontFamily: 'var(--font-mono)' }}>{profile?.pan || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted">Employment Mode:</span>{' '}
                      <span className="font-medium">{profile?.employmentMode || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted">Monthly Net Salary:</span>{' '}
                      <span className="font-medium">₹{profile?.monthlySalary?.toLocaleString('en-IN') || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted">Salary Slip:</span>{' '}
                      {profile?.salarySlipUrl ? (
                        <a
                          href={profile.salarySlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-accent hover:underline"
                        >
                          View Salary Slip ↗
                        </a>
                      ) : (
                        <span className="text-danger">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="divider" style={{ margin: 0 }} />

                {/* Loan terms */}
                <div>
                  <h4 className="mb-3 text-sm text-muted">REQUESTED LOAN TERMS</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    <div>
                      <span className="text-muted">Principal Amount:</span>{' '}
                      <span className="font-semibold text-accent">₹{selectedLoan.loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted">Tenure Period:</span>{' '}
                      <span className="font-medium">{selectedLoan.tenure} Days</span>
                    </div>
                    <div>
                      <span className="text-muted">Interest Rate:</span>{' '}
                      <span className="font-medium">{selectedLoan.interestRate}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-muted">Simple Interest:</span>{' '}
                      <span className="font-medium">₹{selectedLoan.simpleInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span className="text-muted">Total Repayment Amount:</span>{' '}
                      <span className="font-semibold">₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Approve/Reject Area */}
                {!showRejectForm ? (
                  <div className="flex justify-end gap-3 mt-4" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setSelectedLoan(null)}
                      disabled={actioning}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actioning}
                    >
                      Reject Application
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApprove(selectedLoan._id)}
                      disabled={actioning}
                    >
                      {actioning ? 'Approving...' : 'Approve & Sanction'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReject} className="flex flex-col gap-4 mt-2" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="reason">Reason for Rejection</label>
                      <textarea
                        id="reason"
                        className="input"
                        placeholder="Provide details on why this loan application is rejected (e.g. documents unclear, verification failed)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        disabled={actioning}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setShowRejectForm(false)}
                        disabled={actioning}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-danger"
                        disabled={actioning}
                      >
                        {actioning ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })()}
        </Modal>
      )}
    </div>
  )
}
