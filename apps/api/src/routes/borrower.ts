import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { uploadSalarySlip } from '../middlewares/upload.middleware'
import * as borrowerController from '../controllers/borrowerController'

const router = express.Router()

// All borrower routes require auth + BORROWER role
router.use(authMiddleware)
router.use(requireRole('BORROWER'))

// Profile
router.post('/profile', borrowerController.submitProfile)
router.get('/profile', borrowerController.getProfile)

// Salary slip upload
router.post('/salary-slip', uploadSalarySlip.single('salarySlip'), borrowerController.uploadSalarySlip)

// Loans
router.post('/loan/apply', borrowerController.applyForLoan)
router.get('/loans', borrowerController.getLoans)

export default router
