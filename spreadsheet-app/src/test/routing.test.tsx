import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { AppLayout } from '@/components/Layout/AppLayout'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import spreadsheetReducer from '@/store/slices/spreadsheetSlice'
import documentsReducer from '@/store/slices/documentsSlice'
import uiReducer from '@/store/slices/uiSlice'
import authReducer from '@/store/slices/authSlice'

const createTestStore = (isAuthenticated = true) =>
  configureStore({
    reducer: {
      spreadsheet: spreadsheetReducer,
      documents: documentsReducer,
      ui: uiReducer,
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        userId: 'test-user',
        isAuthenticated,
      },
    },
  })

describe('Routing', () => {
  it('should render AppLayout with navigation', () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <MemoryRouter>
          <AppLayout />
        </MemoryRouter>
      </Provider>
    )

    expect(screen.getByText('Spreadsheet App')).toBeTruthy()
    expect(screen.getAllByText('Мои документы').length).toBeGreaterThan(0)
    expect(screen.getByText('Профиль')).toBeTruthy()
  })

  it('should protect routes when not authenticated', () => {
    const store = createTestStore(false)

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    )

    expect(screen.getByText('Login Page')).toBeTruthy()
    expect(screen.queryByText('Protected Content')).toBeNull()
  })
})
