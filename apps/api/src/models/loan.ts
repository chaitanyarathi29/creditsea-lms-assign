import mongoose, { Schema, Document } from 'mongoose'

export type LoanStatus =
  | 'APPLIED'
  | 'SANCTIONED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CLOSED'

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId
  profileId: mongoose.Types.ObjectId
  loanAmount: number
  tenure: number
  interestRate: number
  simpleInterest: number
  totalRepayment: number
  amountPaid: number
  outstandingBalance: number
  status: LoanStatus
  rejectionReason: string | null
  sanctionedBy: mongoose.Types.ObjectId | null
  disbursedBy: mongoose.Types.ObjectId | null
  sanctionedAt: Date | null
  disbursedAt: Date | null
  closedAt: Date | null
}

const loanSchema = new Schema<ILoan>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'BorrowerProfile',
      required: true,
    },

    loanAmount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },

    tenure: {
      type: Number,
      required: true,
      min: 30,
      max: 365,
    },

    interestRate: {
      type: Number,
      default: 12,
    },

    simpleInterest: {
      type: Number,
      required: true,
    },

    totalRepayment: {
      type: Number,
      required: true,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    outstandingBalance: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['APPLIED', 'SANCTIONED', 'REJECTED', 'DISBURSED', 'CLOSED'],
      default: 'APPLIED',
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    sanctionedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    disbursedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    sanctionedAt: {
      type: Date,
      default: null,
    },

    disbursedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

export const Loan = mongoose.model<ILoan>('Loan', loanSchema)
