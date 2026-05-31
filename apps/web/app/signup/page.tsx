'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import styles from './page.module.css'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, signup, isLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/apply')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      showToast('Please fill in all fields', 'error')
      return
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await signup(name, email, password)
      showToast('Account created successfully', 'success')
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Registration failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || (user && !isSubmitting)) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} card animate-fade-in`}>
        <div className={styles.logo}>CreditSea</div>
        <div className={styles.subtitle}>Create Borrower Account</div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="•••••••• (Min. 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  )
}
