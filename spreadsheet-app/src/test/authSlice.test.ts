import { describe, it, expect } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import type { UnknownAction } from '@reduxjs/toolkit'

describe('authSlice', () => {
  it('should have initial mock user', () => {
    const state = authReducer(undefined, { type: '@@INIT' } as UnknownAction)
    expect(state.userId).toBe('current-user')
    expect(state.isAuthenticated).toBe(true)
  })
})
