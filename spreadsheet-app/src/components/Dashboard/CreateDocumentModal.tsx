import React, { useState } from 'react'

interface CreateDocumentModalProps {
  onCreate: (name: string, rows: number, cols: number) => void
  onClose: () => void
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  onCreate,
  onClose,
}) => {
  const [name, setName] = useState('Новая таблица')
  const [rows, setRows] = useState(100)
  const [cols, setCols] = useState(26)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim(), rows, cols)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Создать новый документ</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Строк</label>
              <input
                type="number"
                value={rows}
                onChange={(e) =>
                  setRows(Math.max(1, parseInt(e.target.value) || 100))
                }
                min={1}
                max={10000}
              />
            </div>
            <div className="form-group">
              <label>Столбцов</label>
              <input
                type="number"
                value={cols}
                onChange={(e) =>
                  setCols(Math.max(1, parseInt(e.target.value) || 26))
                }
                min={1}
                max={702} // до ZZ
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit">Создать</button>
          </div>
        </form>
      </div>
    </div>
  )
}
