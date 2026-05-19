import React from 'react'
import { Link } from 'react-router-dom'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <h1>404 - Страница не найдена</h1>
      <p>Запрашиваемая страница не существует или была удалена.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Вернуться к документам
      </Link>
    </div>
  )
}
