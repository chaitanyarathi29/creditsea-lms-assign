import mongoose, { Schema, Document } from 'mongoose'

export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED'
export type BreStatus = 'PENDING' | 'PASSED' | 'FAILED'

export interface IBorrowerProfile extends Document {
  userId: mongoose.Types.ObjectId
  fullName: string
  pan: string
  dateOfBirth: Date
  monthlySalary: number
  employmentMode: EmploymentMode
  salarySlipUrl: string | null
  breStatus: BreStatus
  breErrors: string[]
}

const borrowerProfileSchema = new Schema<IBorrowerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    pan: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    monthlySalary: {
      type: Number,
      required: true,
    },

    employmentMode: {
      type: String,
      enum: ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'],
      required: true,
    },

    salarySlipUrl: {
      type: String,
      default: null,
    },

    breStatus: {
      type: String,
      enum: ['PENDING', 'PASSED', 'FAILED'],
      default: 'PENDING',
    },

    breErrors: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
)

export const BorrowerProfile = mongoose.model<IBorrowerProfile>(
  'BorrowerProfile',
  borrowerProfileSchema
)
