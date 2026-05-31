'use client'

import { useAuth } from '../lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './Navbar.module.css'

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

  // Smooth scroll handler for landing page anchors
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
        <button className={styles.logo} onClick={handleLogoClick}>
          <span>CREDITSEA</span>
        </button>

        {user ? (
          <div className={styles.right}>
            {isBorrower && (
              <div className={styles.navLinks}>
                <button
                  className={`${styles.navLink} ${pathname === '/apply' ? styles.active : ''}`}
                  onClick={() => router.push('/apply')}
                >
                  APPLY
                </button>
                <button
                  className={`${styles.navLink} ${pathname === '/apply/status' ? styles.active : ''}`}
                  onClick={() => router.push('/apply/status')}
                >
                  MY LOANS
                </button>
              </div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={`badge badge-${user.role === 'ADMIN' ? 'applied' : 'pending'}`}>
                {user.role}
              </span>
            </div>
            <button className={styles.logoutBtn} onClick={logout}>
              SIGN OUT
            </button>
          </div>
        ) : (
          <div className={styles.right}>
            <div className={styles.navLinks}>
              <button className={styles.navLink} onClick={() => handleScrollTo('estimator')}>
                ESTIMATOR
              </button>
              <button className={styles.navLink} onClick={() => handleScrollTo('capabilities')}>
                CAPABILITIES
              </button>
              <button className={styles.navLink} onClick={() => handleScrollTo('status')}>
                LIVE STATUS
              </button>
              <button className={styles.navLink} onClick={() => handleScrollTo('assurance')}>
                ASSURANCE
              </button>
            </div>
            <div className={styles.authButtons}>
              <Link href="/signup" className={styles.signupLink}>
                GET STARTED
              </Link>
              <Link href="/login" className={styles.loginBtn}>
                LOGIN
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
