import * as React from 'react'
import { useNavigate } from 'react-router'
import { login as loginRequest, register as registerRequest } from '@/services/auth.service'
import { REFRESH_TOKEN_KEY, TOKEN_KEY, USER_KEY } from '@/services/api'
import type { User, UserRole } from '@/types'

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [token, setToken] = React.useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = React.useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  })

  const login = React.useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password)
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    setToken(response.token)
    setUser(response.user)
  }, [])

  const register = React.useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    await registerRequest(name, email, password, role)
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  React.useEffect(() => {
    function syncRefreshedAuth() {
      const storedUser = localStorage.getItem(USER_KEY)
      setToken(localStorage.getItem(TOKEN_KEY))
      setUser(storedUser ? (JSON.parse(storedUser) as User) : null)
    }

    window.addEventListener('pitang-auth-refreshed', syncRefreshedAuth)
    window.addEventListener('storage', syncRefreshedAuth)

    return () => {
      window.removeEventListener('pitang-auth-refreshed', syncRefreshedAuth)
      window.removeEventListener('storage', syncRefreshedAuth)
    }
  }, [])

  const value = React.useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [login, logout, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
