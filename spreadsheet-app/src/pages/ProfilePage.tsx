import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { clearTokens } from '@/api/client'
import { authApi } from '@/api/auth'

export const ProfilePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch (err) {
        console.error('Ошибка выхода:', err)
      }
    }
    clearTokens()
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile-page">
      <h1>Профиль пользователя</h1>
      <div className="profile-info">
        <p>
          <strong>Имя:</strong> {user?.name}
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>User ID:</strong> {user?.id}
        </p>
        <p>
          <strong>Статус:</strong> Авторизован
        </p>
      </div>
      <button onClick={handleLogout} className="btn-logout">
        Выйти
      </button>
    </div>
  )
}
