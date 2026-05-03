import React, { useState } from 'react'
import { useDocuments } from '@/hooks/useDocuments'
import { DocumentCard } from './DocumentCard'
import { CreateDocumentModal } from './CreateDocumentModal'
import { ExportImportMenu } from '../ExportImport/ExportImportMenu'
import './Dashboard.css'

export const Dashboard: React.FC<{ onOpenDocument: (id: string) => void }> = ({ onOpenDocument }) => {
  const {
    documents,
    loading,
    error,
    createDocument,
    renameDocument,
    deleteDocument,
    duplicateDocument,
    importDocument,
  } = useDocuments()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const handleCreate = async (name: string, rows: number, cols: number) => {
    const doc = await createDocument(name, rows, cols)
    if (doc) {
      setShowCreateModal(false)
      onOpenDocument(doc.id)
    }
  }

  const handleImport = async (csvContent: string, name: string) => {
    const doc = await importDocument(csvContent, name)
    if (doc) {
      setShowImport(false)
      onOpenDocument(doc.id)
    }
  }

  if (loading) return <div className="dashboard-loading">Загрузка...</div>
  if (error) return <div className="dashboard-error">Ошибка: {error}</div>

  return (
    
    <div className="dashboard">
    <h1>Мои документы</h1>
      <div className="dashboard-header">
        <div className="dashboard-actions">
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            + Новый документ
          </button>
          <button onClick={() => setShowImport(true)} className="btn btn-secondary">
            Импорт CSV
          </button>
        </div>
      </div>

      <div className="documents-grid">
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onOpen={() => onOpenDocument(doc.id)}
            onRename={(name) => renameDocument(doc.id, name)}
            onDelete={() => deleteDocument(doc.id)}
            onDuplicate={() => duplicateDocument(doc.id, `${doc.name} (копия)`)}
          />
        ))}
        {documents.length === 0 && (
          <div className="no-documents">
            <p>У вас пока нет документов</p>
            <button onClick={() => setShowCreateModal(true)}>Создать первый документ</button>
          </div>
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