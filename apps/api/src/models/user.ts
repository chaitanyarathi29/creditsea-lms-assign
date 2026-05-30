
import mongoose, { Schema, Document } from 'mongoose'

export type Role =
  | 'ADMIN'
  | 'SALES'
  | 'SANCTION'
  | 'DISBURSEMENT'
  | 'COLLECTION'
  | 'BORROWER'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: Role
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        'ADMIN',
        'SALES',
        'SANCTION',
        'DISBURSEMENT',
        'COLLECTION',
        'BORROWER',
      ],
      default: 'BORROWER',
    },
  },
  { timestamps: true }
)

export const User = mongoose.model<IUser>('User', userSchema)
