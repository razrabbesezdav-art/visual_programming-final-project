import { createSlice } from '@reduxjs/toolkit'

interface AuthState {
  userId: string
  isAuthenticated: boolean
}

const initialState: AuthState = {
  userId: 'current-user', // mock
  isAuthenticated: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
})

export default authSlice.reducer
