import { vi } from 'vitest'
import '@testing-library/jest-dom'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

vi.mock('@/api/auth', () => ({
  verifyAccessToken: vi.fn().mockReturnValue('test-user'),
}))
