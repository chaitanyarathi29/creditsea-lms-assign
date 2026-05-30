import mongoose, { Schema, Document } from 'mongoose'

export interface IPayment extends Document {
  loanId: mongoose.Types.ObjectId
  utrNumber: string
  amount: number
  date: Date
  recordedBy: mongoose.Types.ObjectId
}

const paymentSchema = new Schema<IPayment>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },

    utrNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    date: {
      type: Date,
      required: true,
    },

    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)
