import { Role } from '../models/user'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: Role
      }
    }

    namespace Multer {
      interface File {
        location?: string
        key?: string
        bucket?: string
      }
    }
  }
}

export {}
