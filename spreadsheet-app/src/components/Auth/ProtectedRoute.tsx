import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { verifyAccessToken } from '@/api/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth)
  const location = useLocation()

  const isValidToken = accessToken
    ? verifyAccessToken(accessToken) !== null
    : false

  const isAuth = isAuthenticated && isValidToken

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
