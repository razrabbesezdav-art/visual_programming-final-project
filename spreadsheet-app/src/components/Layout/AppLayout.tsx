import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'
import './AppLayout.css'

export const AppLayout: React.FC = () => {
  const location = useLocation()

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            Spreadsheet App
          </Link>
          <Breadcrumbs />
        </div>
        <nav className="header-nav">
          <Link
            to="/dashboard"
            className={location.pathname === '/dashboard' ? 'active' : ''}
          >
            Мои документы
          </Link>
          <Link
            to="/profile"
            className={location.pathname === '/profile' ? 'active' : ''}
          >
            Профиль
          </Link>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
