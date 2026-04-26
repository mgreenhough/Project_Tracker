import { useState, useEffect, useCallback, useRef } from 'react'
import { useProjectStore } from '../store/useProjectStore'

const API_URL = import.meta.env.VITE_API_URL || '/api'

interface TokenPayload {
  exp: number
  iat: number
  sub: string
  email: string
  role: string
}

let refreshPromise: Promise<string | null> | null = null

function parseJwt(token: string): TokenPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(json) as TokenPayload
  } catch {
    return null
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken')
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken')
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)
}

function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token)
  if (!payload) return true
  const nowSeconds = Math.floor(Date.now() / 1000)
  return payload.exp <= nowSeconds + 60
}

async function doRefreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })

    if (!res.ok) {
      clearTokens()
      return null
    }

    const data = await res.json()
    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken)
      return data.accessToken
    }
    return null
  } catch {
    return null
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = doRefreshAccessToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRefresh = useCallback((token: string) => {
    const payload = parseJwt(token)
    if (!payload) return

    const nowSeconds = Math.floor(Date.now() / 1000)
    const expiresIn = payload.exp - nowSeconds
    const refreshIn = Math.max(expiresIn - 60, 0) * 1000

    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(async () => {
      const newToken = await refreshAccessToken()
      if (newToken) {
        const newPayload = parseJwt(newToken)
        setIsAdmin(newPayload?.role === 'admin')
        scheduleRefresh(newToken)
      } else {
        setIsAdmin(false)
      }
    }, refreshIn)
  }, [])

  const checkAuth = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsAdmin(false)
      setIsLoading(false)
      return
    }

    if (isTokenExpired(token)) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        const payload = parseJwt(newToken)
        setIsAdmin(payload?.role === 'admin')
        scheduleRefresh(newToken)
      } else {
        setIsAdmin(false)
      }
    } else {
      const payload = parseJwt(token)
      setIsAdmin(payload?.role === 'admin')
      scheduleRefresh(token)
    }

    setIsLoading(false)
  }, [scheduleRefresh])

  useEffect(() => {
    checkAuth()
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
  }, [checkAuth])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [checkAuth])

  const logout = useCallback(() => {
    clearTokens()
    setIsAdmin(false)
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    useProjectStore.getState().setIsAdmin(false)
  }, [])

  const getValidToken = useCallback(async (): Promise<string | null> => {
    const token = getAccessToken()
    if (!token) return null
    if (!isTokenExpired(token)) return token
    return await refreshAccessToken()
  }, [])

  return {
    isAdmin,
    isLoading,
    logout,
    getValidToken,
    checkAuth,
  }
}