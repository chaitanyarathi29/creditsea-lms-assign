import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/user'
import type {IUser} from '../models/user'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )
}

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password required' })

  try {
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'user exists' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed, role: 'BORROWER' })
    const token = generateToken(user)

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'server error' })
  }
}

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'email and password required' })

  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'invalid credentials' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: 'invalid credentials' })

    const token = generateToken(user)
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'server error' })
  }
}
