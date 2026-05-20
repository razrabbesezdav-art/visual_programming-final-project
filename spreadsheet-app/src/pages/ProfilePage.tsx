import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  logout,
  updateProfile,
  changePassword,
  clearError,
} from '@/store/slices/authSlice'
import { fetchDocuments } from '@/store/slices/documentsSlice'
import './ProfilePage.css'

export const ProfilePage: React.FC = () => {
  const { user, loading, error } = useAppSelector((state) => state.auth)
  const { list: documents } = useAppSelector((state) => state.documents)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(user?.name || '')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    if (user) {
      setNewName(user.name)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      dispatch(fetchDocuments())
    }
  }, [user, dispatch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (error) {
      setMessage({ type: 'error', text: error })
      dispatch(clearError())
      setTimeout(() => setMessage(null), 3000)
    }
  }, [error, dispatch])

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setMessage({ type: 'error', text: 'Имя не может быть пустым' })
      setTimeout(() => setMessage(null), 3000)
      setIsEditingName(false)
      return
    }

    if (newName.trim() !== user?.name) {
      const result = await dispatch(updateProfile({ name: newName.trim() }))

      if (updateProfile.fulfilled.match(result)) {
        setMessage({ type: 'success', text: 'Имя успешно обновлено' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        const errorMsg =
          (result as { error?: { message?: string } }).error?.message ||
          'Ошибка обновления имени'
        setMessage({ type: 'error', text: errorMsg })
        setTimeout(() => setMessage(null), 3000)
      }
    }
    setIsEditingName(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'Пароль должен быть минимум 8 символов',
      })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    const result = await dispatch(changePassword({ oldPassword, newPassword }))
    if (changePassword.fulfilled.match(result)) {
      setMessage({ type: 'success', text: 'Пароль успешно изменён' })
      setShowPasswordForm(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3000)
    } else {
      const errorMsg =
        (result as { error?: { message?: string } }).error?.message ||
        'Ошибка смены пароля'
      setMessage({ type: 'error', text: errorMsg })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login', { replace: true })
  }

  if (!user) {
    return <div className="profile-loading">Загрузка...</div>
  }

  const totalFilledCells = documents.reduce((sum, doc) => {
    const preview = doc.preview || []
    let filled = 0
    for (const row of preview) {
      for (const cell of row) {
        if (cell && cell.trim()) filled++
      }
    }
    return sum + filled
  }, 0)

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return 'Дата не указана'
    }
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Дата не указана'
      }
      return date.toLocaleDateString('ru-RU')
    } catch {
      return 'Дата не указана'
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Профиль пользователя</h1>
      </div>

      {message && (
        <div className={`profile-message ${message.type}`}>{message.text}</div>
      )}

      <div className="profile-card">
        <div className="profile-section">
          <h2>Личная информация</h2>

          <div className="profile-field">
            <label>Имя:</label>
            {isEditingName ? (
              <div className="field-edit">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleUpdateName()
                    } else if (e.key === 'Escape') {
                      setNewName(user?.name || '')
                      setIsEditingName(false)
                    }
                  }}
                  autoFocus
                />
                <button onClick={handleUpdateName} className="save-btn">
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setNewName(user?.name || '')
                    setIsEditingName(false)
                  }}
                  className="cancel-btn"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="field-value">
                <span>{user.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="edit-btn"
                >
                  Изменить
                </button>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>Email:</label>
            <div className="field-value">
              <span>{user.email}</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Дата регистрации:</label>
            <div className="field-value">
              <span>{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Статистика</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{documents.length}</div>
              <div className="stat-label">Документов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalFilledCells}</div>
              <div className="stat-label">Заполненных ячеек</div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Безопасность</h2>
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn-secondary"
            >
              Сменить пароль
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label>Текущий пароль</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  required
                />
              </div>
              <div className="form-group">
                <label>Новый пароль (мин. 8 символов)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Подтверждение пароля</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                >
                  Отмена
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-section">
          <button onClick={handleLogout} className="btn-logout">
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  )
}
