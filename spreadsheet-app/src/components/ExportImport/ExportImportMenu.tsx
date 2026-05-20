import React, { useState, useRef } from 'react'

interface ExportImportMenuProps {
  onImport: (csvContent: string, name: string) => void
  onClose: () => void
}

export const ExportImportMenu: React.FC<ExportImportMenuProps> = ({
  onImport,
  onClose,
}) => {
  const [name, setName] = useState('')
  const [csvContent, setCsvContent] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    const content = await file.text()
    setCsvContent(content)
    setName(file.name.replace(/\.csv$/i, ''))
  }

  const handleImport = () => {
    if (csvContent && name.trim()) {
      onImport(csvContent, name.trim())
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Импорт CSV</h2>
        <div className="form-group">
          <label>CSV файл</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
          />
        </div>

        {csvContent && (
          <div className="form-group">
            <label>Название документа</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        {csvContent && (
          <div className="csv-preview">
            <h4>Предпросмотр (первые 5 строк)</h4>
            <pre>{csvContent.split('\n').slice(0, 5).join('\n')}</pre>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Отмена</button>
          <button onClick={handleImport} disabled={!csvContent || !name.trim()}>
            Импортировать
          </button>
        </div>
      </div>
    </div>
  )
}
