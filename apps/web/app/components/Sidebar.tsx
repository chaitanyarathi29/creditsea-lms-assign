'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth'
import styles from './Sidebar.module.css'
import type { Role } from '../lib/types'

interface NavItem {
  label: string
  path: string
  roles: Role[]
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Sales', path: '/dashboard/sales', roles: ['SALES', 'ADMIN'], icon: '📊' },
  { label: 'Sanction', path: '/dashboard/sanction', roles: ['SANCTION', 'ADMIN'], icon: '✅' },
  { label: 'Disbursement', path: '/dashboard/disbursement', roles: ['DISBURSEMENT', 'ADMIN'], icon: '💰' },
  { label: 'Collection', path: '/dashboard/collection', roles: ['COLLECTION', 'ADMIN'], icon: '📋' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role))

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionLabel}>Modules</div>
      <nav className={styles.nav}>
        {visibleItems.map((item) => (
          <button
            key={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
            onClick={() => router.push(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
