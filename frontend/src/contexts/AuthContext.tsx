import React, { createContext, useContext, useState, useCallback } from 'react'

interface SysUser { username: string; fullName: string; role: string }

interface AuthContextType {
  sysUser: SysUser | null
  gdtToken: string | null
  gdtUsername: string | null
  login: (token: string, user: SysUser) => void
  logout: () => void
  setGdtAuth: (token: string, username: string) => void
  clearGdtAuth: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sysUser, setSysUser] = useState<SysUser | null>(() => {
    const stored = sessionStorage.getItem('sysUser')
    return stored ? JSON.parse(stored) : null
  })
  const [gdtToken, setGdtToken] = useState<string | null>(
    () => sessionStorage.getItem('gdtToken')
  )
  const [gdtUsername, setGdtUsername] = useState<string | null>(
    () => sessionStorage.getItem('gdtUsername')
  )

  const login = useCallback((token: string, user: SysUser) => {
    sessionStorage.setItem('sysToken', token)
    sessionStorage.setItem('sysUser', JSON.stringify(user))
    setSysUser(user)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.clear()
    setSysUser(null)
    setGdtToken(null)
    setGdtUsername(null)
    window.location.href = '/login'
  }, [])

  const setGdtAuth = useCallback((token: string, username: string) => {
    sessionStorage.setItem('gdtToken', token)
    sessionStorage.setItem('gdtUsername', username)
    setGdtToken(token)
    setGdtUsername(username)
  }, [])

  const clearGdtAuth = useCallback(() => {
    sessionStorage.removeItem('gdtToken')
    sessionStorage.removeItem('gdtUsername')
    setGdtToken(null)
    setGdtUsername(null)
  }, [])

  return (
    <AuthContext.Provider value={{ sysUser, gdtToken, gdtUsername, login, logout, setGdtAuth, clearGdtAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
