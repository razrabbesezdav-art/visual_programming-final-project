import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '@/types/auth'

const USERS_KEY = 'mock_users'
const REFRESH_TOKENS_KEY = 'mock_refresh_tokens'

function generateAccessToken(userId: string, expiresInMs = 3600000): string {
  const payload = `${userId}:${Date.now() + expiresInMs}`
  return btoa(payload)
}

export function verifyAccessToken(token: string): string | null {
  try {
    const decoded = atob(token)
    const [userId, expiresAt] = decoded.split(':')
    if (Date.now() < Number(expiresAt)) {
      return userId
    }
    return null
  } catch {
    return null
  }
}

function generateRefreshToken(userId: string): string {
  const payload = `${userId}:${Date.now() + 7 * 24 * 3600000}`
  return btoa(payload)
}

function verifyRefreshToken(token: string): string | null {
  try {
    const decoded = atob(token)
    const [userId, expiresAt] = decoded.split(':')
    if (Date.now() < Number(expiresAt)) {
      return userId
    }
    return null
  } catch {
    return null
  }
}

function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getRefreshTokenMap(): Record<string, string> {
  const data = localStorage.getItem(REFRESH_TOKENS_KEY)
  return data ? JSON.parse(data) : {}
}

function saveRefreshTokenMap(map: Record<string, string>): void {
  localStorage.setItem(REFRESH_TOKENS_KEY, JSON.stringify(map))
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const users = getUsers()
    if (users.find((u) => u.email === data.email)) {
      throw new Error('User with this email already exists')
    }
    const newUser: User = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      email: data.email,
      name: data.name,
      password: data.password,
    }
    users.push(newUser)
    saveUsers(users)

    const accessToken = generateAccessToken(newUser.id)
    const refreshToken = generateRefreshToken(newUser.id)
    const refreshMap = getRefreshTokenMap()
    refreshMap[refreshToken] = newUser.id
    saveRefreshTokenMap(refreshMap)

    return {
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      accessToken,
      refreshToken,
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const users = getUsers()
    const user = users.find(
      (u) =>
        u.email === credentials.email && u.password === credentials.password
    )
    if (!user) {
      throw new Error('Invalid email or password')
    }
    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)
    const refreshMap = getRefreshTokenMap()
    refreshMap[refreshToken] = user.id
    saveRefreshTokenMap(refreshMap)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    }
  },

  refreshToken: async (
    refreshToken: string
  ): Promise<{ accessToken: string }> => {
    const userId = verifyRefreshToken(refreshToken)
    if (!userId) {
      throw new Error('Invalid or expired refresh token')
    }
    const refreshMap = getRefreshTokenMap()
    if (refreshMap[refreshToken] !== userId) {
      throw new Error('Refresh token not found')
    }
    const newAccessToken = generateAccessToken(userId)
    return { accessToken: newAccessToken }
  },

  logout: async (refreshToken: string): Promise<void> => {
    const refreshMap = getRefreshTokenMap()
    delete refreshMap[refreshToken]
    saveRefreshTokenMap(refreshMap)
  },

  isAuthenticated: (accessToken: string | null): boolean => {
    if (!accessToken) return false
    return verifyAccessToken(accessToken) !== null
  },
}
