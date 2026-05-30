import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import * as dashboardController from '../controllers/dashboardController'

const router = express.Router()

// All dashboard routes require authentication
router.use(authMiddleware)

// ─── SALES MODULE ───────────────────────────────────────────────
router.get(
  '/sales/leads',
  requireRole('SALES', 'ADMIN'),
  dashboardController.getLeads
)

// ─── SANCTION MODULE ────────────────────────────────────────────
router.get(
  '/sanction/loans',
  requireRole('SANCTION', 'ADMIN'),
  dashboardController.getAppliedLoans
)
router.patch(
  '/sanction/loans/:id/approve',
  requireRole('SANCTION', 'ADMIN'),
  dashboardController.approveLoan
)
router.patch(
  '/sanction/loans/:id/reject',
  requireRole('SANCTION', 'ADMIN'),
  dashboardController.rejectLoan
)

// ─── DISBURSEMENT MODULE ────────────────────────────────────────
router.get(
  '/disbursement/loans',
  requireRole('DISBURSEMENT', 'ADMIN'),
  dashboardController.getSanctionedLoans
)
router.patch(
  '/disbursement/loans/:id/disburse',
  requireRole('DISBURSEMENT', 'ADMIN'),
  dashboardController.disburseLoan
)

// ─── COLLECTION MODULE ─────────────────────────────────────────
router.get(
  '/collection/loans',
  requireRole('COLLECTION', 'ADMIN'),
  dashboardController.getDisbursedLoans
)
router.post(
  '/collection/loans/:id/payment',
  requireRole('COLLECTION', 'ADMIN'),
  dashboardController.recordPayment
)
router.get(
  '/collection/loans/:id/payments',
  requireRole('COLLECTION', 'ADMIN'),
  dashboardController.getLoanPayments
)

export default router
