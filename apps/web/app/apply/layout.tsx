'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../lib/auth'
import Navbar from '../components/Navbar'
import StepIndicator from '../components/StepIndicator'
import LoadingSpinner from '../components/LoadingSpinner'
import styles from './layout.module.css'

const STEPS = [
  'Personal Details',
  'Salary Slip',
  'Configure Loan',
  'Application Status'
]

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
    } else if (user.role !== 'BORROWER') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'BORROWER') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={48} />
      </div>
    )
  }

  // Determine current step based on pathname
  let currentStep = 1
  if (pathname.includes('/salary-slip')) {
    currentStep = 2
  } else if (pathname.includes('/loan')) {
    currentStep = 3
  } else if (pathname.includes('/status')) {
    currentStep = 4
  }

  return (
    <div className={styles.container}>
      <Navbar />
      
      <div className={styles.stepperContainer}>
        <div className="container">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>
      </div>

      <main className={styles.content}>
        <div className="container container-narrow">
          {children}
        </div>
      </main>
    </div>
  )
}
