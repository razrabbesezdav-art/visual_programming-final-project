import { describe, it, expect } from 'vitest'
import authReducer, { setCredentials, logout } from '@/store/slices/authSlice'
import type { UnknownAction } from '@reduxjs/toolkit'

describe('authSlice', () => {
  it('should have initial state with no user', () => {
    const state = authReducer(undefined, { type: '@@INIT' } as UnknownAction)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should set credentials on login', () => {
    const user = { id: '123', email: 'test@example.com', name: 'Test User' }
    const accessToken = 'fake-token'
    const state = authReducer(undefined, setCredentials({ user, accessToken }))
    expect(state.user).toEqual(user)
    expect(state.accessToken).toBe(accessToken)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should logout and clear state', () => {
    const user = { id: '123', email: 'test@example.com', name: 'Test User' }
    const accessToken = 'fake-token'
    let state = authReducer(undefined, setCredentials({ user, accessToken }))
    state = authReducer(state, logout())
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
