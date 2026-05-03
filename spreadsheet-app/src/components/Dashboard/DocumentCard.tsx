import React, { useState } from 'react'
import { DocumentPreview } from '@/types/documents'

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

  const handleRename = () => {
    if (newName.trim() && newName !== document.name) {
      onRename(newName.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div className="document-card">
      <div className="document-preview" onClick={onOpen}>
        {document.preview ? (
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

      <div className="document-info">
        {isRenaming ? (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
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
        <button onClick={() => setShowDeleteConfirm(true)} title="Удалить">🗑️</button>
      </div>

      {showDeleteConfirm && (
        <div className="confirm-dialog">
          <p>Удалить "{document.name}"?</p>
          <button onClick={() => { onDelete(); setShowDeleteConfirm(false) }}>Да</button>
          <button onClick={() => setShowDeleteConfirm(false)}>Нет</button>
        </div>
      )}
    </div>
  )
}