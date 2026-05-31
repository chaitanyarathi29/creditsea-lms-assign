'use client'

import { useAuth } from '../lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './Navbar.module.css'

/** Returns up-to-2-letter initials from a full name */
function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isBorrower = user?.role === 'BORROWER'

  const handleLogoClick = () => {
    if (!user) {
      router.push('/')
    } else {
      router.push(isBorrower ? '/apply' : '/dashboard')
    }
  }

  const handleScrollTo = (id: string) => {
    if (pathname !== '/') {
      router.push(`/#${id}`)
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>

        {/* ── Logo ── */}
        <button className={styles.logo} onClick={handleLogoClick} aria-label="Go home">
          <span className={styles.logoMark}>
            {/* Diamond / credit icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M7 1L13 7L7 13L1 7L7 1Z"
                fill="white"
                fillOpacity="0.95"
              />
            </svg>
          </span>
          <span className={styles.logoWordmark}>
            <span className={styles.logoMain}>CREDITSEA</span>
            <span className={styles.logoTagline}>Loan Management</span>
          </span>
        </button>

        {/* ── Right Side ── */}
        {user ? (
          <div className={styles.right}>
            {/* Borrower nav links */}
            {isBorrower && (
              <nav className={styles.navLinks}>
                <button
                  className={`${styles.navLink} ${pathname === '/apply' ? styles.active : ''}`}
                  onClick={() => router.push('/apply')}
                >
                  Apply
                </button>
                <button
                  className={`${styles.navLink} ${pathname === '/apply/status' ? styles.active : ''}`}
                  onClick={() => router.push('/apply/status')}
                >
                  My Loans
                </button>
              </nav>
            )}

            <div className={styles.sep} />

            {/* User chip */}
            <div className={styles.userChip}>
              <div className={styles.avatar}>
                {getInitials(user.name)}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRole}>{user.role}</span>
              </div>
            </div>

            {/* Sign out */}
            <button className={styles.signOutBtn} onClick={logout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        ) : (
          <div className={styles.right}>
            {/* Landing page anchors */}
            <nav className={styles.navLinks}>
              <button className={styles.navLink} onClick={() => handleScrollTo('estimator')}>
                Estimator
              </button>
              <button className={styles.navLink} onClick={() => handleScrollTo('capabilities')}>
                Capabilities
              </button>
              <button className={styles.navLink} onClick={() => handleScrollTo('status')}>
                Live Status
              </button>
              <button className={styles.navLink} onClick={() => handleScrollTo('assurance')}>
                Assurance
              </button>
            </nav>

            <div className={styles.sep} />

            <div className={styles.authButtons}>
              <Link href="/signup" className={styles.getStartedBtn}>
                Get Started
              </Link>
              <Link href="/login" className={styles.loginBtn}>
                Log In
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
