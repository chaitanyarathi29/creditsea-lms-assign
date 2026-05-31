'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { BorrowerProfile, ProfileResponse } from '../lib/types'

export default function PersonalDetailsPage() {
  const [fullName, setFullName] = useState('')
  const [pan, setPan] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [employmentMode, setEmploymentMode] = useState<'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED'>('SALARIED')

  const [profile, setProfile] = useState<BorrowerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<ProfileResponse>('/borrower/profile')
        if (data.profile) {
          setProfile(data.profile)
          setFullName(data.profile.fullName)
          setPan(data.profile.pan)
          if (data.profile.dateOfBirth) {
            setDateOfBirth(new Date(data.profile.dateOfBirth).toISOString().split('T')[0] || '')
          }
          setMonthlySalary(data.profile.monthlySalary.toString())
          setEmploymentMode(data.profile.employmentMode)
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('not found') && !err.message.includes('404')) {
          showToast(err.message || 'Failed to fetch profile', 'error')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      showToast('Please enter your full name', 'error')
      return
    }

    const panUpper = pan.trim().toUpperCase()
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(panUpper)) {
      showToast('Invalid PAN format (e.g., ABCDE1234F)', 'error')
      return
    }

    if (!dateOfBirth) {
      showToast('Please select your date of birth', 'error')
      return
    }

    const salaryNum = parseFloat(monthlySalary)
    if (isNaN(salaryNum) || salaryNum <= 0) {
      showToast('Please enter a valid monthly salary', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post<ProfileResponse>('/borrower/profile', {
        fullName: fullName.trim(),
        pan: panUpper,
        dateOfBirth,
        monthlySalary: salaryNum,
        employmentMode
      })

      const updatedProfile = response.profile
      setProfile(updatedProfile)

      if (response.breStatus === 'PASSED' || updatedProfile.breStatus === 'PASSED') {
        showToast('Personal details verified successfully!', 'success')
        router.push('/apply/salary-slip')
      } else {
        showToast('Eligibility checks failed. Please review errors.', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit profile', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  const hasPassedBRE = profile?.breStatus === 'PASSED'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Personal Details</h1>
        <p>Complete your personal profile to run the eligibility verification check.</p>
      </div>

      {profile && profile.breStatus === 'FAILED' && (
        <div className="alert alert-error mb-6">
          <div>
            <div className="font-semibold mb-2">Eligibility Check Failed:</div>
            <ul style={{ paddingLeft: 'var(--space-4)', margin: 0 }}>
              {profile.breErrors?.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <div className="mt-2 text-xs">
              Please review and update your information below to try again.
            </div>
          </div>
        </div>
      )}

      {hasPassedBRE ? (
        <div className="card flex flex-col gap-6">
          <div className="alert alert-success">
            <div>
              <div className="font-semibold">Verification Passed</div>
              <div>Your profile meets all initial lending eligibility criteria.</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <div className="form-label text-muted">Full Name</div>
              <div className="font-medium mt-1">{profile.fullName}</div>
            </div>
            <div>
              <div className="form-label text-muted">PAN Card Number</div>
              <div className="font-medium mt-1">{profile.pan}</div>
            </div>
            <div>
              <div className="form-label text-muted">Date of Birth</div>
              <div className="font-medium mt-1">
                {new Date(profile.dateOfBirth).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div>
              <div className="form-label text-muted">Monthly Salary</div>
              <div className="font-medium mt-1">
                ₹{profile.monthlySalary.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="form-label text-muted">Employment Mode</div>
              <div className="font-medium mt-1">{profile.employmentMode}</div>
            </div>
            <div>
              <div className="form-label text-muted">BRE Verification</div>
              <div className="mt-1">
                <span className="badge badge-passed">PASSED</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              className="btn btn-primary"
              onClick={() => router.push('/apply/salary-slip')}
            >
              Continue to Salary Slip Upload
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name (as on PAN)</label>
            <input
              id="fullName"
              type="text"
              className="input"
              placeholder="e.g. Johnathan Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="pan">PAN Card Number</label>
              <input
                id="pan"
                type="text"
                className="input"
                placeholder="e.g. ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                disabled={submitting}
                style={{ textTransform: 'uppercase' }}
                required
              />
              <span className="form-hint">Format: 5 letters, 4 digits, 1 letter</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                type="date"
                className="input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={submitting}
                required
              />
              <span className="form-hint">Must be between 23 and 50 years old</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="salary">Monthly Net Salary (₹)</label>
              <input
                id="salary"
                type="number"
                className="input"
                placeholder="e.g. 35000"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                disabled={submitting}
                required
              />
              <span className="form-hint">Minimum required: ₹25,000</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="employment">Employment Mode</label>
              <select
                id="employment"
                className="input"
                value={employmentMode}
                onChange={(e) => setEmploymentMode(e.target.value as any)}
                disabled={submitting}
                required
              >
                <option value="SALARIED">Salaried</option>
                <option value="SELF_EMPLOYED">Self-Employed</option>
                <option value="UNEMPLOYED">Unemployed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Verifying...' : 'Verify Eligibility'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
