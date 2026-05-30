import multer from 'multer'
import path from 'path'
import type { Request } from 'express'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const storage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'salary-slips'))
  },
  filename: (req: Request, file, cb) => {
    const userId = req.user?.id || 'unknown'
    const ext = path.extname(file.originalname)
    const filename = `${userId}_${Date.now()}${ext}`
    cb(null, filename)
  },
})

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are accepted'))
  }
}

export const uploadSalarySlip = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
})
