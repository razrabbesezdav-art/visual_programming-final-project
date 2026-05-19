import React from 'react'
import { useAppSelector } from '@/store/hooks'

export const ProfilePage: React.FC = () => {
  const user = useAppSelector((state) => state.auth)

  return (
    <div className="profile-page">
      <h1>Профиль пользователя</h1>
      <div className="profile-info">
        <p>User ID: {user.userId}</p>
        <p>Статус: {user.isAuthenticated ? 'Авторизован' : 'Не авторизован'}</p>
      </div>
    </div>
  )
}
