import { authApi, verifyAccessToken } from './auth'
import { User } from '@/types/auth'

let accessToken: string | null = null
let refreshToken: string | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem('refresh_token', refresh)
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return refreshToken || localStorage.getItem('refresh_token')
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('refresh_token')
}

export function loadStoredRefreshToken() {
  const stored = localStorage.getItem('refresh_token')
  if (stored) {
    refreshToken = stored
  }
}

export function getCurrentUserId(): string | null {
  const token = getAccessToken()
  if (!token) return null
  return verifyAccessToken(token)
}

export async function restoreSession(): Promise<{
  user: { id: string; email: string; name: string }
  accessToken: string
} | null> {
  const storedRefresh = getRefreshToken()
  if (!storedRefresh) return null

  try {
    const { accessToken: newAccessToken } =
      await authApi.refreshToken(storedRefresh)
    const userId = verifyAccessToken(newAccessToken)
    if (!userId) throw new Error('Invalid token')

    const users: User[] = JSON.parse(localStorage.getItem('mock_users') || '[]')
    const user = users.find((u) => u.id === userId)
    if (!user) throw new Error('Пользователь не найден')

    setTokens(newAccessToken, storedRefresh)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      accessToken: newAccessToken,
    }
  } catch (err) {
    console.error('Ошибка восстановления сессии:', err)
    clearTokens()
    return null
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken()
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }
  let response = await fetch(url, { ...options, headers })
  if (response.status === 401 && getRefreshToken()) {
    try {
      const { accessToken: newToken } = await authApi.refreshToken(
        getRefreshToken()!
      )
      setTokens(newToken, getRefreshToken()!)
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, { ...options, headers })
    } catch {
      clearTokens()
      window.location.href = '/login'
      throw new Error('Сессия истекла')
    }
  }
  return response
}
