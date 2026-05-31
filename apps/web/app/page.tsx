'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './lib/auth'
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'

interface MockLoan {
  id: string
  borrower: string
  employment: string
  amount: number
  status: 'DISBURSED' | 'PENDING' | 'SANCTIONED' | 'CLOSED' | 'REJECTED'
  rate: number
  tenure: number
}

const INITIAL_MOCK_LOANS: MockLoan[] = [
  { id: 'L-8941', borrower: 'Aditya Sharma', employment: 'SALARIED', amount: 120000, status: 'DISBURSED', rate: 10.5, tenure: 12 },
  { id: 'L-8942', borrower: 'Pooja Patel', employment: 'SELF_EMPLOYED', amount: 350000, status: 'SANCTIONED', rate: 13.5, tenure: 24 },
  { id: 'L-8943', borrower: 'Rohan Mehta', employment: 'SALARIED', amount: 75000, status: 'CLOSED', rate: 10.5, tenure: 6 },
  { id: 'L-8944', borrower: 'Sneha Reddy', employment: 'SALARIED', amount: 500000, status: 'PENDING', rate: 10.5, tenure: 36 },
  { id: 'L-8945', borrower: 'Vikram Singh', employment: 'UNEMPLOYED', amount: 150000, status: 'REJECTED', rate: 18.0, tenure: 18 },
  { id: 'L-8946', borrower: 'Ananya Gupta', employment: 'SELF_EMPLOYED', amount: 200000, status: 'DISBURSED', rate: 13.5, tenure: 12 }
]

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Calculator states
  const [loanAmount, setLoanAmount] = useState<number>(150000)
  const [tenure, setTenure] = useState<number>(12)
  const [employmentMode, setEmploymentMode] = useState<'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED'>('SALARIED')

  // Live status ticker
  const [loans, setLoans] = useState<MockLoan[]>(INITIAL_MOCK_LOANS)
  const [lastUpdated, setLastUpdated] = useState<string>('Just now')
  const [tick, setTick] = useState<number>(0)

  // Simulation of live additions / status modifications
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
      setLastUpdated('Updated just now')

      setLoans((prevLoans) => {
        // Randomly modify a status or amount of a loan
        const next = [...prevLoans]
        const idx = Math.floor(Math.random() * next.length)
        const loan = { ...next[idx] }

        if (loan.status === 'PENDING') {
          loan.status = Math.random() > 0.4 ? 'SANCTIONED' : 'REJECTED'
        } else if (loan.status === 'SANCTIONED') {
          loan.status = 'DISBURSED'
        } else if (loan.status === 'DISBURSED' && Math.random() > 0.8) {
          loan.status = 'CLOSED'
        } else {
          loan.status = 'PENDING'
          loan.amount = Math.floor((Math.random() * 400000 + 50000) / 5000) * 5000
        }

        next[idx] = loan
        return next
      })

      // Reset text after 2 seconds
      setTimeout(() => {
        setLastUpdated('Updated 30s ago')
      }, 3000)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <LoadingSpinner size={48} />
      </div>
    )
  }

  // Calculate rate dynamically based on employment mode
  const getRate = () => {
    if (employmentMode === 'SALARIED') return 10.5
    if (employmentMode === 'SELF_EMPLOYED') return 13.5
    return 0 // Not eligible
  }

  const rate = getRate()
  const isEligible = employmentMode !== 'UNEMPLOYED' && loanAmount >= 25000

  // Calculate EMI: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const calculateEMI = () => {
    if (!isEligible) return 0
    const monthlyRate = rate / 12 / 100
    const totalPayments = tenure
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
    return Math.round(emi)
  }

  const emi = calculateEMI()
  const totalRepayment = emi * tenure
  const totalInterest = totalRepayment - loanAmount

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{ padding: 'var(--space-16) 0 var(--space-12)', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-12)', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="text-uppercase-subtitle">LENDING PLATFORM</div>
            <h1 className="text-serif" style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-light)', lineHeight: '1.1', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
              Assurance for <br />
              <span style={{ fontStyle: 'italic', fontWeight: 'var(--weight-normal)' }}>borrowers</span> who value speed and clarity.
            </h1>
            
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '520px' }}>
              CreditSea delivers an instant automated eligibility engine, lightning-fast document uploading, and real-time ledger status updates inside a high-end, elegant portal.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-2)' }}>
              {user ? (
                <Link href={user.role === 'BORROWER' ? '/apply' : '/dashboard'} className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="btn btn-primary btn-lg">
                    Apply for a Loan
                  </Link>
                  <Link href="/login" className="btn btn-ghost btn-lg">
                    Sign in to Account
                  </Link>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-6)', paddingTop: '0' }}>
              <div>
                <div className="text-serif" style={{ fontSize: '1.8rem', fontWeight: 'var(--weight-medium)' }}>99.8%</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Approval Cadence</div>
              </div>
              <div>
                <div className="text-serif" style={{ fontSize: '1.8rem', fontWeight: 'var(--weight-medium)' }}>10 mins</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Disbursal Time</div>
              </div>
              <div>
                <div className="text-serif" style={{ fontSize: '1.8rem', fontWeight: 'var(--weight-medium)' }}>100%</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Digital Process</div>
              </div>
            </div>
          </div>

          {/* Floated Estimate Card widget */}
          <div id="estimator" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="card-luxury" style={{ padding: 'var(--space-8)', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <span className="text-uppercase-subtitle" style={{ color: 'var(--color-text)' }}>Loan Calculator</span>
                <span className="badge badge-passed">Rates from {getRate()}% APR</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                
                {/* Employment selector */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Employment Category</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {employmentMode === 'SALARIED' ? 'Salaried (10.5%)' : employmentMode === 'SELF_EMPLOYED' ? 'Self-Employed (13.5%)' : 'Unemployed'}
                    </span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', marginTop: '4px' }}>
                    {(['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setEmploymentMode(mode)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 'var(--radius-md)',
                          border: employmentMode === mode ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                          background: employmentMode === mode ? 'var(--color-accent-subtle)' : 'transparent',
                          color: 'var(--color-text)',
                          fontSize: '0.75rem',
                          fontWeight: employmentMode === mode ? '600' : '400',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {mode.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount slider */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span className="form-label">Requested Principal</span>
                    <span className="font-semibold" style={{ fontSize: '1.05rem' }}>₹{loanAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="25000"
                    max="1000000"
                    step="5000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    style={{ marginTop: '8px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>₹25,000</span>
                    <span>₹10,00,000</span>
                  </div>
                </div>

                {/* Tenure Slider */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span className="form-label">Duration</span>
                    <span className="font-semibold" style={{ fontSize: '1.05rem' }}>{tenure} Months</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="36"
                    step="3"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    style={{ marginTop: '8px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>3 Months</span>
                    <span>36 Months</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Estimated EMI</span>
                    <div className="text-serif" style={{ fontSize: '1.5rem', fontWeight: '600', color: isEligible ? 'var(--color-text)' : 'var(--color-danger)' }}>
                      {isEligible ? `₹${emi.toLocaleString('en-IN')}` : 'Ineligible'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Payment</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: '500', marginTop: '4px' }}>
                      {isEligible ? `₹${totalRepayment.toLocaleString('en-IN')}` : '—'}
                    </div>
                  </div>
                </div>

                {!isEligible && (
                  <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '11px', borderRadius: 'var(--radius-md)' }}>
                    Unemployed individuals are currently outside our credit check capability parameters.
                  </div>
                )}

                <Link
                  href={user ? '/apply' : '/signup'}
                  className={`btn btn-primary btn-full ${!isEligible ? 'btn-ghost' : ''}`}
                  style={{ pointerEvents: isEligible ? 'auto' : 'none', opacity: isEligible ? 1 : 0.4 }}
                >
                  Proceed to Application
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" style={{ padding: 'var(--space-12) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 'var(--space-12)', marginBottom: 'var(--space-12)' }}>
            <div>
              <div className="text-uppercase-subtitle" style={{ marginBottom: 'var(--space-2)' }}>CAPABILITIES</div>
              <h2 className="text-serif" style={{ fontSize: '2rem', fontWeight: 'var(--weight-light)', lineHeight: '1.2' }}>
                A disciplined credit stack for borrowers and administrators.
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                We manage the entire loan lifecycle digitally—from automated underwriting constraints (BRE check) to instantaneous salary parsing ledgers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <h3 className="font-semibold" style={{ fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-text)', borderRadius: '50%' }}></span>
                  Automated BRE Checking
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  System checks age ranges, valid PAN patterns, and minimum incomes instantly to verify credit limits.
                </p>
              </div>

              <div style={{ padding: 'var(--space-6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <h3 className="font-semibold" style={{ fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-text)', borderRadius: '50%' }}></span>
                  Salary slip parser
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  Upload a PDF salary slip, and our file validator logs records into the executive's ledger instantly.
                </p>
              </div>

              <div style={{ padding: 'var(--space-6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <h3 className="font-semibold" style={{ fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-text)', borderRadius: '50%' }}></span>
                  Flexible configurations
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  Adjust amount levels, month tenures, and review pre-generated schedules with total clarity.
                </p>
              </div>

              <div style={{ padding: 'var(--space-6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <h3 className="font-semibold" style={{ fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-text)', borderRadius: '50%' }}></span>
                  Secure Disbursals
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  Admin executives authorize loan status logs with a single click, triggering immediate ledger audits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Tracked Status Section */}
      <section id="status" style={{ padding: 'var(--space-12) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
            <div>
              <span className="text-uppercase-subtitle">LIVE STREAMS</span>
              <h2 className="text-serif" style={{ fontSize: '1.8rem', fontWeight: 'var(--weight-light)', marginTop: '4px' }}>
                Global ledger activity index.
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
              <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block', animation: 'spin 2s linear infinite' }}></span>
              <span className="font-medium">{loans.length} Active Trackers</span>
              <span style={{ color: 'var(--color-text-muted)' }}>|</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{lastUpdated}</span>
            </div>
          </div>

          <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>LOAN ID</th>
                  <th>APPLICANT</th>
                  <th>EMPLOYMENT</th>
                  <th>PRINCIPAL</th>
                  <th>STATUS</th>
                  <th>INTEREST RATE</th>
                  <th>DURATION</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} style={{ transition: 'background 0.3s ease' }}>
                    <td className="font-semibold" style={{ color: 'var(--color-text)' }}>{loan.id}</td>
                    <td>{loan.borrower}</td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '500' }}>{loan.employment}</span>
                    </td>
                    <td className="font-medium" style={{ color: 'var(--color-text)' }}>₹{loan.amount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge badge-${loan.status.toLowerCase()}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td>{loan.rate}% APR</td>
                    <td>{loan.tenure} Months</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Charcoal black call-to-action block */}
      <section id="assurance" style={{ background: '#121212', color: '#ffffff', padding: 'var(--space-16) 0', borderTop: '1px solid #222222' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-12)', alignItems: 'center' }}>
          <div>
            <div className="text-uppercase-subtitle" style={{ color: '#888888', marginBottom: '8px' }}>RELIABILITY & COMPLIANCE</div>
            <h2 className="text-serif" style={{ fontSize: '2.25rem', fontWeight: 'var(--weight-light)', color: '#ffffff', lineHeight: '1.2' }}>
              Built for real underwriting, <br />not just mock application forms.
            </h2>
            <p style={{ color: '#aaaaaa', marginTop: 'var(--space-4)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '540px' }}>
              CreditSea executes formal compliance layers behind the scenes. We log structural file indexes, prevent identity bypass, and verify salary metrics within bank guidelines.
            </p>
          </div>

          <div className="card" style={{ background: '#1c1c1c', border: '1px solid #333333', color: '#ffffff', padding: 'var(--space-8)' }}>
            <span className="text-uppercase-subtitle" style={{ color: '#888888' }}>COMPLIANCE CHECKLIST</span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-6) 0 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="8" fill="#2e7d32" />
                  <path d="M5 8l2 2 4-4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Automated PAN parsing & tax checking</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="8" fill="#2e7d32" />
                  <path d="M5 8l2 2 4-4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Salary stub file format verification</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="8" fill="#2e7d32" />
                  <path d="M5 8l2 2 4-4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Immutable ledgers locked upon executive sanction</span>
              </li>
            </ul>
            <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid #333333', paddingTop: 'var(--space-6)' }}>
              <Link href={user ? '/apply' : '/signup'} className="btn btn-primary btn-full" style={{ background: '#ffffff', color: '#000000' }}>
                Get Started Securely
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Elegant minimalist footer */}
      <footer style={{ padding: 'var(--space-8) 0', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>© {new Date().getFullYear()} CreditSea Technologies Inc. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <a href="#estimator" style={{ color: 'inherit' }}>Calculator</a>
            <a href="#capabilities" style={{ color: 'inherit' }}>Capabilities</a>
            <a href="#status" style={{ color: 'inherit' }}>Live Status</a>
            <a href="/login" style={{ color: 'inherit' }}>Sign In</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
