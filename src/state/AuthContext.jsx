import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(tokenStore.get() ? 'checking' : 'ready')

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('ready')
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await api.get('/api/auth/me')
    setUser(profile)
    return profile
  }, [])

  useEffect(() => {
    const unauthorized = () => clearSession()
    window.addEventListener('campussphere:unauthorized', unauthorized)
    let active = true
    if (tokenStore.get()) {
      refreshProfile()
        .then((profile) => { if (active) { setUser(profile); setStatus('ready') } })
        .catch(() => { if (active) clearSession() })
    }
    return () => { active = false; window.removeEventListener('campussphere:unauthorized', unauthorized) }
  }, [clearSession, refreshProfile])

  const acceptAuth = useCallback(async (path, values) => {
    const response = await api.post(path, values)
    if (!response?.token) throw new Error('The server did not return an authentication token.')
    tokenStore.set(response.token)
    // The current-user endpoint reads the persisted account. Never keep a role
    // from an older/stale login payload if that authoritative refresh fails.
    let profile
    try {
      profile = await refreshProfile()
    } catch (error) {
      tokenStore.clear()
      setUser(null)
      throw error
    }
    setStatus('ready')
    return profile
  }, [refreshProfile])

  const login = useCallback((values) => acceptAuth('/api/auth/login', values), [acceptAuth])
  const register = useCallback((values) => acceptAuth('/api/auth/register', values), [acceptAuth])
  const value = useMemo(() => ({ user, status, login, register, refreshProfile, logout: clearSession }), [user, status, login, register, refreshProfile, clearSession])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
