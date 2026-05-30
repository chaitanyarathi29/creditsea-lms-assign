import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  id: string
  role: 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER'
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Unauthorized: token missing',
      })
    }

    const token = authHeader.split(' ')[1]

    const secret = process.env.JWT_SECRET

    if(!secret){
        console.log('secret not provided')
        return;
    }
    if(!token){
        return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = {
      id: decoded.id,
      role: decoded.role,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized: invalid token',
    })
  }
}
