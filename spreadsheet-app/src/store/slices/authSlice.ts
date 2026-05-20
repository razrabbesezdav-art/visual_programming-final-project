import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '@/api/auth'
import { User, LoginCredentials, RegisterData } from '@/types/auth'

interface AuthState {
  user: Omit<User, 'password'> | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const checkAuth = () => {
  const accessToken = localStorage.getItem('access_token')
  const userStr = localStorage.getItem('user')
  if (accessToken && userStr) {
    try {
      const user = JSON.parse(userStr)
      return { user, accessToken, isAuthenticated: true }
    } catch {
      return { user: null, accessToken: null, isAuthenticated: false }
    }
  }
  return { user: null, accessToken: null, isAuthenticated: false }
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials)
    return response
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData) => {
    if (data.password !== data.confirmPassword) {
      throw new Error('Пароли не совпадают')
    }
    if (data.password.length < 8) {
      throw new Error('Пароль должен содержать минимум 8 символов')
    }
    const response = await authApi.register(data)
    return response
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
})

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: { name: string }) => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      throw new Error('Пользователь не найден')
    }

    const currentUser = JSON.parse(userStr)

    const updatedUser = {
      ...currentUser,
      name: data.name,
    }

    localStorage.setItem('user', JSON.stringify(updatedUser))

    const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id)
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        name: data.name,
      }
      localStorage.setItem('mock_users', JSON.stringify(users))
    }

    return updatedUser
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({
    oldPassword,
    newPassword,
  }: {
    oldPassword: string
    newPassword: string
  }) => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      throw new Error('Пользователь не найден')
    }

    const currentUser = JSON.parse(userStr)
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id)

    if (userIndex === -1) {
      throw new Error('Пользователь не найден в базе')
    }

    const fullUser = users[userIndex]

    if (fullUser.password !== oldPassword) {
      throw new Error('Неверный текущий пароль')
    }

    if (newPassword.length < 8) {
      throw new Error('Новый пароль должен быть минимум 8 символов')
    }

    users[userIndex] = {
      ...fullUser,
      password: newPassword,
    }
    localStorage.setItem('mock_users', JSON.stringify(users))

    return true
  }
)

const {
  user: savedUser,
  accessToken: savedToken,
  isAuthenticated: savedAuth,
} = checkAuth()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    ...initialState,
    user: savedUser,
    accessToken: savedToken,
    isAuthenticated: savedAuth,
  },
  reducers: {
    clearError(state) {
      state.error = null
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        user: Omit<User, 'password'>
        accessToken: string
      }>
    ) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      state.error = null
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('access_token', action.payload.accessToken)
    },
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.loading = false
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        localStorage.setItem('access_token', action.payload.accessToken)
        if (action.payload.refreshToken) {
          localStorage.setItem('refresh_token', action.payload.refreshToken)
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Ошибка входа'
      })

      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.loading = false
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        localStorage.setItem('access_token', action.payload.accessToken)
        if (action.payload.refreshToken) {
          localStorage.setItem('refresh_token', action.payload.refreshToken)
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Ошибка регистрации'
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
        state.error = null
      })

      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
        state.error = null
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Ошибка обновления профиля'
      })

      .addCase(changePassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Ошибка смены пароля'
      })
  },
})

export const { clearError, setCredentials, clearCredentials } =
  authSlice.actions
export default authSlice.reducer
