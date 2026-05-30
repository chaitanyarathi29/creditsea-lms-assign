/**
 * Seed Script
 *
 * Pre-creates one account per role with known credentials
 * so the evaluator can log in and test each role immediately.
 *
 * Usage: bun run src/db/seed.ts
 */

import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { User } from '../models/user'
import type { Role } from '../models/user'

dotenv.config()

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/lms'

interface SeedUser {
  name: string
  email: string
  password: string
  role: Role
}

const seedUsers: SeedUser[] = [
  {
    name: 'Admin User',
    email: 'admin@lms.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  {
    name: 'Sales Executive',
    email: 'sales@lms.com',
    password: 'sales123',
    role: 'SALES',
  },
  {
    name: 'Sanction Executive',
    email: 'sanction@lms.com',
    password: 'sanction123',
    role: 'SANCTION',
  },
  {
    name: 'Disbursement Executive',
    email: 'disbursement@lms.com',
    password: 'disbursement123',
    role: 'DISBURSEMENT',
  },
  {
    name: 'Collection Executive',
    email: 'collection@lms.com',
    password: 'collection123',
    role: 'COLLECTION',
  },
  {
    name: 'Test Borrower',
    email: 'borrower@lms.com',
    password: 'borrower123',
    role: 'BORROWER',
  },
]

async function seed() {
  try {
    await mongoose.connect(DB_URL)
    console.log('Connected to DB')

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email })
      if (existing) {
        console.log(`Skipped ${userData.role}: ${userData.email} (already exists)`)
        continue
      }

      const hashed = await bcrypt.hash(userData.password, 10)
      await User.create({
        name: userData.name,
        email: userData.email,
        password: hashed,
        role: userData.role,
      })
      console.log(`Created ${userData.role}: ${userData.email} / ${userData.password}`)
    }

    console.log('\n Seed completed!')
    console.log('\nLogin credentials:')
    console.log('─'.repeat(50))
    for (const u of seedUsers) {
      console.log(`  ${u.role.padEnd(15)} → ${u.email} / ${u.password}`)
    }
    console.log('─'.repeat(50))
  } catch (err) {
    console.error('Seed failed:', err)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seed()
