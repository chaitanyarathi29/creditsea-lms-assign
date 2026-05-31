'use client'

import { useAuth } from '../lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

const DASHBOARD_ROLES = ['ADMIN', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION']

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user && !DASHBOARD_ROLES.includes(user.role)) {
      router.push('/apply')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (!user || !DASHBOARD_ROLES.includes(user.role)) return null

  return (
    <>
      <Navbar />
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </>
  )
}
