'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { BorrowerProfile, ProfileResponse, LoanApplyResponse } from '../../lib/types'

export default function LoanConfigPage() {
  const [profile, setProfile] = useState<BorrowerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loanAmount, setLoanAmount] = useState(100000)
  const [tenure, setTenure] = useState(90)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<ProfileResponse>('/borrower/profile')
        if (data.profile) {
          setProfile(data.profile)
          if (data.profile.breStatus !== 'PASSED') {
            showToast('Please pass the eligibility checks first', 'warning')
            router.push('/apply')
          } else if (!data.profile.salarySlipUrl) {
            showToast('Please upload your salary slip first', 'warning')
            router.push('/apply/salary-slip')
          }
        } else {
          router.push('/apply')
        }
      } catch (err: any) {
        showToast('Please complete your personal details first', 'warning')
        router.push('/apply')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router, showToast])

  // Math variables
  const interestRate = 12 // 12% p.a.
  const simpleInterest = parseFloat(((loanAmount * interestRate * tenure) / (365 * 100)).toFixed(2))
  const totalRepayment = parseFloat((loanAmount + simpleInterest).toFixed(2))

  const handleApply = async () => {
    setSubmitting(true)
    try {
      await api.post<LoanApplyResponse>('/borrower/loan/apply', {
        loanAmount,
        tenure
      })
      showToast('Loan application submitted successfully!', 'success')
      router.push('/apply/status')
    } catch (err: any) {
      showToast(err.message || 'Application failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Configure Loan</h1>
        <p>Select your desired loan amount and repayment tenure.</p>
      </div>

      <div className="card flex flex-col gap-8">
        {/* Sliders */}
        <div className="flex flex-col gap-6">
          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label" htmlFor="amount-slider">Loan Amount</label>
              <span className="font-semibold text-accent" style={{ fontSize: 'var(--text-lg)' }}>
                ₹{loanAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              id="amount-slider"
              type="range"
              min="50000"
              max="500000"
              step="10000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              disabled={submitting}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Min: ₹50,000</span>
              <span>Max: ₹5,00,000</span>
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label" htmlFor="tenure-slider">Repayment Tenure</label>
              <span className="font-semibold text-accent" style={{ fontSize: 'var(--text-lg)' }}>
                {tenure} Days
              </span>
            </div>
            <input
              id="tenure-slider"
              type="range"
              min="30"
              max="365"
              step="1"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              disabled={submitting}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Min: 30 days</span>
              <span>Max: 365 days</span>
            </div>
          </div>
        </div>

        {/* Calculation Panel */}
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}
        >
          <div className="font-semibold text-sm mb-2" style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 'var(--space-2)' }}>
            LOAN SUMMARY
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Principal Amount</span>
            <span className="font-medium">₹{loanAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Interest Rate</span>
            <span className="font-medium">{interestRate}% p.a. (Fixed)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Tenure Period</span>
            <span className="font-medium">{tenure} Days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Calculated Interest</span>
            <span className="font-medium text-accent">₹{simpleInterest.toLocaleString('en-IN')}</span>
          </div>
          <div className="divider" style={{ margin: 'var(--space-2) 0' }} />
          <div className="flex justify-between" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
            <span>Total Repayment</span>
            <span>₹{totalRepayment.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-4" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-6)' }}>
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/apply/salary-slip')}
            disabled={submitting}
          >
            Back
          </button>
          
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={submitting}
          >
            {submitting ? 'Submitting Application...' : 'Apply for Loan'}
          </button>
        </div>
      </div>
    </div>
  )
}
