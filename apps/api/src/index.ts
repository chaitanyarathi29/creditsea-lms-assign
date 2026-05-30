import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { connectToDB } from './db/db'
import authRouter from './routes/auth'
import borrowerRouter from './routes/borrower'
import dashboardRouter from './routes/dashboard'

export const app = express()
const PORT = process.env.PORT || 8000

app.use(express.json())
app.use(cors())

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'salary-slips')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes
app.use('/api/auth', authRouter)
app.use('/api/borrower', borrowerRouter)
app.use('/api/dashboard', dashboardRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

connectToDB()

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})