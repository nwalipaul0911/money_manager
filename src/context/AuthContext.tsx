import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../api/client'
import type { UserContext } from '../types'

interface AuthState {
  user: UserContext | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<UserContext | null>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserContext | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return null
    }
    try {
      const me = await api.me()
      setUser(me)
      return me
    } catch {
      setToken(null)
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const { access_token } = await api.login(email, password)
    setToken(access_token)
    await refreshUser()
  }

  const register = async (email: string, password: string, name: string) => {
    const { access_token } = await api.register(email, password, name)
    setToken(access_token)
    await refreshUser()
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
