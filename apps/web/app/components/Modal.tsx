'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, mounted])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className={styles.overlay} ref={overlayRef} onClick={(e) => {
      if (e.target === overlayRef.current) onClose()
    }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.close} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

