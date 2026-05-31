'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'
import type { User, AuthResponse } from './types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('lms_token')
    const storedUser = localStorage.getItem('lms_user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('lms_token')
        localStorage.removeItem('lms_user')
      }
    }
    setIsLoading(false)
  }, [])

  const persistAuth = useCallback((t: string, u: User) => {
    localStorage.setItem('lms_token', t)
    localStorage.setItem('lms_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/signin', { email, password })
    persistAuth(data.token, data.user)
  }, [persistAuth])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/signup', { name, email, password })
    persistAuth(data.token, data.user)
  }, [persistAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('lms_token')
    localStorage.removeItem('lms_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
