import type { Request, Response } from 'express'
import * as dashboardService from '../services/dashboardService'

// ─── SALES ──────────────────────────────────────────────────────

/**
 * GET /api/dashboard/sales/leads
 */
export const getLeads = async (_req: Request, res: Response) => {
  try {
    const leads = await dashboardService.getLeads()
    res.status(200).json({ leads, count: leads.length })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

// ─── SANCTION ───────────────────────────────────────────────────

/**
 * GET /api/dashboard/sanction/loans
 */
export const getAppliedLoans = async (_req: Request, res: Response) => {
  try {
    const loans = await dashboardService.getAppliedLoans()
    res.status(200).json({ loans, count: loans.length })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

/**
 * PATCH /api/dashboard/sanction/loans/:id/approve
 */
export const approveLoan = async (req: Request, res: Response) => {
  try {
    const loan = await dashboardService.approveLoan(req.params.id as string, req.user!.id)
    res.status(200).json({ message: 'Loan approved', loan })
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Approval failed' })
  }
}

/**
 * PATCH /api/dashboard/sanction/loans/:id/reject
 */
export const rejectLoan = async (req: Request, res: Response) => {
  try {
    const { rejectionReason } = req.body
    const loan = await dashboardService.rejectLoan(
      req.params.id as string,
      req.user!.id,
      rejectionReason
    )
    res.status(200).json({ message: 'Loan rejected', loan })
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Rejection failed' })
  }
}

// ─── DISBURSEMENT ───────────────────────────────────────────────

/**
 * GET /api/dashboard/disbursement/loans
 */
export const getSanctionedLoans = async (_req: Request, res: Response) => {
  try {
    const loans = await dashboardService.getSanctionedLoans()
    res.status(200).json({ loans, count: loans.length })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

/**
 * PATCH /api/dashboard/disbursement/loans/:id/disburse
 */
export const disburseLoan = async (req: Request, res: Response) => {
  try {
    const loan = await dashboardService.disburseLoan(req.params.id as string, req.user!.id)
    res.status(200).json({ message: 'Loan disbursed', loan })
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Disbursement failed' })
  }
}

// ─── COLLECTION ─────────────────────────────────────────────────

/**
 * GET /api/dashboard/collection/loans
 */
export const getDisbursedLoans = async (_req: Request, res: Response) => {
  try {
    const loans = await dashboardService.getDisbursedLoans()
    res.status(200).json({ loans, count: loans.length })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

/**
 * POST /api/dashboard/collection/loans/:id/payment
 */
export const recordPayment = async (req: Request, res: Response) => {
  try {
    const { utrNumber, amount, date } = req.body
    const result = await dashboardService.recordPayment(
      req.params.id as string,
      req.user!.id,
      { utrNumber, amount: Number(amount), date }
    )
    res.status(201).json({
      message: result.loan.status === 'CLOSED'
        ? 'Payment recorded. Loan is now fully paid and CLOSED.'
        : 'Payment recorded successfully',
      payment: result.payment,
      loan: result.loan,
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Payment recording failed' })
  }
}

/**
 * GET /api/dashboard/collection/loans/:id/payments
 */
export const getLoanPayments = async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getLoanPayments(req.params.id as string)
    res.status(200).json(result)
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to fetch payments' })
  }
}
