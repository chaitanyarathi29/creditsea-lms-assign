/* ─── Shared TypeScript Types ─── */

export type Role = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER'
export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED'
export type BreStatus = 'PENDING' | 'PASSED' | 'FAILED'
export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface BorrowerProfile {
  _id: string
  userId: string
  fullName: string
  pan: string
  dateOfBirth: string
  monthlySalary: number
  employmentMode: EmploymentMode
  salarySlipUrl: string | null
  breStatus: BreStatus
  breErrors: string[]
  createdAt: string
  updatedAt: string
}

export interface Loan {
  _id: string
  borrowerId: string | { _id: string; name: string; email: string }
  profileId: string | { _id: string; fullName: string; pan: string; monthlySalary?: number; employmentMode?: string }
  loanAmount: number
  tenure: number
  interestRate: number
  simpleInterest: number
  totalRepayment: number
  amountPaid: number
  outstandingBalance: number
  status: LoanStatus
  rejectionReason: string | null
  sanctionedBy: string | { _id: string; name: string } | null
  disbursedBy: string | { _id: string; name: string } | null
  sanctionedAt: string | null
  disbursedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Payment {
  _id: string
  loanId: string
  utrNumber: string
  amount: number
  date: string
  recordedBy: string | { _id: string; name: string }
  createdAt: string
}

export interface Lead {
  _id: string
  name: string
  email: string
  role: Role
  createdAt: string
  profile: BorrowerProfile | null
}

/* ─── API Response Shapes ─── */

export interface AuthResponse {
  message: string
  token: string
  user: User
}

export interface ProfileResponse {
  message?: string
  breStatus?: 'PASSED' | 'FAILED'
  breErrors?: string[]
  profile: BorrowerProfile
}

export interface LoanApplyResponse {
  message: string
  loan: Loan
}

export interface LoansResponse {
  loans: Loan[]
  count?: number
}

export interface LeadsResponse {
  leads: Lead[]
  count: number
}

export interface PaymentResponse {
  message: string
  payment: Payment
  loan: Loan
}

export interface LoanPaymentsResponse {
  loan: {
    id: string
    totalRepayment: number
    amountPaid: number
    outstandingBalance: number
    status: LoanStatus
  }
  payments: Payment[]
}
