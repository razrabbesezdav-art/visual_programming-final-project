import React, { useState } from 'react'
import { DocumentPreview } from '@/types/documents'
import { documentsApi, downloadFile } from '@/api/documents'

interface DocumentCardProps {
  document: DocumentPreview
  onOpen: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onDuplicate: () => void
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
}) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(document.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleRename = () => {
    if (newName.trim() && newName !== document.name) {
      onRename(newName.trim())
    }
    setIsRenaming(false)
  }

  const handleExportCSV = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { content, filename } = await documentsApi.export(document.id, 'csv')
      downloadFile(content, filename, 'text/csv')
      setShowExportMenu(false)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleExportJSON = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { content, filename } = await documentsApi.export(document.id, 'json')
      downloadFile(content, filename, 'application/json')
      setShowExportMenu(false)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="document-card">
      <div className="document-preview" onClick={onOpen}>
        {document.preview && document.preview.length > 0 ? (
          <table className="preview-table">
            <tbody>
              {document.preview.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-preview">Пустая таблица</div>
        )}
      </div>

      <div className="document-info" onClick={onOpen}>
        {isRenaming ? (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <h3 onDoubleClick={() => setIsRenaming(true)}>{document.name}</h3>
        )}
        <p className="document-date">
          Изменен: {new Date(document.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="document-actions">
        <button onClick={onOpen} title="Открыть">📂</button>
        <button onClick={() => setIsRenaming(true)} title="Переименовать">✏️</button>
        <button onClick={onDuplicate} title="Дублировать">📋</button>
        
        <div className="export-dropdown">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setShowExportMenu(!showExportMenu)
            }}
            title="Экспорт"
          >
            📥
          </button>
          {showExportMenu && (
            <div className="export-menu-card">
              <button onClick={handleExportCSV}>
                📊 CSV
              </button>
              <button onClick={handleExportJSON}>
                📋 JSON
              </button>
            </div>
          )}
        </div>
        
        <button onClick={() => setShowDeleteConfirm(true)} title="Удалить">🗑️</button>
      </div>

      {showDeleteConfirm && (
        <div className="confirm-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Удалить "{document.name}"?</p>
            <div className="confirm-dialog-actions">
              <button onClick={() => { onDelete(); setShowDeleteConfirm(false) }}>
                Удалить
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}