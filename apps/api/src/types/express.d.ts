import { Role } from '../models/user'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: Role
      }
    }
  }
}

export {}
