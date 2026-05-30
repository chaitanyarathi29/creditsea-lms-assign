import { BorrowerProfile } from '../models/borrowerProfile'
import { Loan } from '../models/loan'
import { runBRE } from './breService'
import type { BreInput } from './breService'

/**
 * Create or update borrower profile + run BRE
 */
export async function submitProfile(
  userId: string,
  data: {
    fullName: string
    pan: string
    dateOfBirth: string
    monthlySalary: number
    employmentMode: 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED'
  }
) {
  const breInput: BreInput = {
    dateOfBirth: new Date(data.dateOfBirth),
    monthlySalary: data.monthlySalary,
    pan: data.pan.toUpperCase().trim(),
    employmentMode: data.employmentMode,
  }

  const breResult = runBRE(breInput)

  const profileData = {
    userId,
    fullName: data.fullName.trim(),
    pan: data.pan.toUpperCase().trim(),
    dateOfBirth: new Date(data.dateOfBirth),
    monthlySalary: data.monthlySalary,
    employmentMode: data.employmentMode,
    breStatus: breResult.passed ? ('PASSED' as const) : ('FAILED' as const),
    breErrors: breResult.errors,
  }

  // Upsert — allows borrower to re-submit if BRE failed
  const profile = await BorrowerProfile.findOneAndUpdate(
    { userId },
    profileData,
    { new: true, upsert: true, runValidators: true }
  )

  return { profile, breResult }
}

/**
 * Get borrower profile by userId
 */
export async function getProfile(userId: string) {
  return BorrowerProfile.findOne({ userId })
}

/**
 * Update salary slip URL on profile
 */
export async function updateSalarySlip(userId: string, fileUrl: string) {
  const profile = await BorrowerProfile.findOne({ userId })
  if (!profile) {
    throw new Error('Profile not found. Please submit your personal details first.')
  }

  profile.salarySlipUrl = fileUrl
  await profile.save()
  return profile
}

/**
 * Calculate Simple Interest and create a loan application
 * Enforces: one active loan at a time
 */
export async function applyForLoan(
  userId: string,
  data: { loanAmount: number; tenure: number }
) {
  // 1. Check profile exists and BRE passed
  const profile = await BorrowerProfile.findOne({ userId })
  if (!profile) {
    throw new Error('Profile not found. Please submit your personal details first.')
  }
  if (profile.breStatus !== 'PASSED') {
    throw new Error('Your eligibility check has not passed. Please update your profile.')
  }
  if (!profile.salarySlipUrl) {
    throw new Error('Please upload your salary slip before applying.')
  }

  // 2. Check no active loan exists
  const activeLoan = await Loan.findOne({
    borrowerId: userId,
    status: { $in: ['APPLIED', 'SANCTIONED', 'DISBURSED'] },
  })
  if (activeLoan) {
    throw new Error(
      `You already have an active loan (status: ${activeLoan.status}). Only one active loan is allowed at a time.`
    )
  }

  // 3. Validate ranges
  if (data.loanAmount < 50000 || data.loanAmount > 500000) {
    throw new Error('Loan amount must be between ₹50,000 and ₹5,00,000')
  }
  if (data.tenure < 30 || data.tenure > 365) {
    throw new Error('Tenure must be between 30 and 365 days')
  }

  // 4. Calculate SI: (P × R × T) / (365 × 100)
  const P = data.loanAmount
  const R = 12 // fixed 12% p.a.
  const T = data.tenure
  const simpleInterest = parseFloat(((P * R * T) / (365 * 100)).toFixed(2))
  const totalRepayment = parseFloat((P + simpleInterest).toFixed(2))

  // 5. Create loan
  const loan = await Loan.create({
    borrowerId: userId,
    profileId: profile._id,
    loanAmount: P,
    tenure: T,
    interestRate: R,
    simpleInterest,
    totalRepayment,
    outstandingBalance: totalRepayment,
    status: 'APPLIED',
  })

  return loan
}

/**
 * Get all loans for a borrower
 */
export async function getBorrowerLoans(userId: string) {
  return Loan.find({ borrowerId: userId }).sort({ createdAt: -1 })
}
