import React from 'react'
import { SaveStatus } from '@/types/documents'

interface SaveIndicatorProps {
  status: SaveStatus
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ status }) => {
  const getStatusInfo = () => {
    switch (status.status) {
      case 'saved':
        return { icon: '✅', text: 'Сохранено', className: 'saved' }
      case 'saving':
        return { icon: '⏳', text: 'Сохранение...', className: 'saving' }
      case 'error':
        return { icon: '❌', text: status.error || 'Ошибка', className: 'error' }
      case 'unsaved':
        return { icon: '📝', text: 'Не сохранено', className: 'unsaved' }
    }
  }

  const info = getStatusInfo()

  return (
    <div className={`save-indicator ${info.className}`} title={info.text}>
      <span>{info.icon}</span>
      <span>{info.text}</span>
      {status.lastSaved && (
        <span className="last-saved">
          {status.lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}