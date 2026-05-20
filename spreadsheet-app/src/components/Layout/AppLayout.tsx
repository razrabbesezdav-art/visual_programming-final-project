import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import './AppLayout.css'

export const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            Spreadsheet App
          </Link>
        </div>
        <nav className="header-nav">
          <Link to="/dashboard">Мои документы</Link>
          <Link to="/profile">Профиль</Link>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
