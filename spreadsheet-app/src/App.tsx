import React, { useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { AppLayout } from '@/components/Layout/AppLayout'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { SpreadsheetPage } from '@/pages/SpreadsheetPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { restoreSession } from '@/api/client'
import { setCredentials } from '@/store/slices/authSlice'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'documents/:documentId',
        element: (
          <ProtectedRoute>
            <SpreadsheetPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
])

const AppWithSession: React.FC = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restoreSession().then((session) => {
      if (session) {
        dispatch(setCredentials(session))
      }
      setLoading(false)
    })
  }, [dispatch])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        Загрузка..
      </div>
    )
  }

  return <RouterProvider router={router} />
}

const App: React.FC = () => {
  return <AppWithSession />
}

export default App
