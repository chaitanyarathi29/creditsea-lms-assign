'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import type { Loan, Payment } from '../../lib/types'

interface LoansResponse {
  loans: Loan[]
  count: number
}

interface PaymentsResponse {
  loan: {
    id: string
    totalRepayment: number
    amountPaid: number
    outstandingBalance: number
    status: string
  }
  payments: Payment[]
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
  
  // Expanded loan details state
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Payment form state
  const [utrNumber, setUtrNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [recording, setRecording] = useState(false)

  const { showToast } = useToast()

  const fetchLoans = useCallback(async () => {
    try {
      const data = await api.get<LoansResponse>('/dashboard/collection/loans')
      setLoans(data.loans || [])
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to fetch active loans', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const fetchPayments = async (loanId: string) => {
    setLoadingPayments(true)
    try {
      const data = await api.get<PaymentsResponse>(`/dashboard/collection/loans/${loanId}/payments`)
      setPayments(data.payments || [])
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to fetch payments', 'error')
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleToggleExpand = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null)
      setPayments([])
    } else {
      setExpandedLoanId(loanId)
      setUtrNumber('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0] || '')
      await fetchPayments(loanId)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent, loanId: string) => {
    e.preventDefault()

    if (!utrNumber.trim()) {
      showToast('UTR number is required', 'error')
      return
    }

    const payAmount = parseFloat(amount)
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('Payment amount must be greater than 0', 'error')
      return
    }

    if (!date) {
      showToast('Payment date is required', 'error')
      return
    }

    setRecording(true)
    try {
      const response = await api.post<{ message: string }>(`/dashboard/collection/loans/${loanId}/payment`, {
        utrNumber: utrNumber.trim(),
        amount: payAmount,
        date
      })
      showToast(response.message || 'Payment recorded successfully', 'success')
      
      setUtrNumber('')
      setAmount('')
      
      await fetchLoans()
      await fetchPayments(loanId)
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to record payment', 'error')
    } finally {
      setRecording(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Collection Dashboard</h1>
        <p>Record repayment transactions, check outstanding balances, and track payment histories.</p>
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
          <h3>No Active Collections</h3>
          <p className="text-sm text-muted">There are no disbursed loans currently awaiting repayment.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Loan Amount</th>
                <th>Total Repayment</th>
                <th>Amount Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const profile = typeof loan.profileId === 'object' && loan.profileId !== null ? loan.profileId : null
                const borrower = typeof loan.borrowerId === 'object' && loan.borrowerId !== null ? loan.borrowerId : null
                const isExpanded = expandedLoanId === loan._id
                const borrowerName = profile?.fullName || borrower?.name || '—'

                return (
                  <React.Fragment key={loan._id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => handleToggleExpand(loan._id)}>
                      <td>
                        <div className="font-semibold">{borrowerName}</div>
                        <div className="text-xs text-muted">{borrower?.email || '—'}</div>
                      </td>
                      <td>₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                      <td>₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                      <td className="text-success font-medium">₹{loan.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="text-danger font-semibold">₹{loan.outstandingBalance.toLocaleString('en-IN')}</td>
                      <td>
                        <StatusBadge status={loan.status} />
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleExpand(loan._id)
                          }}
                        >
                          {isExpanded ? 'Hide Details' : 'Payments & Record'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable details panel */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--color-bg)', padding: 'var(--space-5)', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                            {/* Left Side: Payments History */}
                            <div style={{ flex: '1 1 350px' }}>
                              <h4 className="mb-3 text-xs text-muted font-semibold">PAYMENT HISTORY</h4>
                              {loadingPayments ? (
                                <LoadingSpinner size={24} />
                              ) : payments.length === 0 ? (
                                <div className="text-xs text-muted" style={{ padding: 'var(--space-4) 0' }}>
                                  No payments have been recorded for this loan yet.
                                </div>
                              ) : (
                                <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                  <table className="table text-xs">
                                    <thead>
                                      <tr>
                                        <th>UTR Number</th>
                                        <th>Amount</th>
                                        <th>Date Paid</th>
                                        <th>Recorded By</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {payments.map((payment) => {
                                        const recordedBy = typeof payment.recordedBy === 'object' && payment.recordedBy !== null ? payment.recordedBy : null
                                        return (
                                          <tr key={payment._id}>
                                            <td style={{ fontFamily: 'var(--font-mono)' }}>{payment.utrNumber}</td>
                                            <td className="font-semibold text-success">₹{payment.amount.toLocaleString('en-IN')}</td>
                                            <td>
                                              {new Date(payment.date).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                              })}
                                            </td>
                                            <td>{recordedBy?.name || '—'}</td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* Right Side: Record a payment */}
                            {loan.status !== 'CLOSED' && (
                              <div style={{ flex: '1 1 250px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                                <h4 className="mb-3 text-xs text-muted font-semibold">RECORD NEW REPAYMENT</h4>
                                <form onSubmit={(e) => handleRecordPayment(e, loan._id)} className="flex flex-col gap-3">
                                  <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '11px' }} htmlFor={`utr-${loan._id}`}>UTR Number</label>
                                    <input
                                      id={`utr-${loan._id}`}
                                      type="text"
                                      className="input text-xs"
                                      placeholder="e.g. UTR123456789"
                                      value={utrNumber}
                                      onChange={(e) => setUtrNumber(e.target.value)}
                                      disabled={recording}
                                      required
                                    />
                                  </div>

                                  <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '11px' }} htmlFor={`amount-${loan._id}`}>Amount Paid (₹)</label>
                                    <input
                                      id={`amount-${loan._id}`}
                                      type="number"
                                      className="input text-xs"
                                      placeholder="e.g. 15000"
                                      value={amount}
                                      onChange={(e) => setAmount(e.target.value)}
                                      max={loan.outstandingBalance}
                                      disabled={recording}
                                      required
                                    />
                                    <span className="form-hint" style={{ fontSize: '10px' }}>
                                      Max outstanding: ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                                    </span>
                                  </div>

                                  <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '11px' }} htmlFor={`date-${loan._id}`}>Date Received</label>
                                    <input
                                      id={`date-${loan._id}`}
                                      type="date"
                                      className="input text-xs"
                                      value={date}
                                      onChange={(e) => setDate(e.target.value)}
                                      disabled={recording}
                                      required
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    className="btn btn-primary btn-sm btn-full mt-2"
                                    disabled={recording}
                                  >
                                    {recording ? 'Recording...' : 'Record Payment'}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
