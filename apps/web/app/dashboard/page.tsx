'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    switch (user.role) {
      case 'SALES':
      case 'ADMIN':
        router.replace('/dashboard/sales')
        break
      case 'SANCTION':
        router.replace('/dashboard/sanction')
        break
      case 'DISBURSEMENT':
        router.replace('/dashboard/disbursement')
        break
      case 'COLLECTION':
        router.replace('/dashboard/collection')
        break
      default:
        router.replace('/apply')
    }
  }, [user, isLoading, router])

  return (
    <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size={48} />
    </div>
  )
}
