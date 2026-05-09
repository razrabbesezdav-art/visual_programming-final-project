import React, { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  fetchDocuments,
  createDocument,
  renameDocument,
  deleteDocument,
  duplicateDocument,
  importDocument,
} from '@/store/slices/documentsSlice'
import { DocumentCard } from './DocumentCard'
import { CreateDocumentModal } from './CreateDocumentModal'
import { ExportImportMenu } from '../ExportImport/ExportImportMenu'
import './Dashboard.css'

interface DashboardProps {
  onOpenDocument: (id: string) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenDocument }) => {
  const dispatch = useAppDispatch()
  const {
    list: documents,
    loading,
    error,
  } = useAppSelector((state) => state.documents)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    dispatch(fetchDocuments())
  }, [dispatch])

  const handleCreate = async (name: string, rows: number, cols: number) => {
    const result = await dispatch(
      createDocument({ name, rowCount: rows, colCount: cols })
    )
    if (createDocument.fulfilled.match(result)) {
      setShowCreateModal(false)
      onOpenDocument(result.payload.doc.id)
    }
  }

  const handleImport = async (csvContent: string, name: string) => {
    const result = await dispatch(importDocument({ csvContent, name }))
    if (importDocument.fulfilled.match(result)) {
      setShowImport(false)
      onOpenDocument(result.payload.doc.id)
    }
  }

  if (loading)
    return <div className="dashboard-loading">Загрузка документов...</div>
  if (error) return <div className="dashboard-error">Ошибка: {error}</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Мои документы</h1>
        <div className="dashboard-actions">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Новый документ
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="btn btn-secondary"
          >
            Импорт CSV
          </button>
        </div>
      </div>

      <div className="documents-grid">
        {documents.length === 0 ? (
          <div className="no-documents">
            <p>У вас пока нет документов</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Создать первый документ
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onOpen={() => onOpenDocument(doc.id)}
              onRename={(name) =>
                dispatch(renameDocument({ id: doc.id, name }))
              }
              onDelete={() => dispatch(deleteDocument(doc.id))}
              onDuplicate={() =>
                dispatch(
                  duplicateDocument({
                    id: doc.id,
                    newName: `${doc.name} (копия)`,
                  })
                )
              }
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateDocumentModal
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {showImport && (
        <ExportImportMenu
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
