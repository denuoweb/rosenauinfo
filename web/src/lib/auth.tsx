import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { auth } from './firebase'

type AuthContextValue = {
  user: User | null
  initializing: boolean
  error: string | null
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, current => {
      setUser(current)
      setInitializing(false)
    })
    return () => unsub()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      const message = err?.message || 'Failed to sign in'
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(() => ({ user, initializing, error, login, logout }), [user, initializing, error, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
