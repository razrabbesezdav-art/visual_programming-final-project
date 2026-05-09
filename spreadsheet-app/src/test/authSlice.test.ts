import { describe, it, expect } from 'vitest'
import authReducer from '@/store/slices/authSlice'

describe('authSlice', () => {
  it('should have initial mock user', () => {
    const state = authReducer(undefined, { type: '@@INIT' } as any)
    expect(state.userId).toBe('current-user')
    expect(state.isAuthenticated).toBe(true)
  })
})
