import multer from 'multer'
import type { Request } from 'express'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const storage = multer.memoryStorage()

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
