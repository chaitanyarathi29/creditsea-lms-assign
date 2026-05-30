import type { Request, Response, NextFunction } from 'express'
import type { Role } from '../models/user'

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized',
      })
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        message: 'Forbidden: you do not have access to this resource',
      })
    }

    next()
  }
}
