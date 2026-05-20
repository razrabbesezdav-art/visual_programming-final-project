import {
  Document,
  DocumentPreview,
  CreateDocumentDTO,
  UpdateDocumentDTO,
} from '@/types/documents'
import { CellData, SpreadsheetStore } from '@/types'
import { getCurrentUserId } from './client'

function getStorageKey(userId: string): string {
  return `spreadsheet-documents-${userId}`
}

function getUserDocuments(): Document[] {
  const userId = getCurrentUserId()
  if (!userId) return []
  const data = localStorage.getItem(getStorageKey(userId))
  return data ? JSON.parse(data) : []
}

function saveUserDocuments(docs: Document[]) {
  const userId = getCurrentUserId()
  if (!userId) throw new Error('Пользователь не авторизован')
  localStorage.setItem(getStorageKey(userId), JSON.stringify(docs))
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function createEmptyCells(
  rows: number,
  cols: number
): Record<string, CellData> {
  const cells: Record<string, CellData> = {}
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellId = `${String.fromCharCode(65 + c)}${r + 1}`
      cells[cellId] = {
        rawValue: '',
        computedValue: null,
        displayValue: '',
        type: 'string',
      }
    }
  }
  return cells
}

function getPreview(doc: Document): string[][] {
  const preview: string[][] = []
  for (let r = 0; r < Math.min(3, doc.rowCount); r++) {
    const row: string[] = []
    for (let c = 0; c < Math.min(3, doc.colCount); c++) {
      const cellId = `${String.fromCharCode(65 + c)}${r + 1}`
      const cell = doc.cells[cellId]
      row.push(cell?.displayValue || '')
    }
    preview.push(row)
  }
  return preview
}

function exportToCSV(store: SpreadsheetStore): string {
  const lines: string[] = []
  let maxRow = 0,
    maxCol = 0
  for (let r = 0; r < store.rowCount; r++) {
    for (let c = 0; c < store.colCount; c++) {
      const cellId = `${String.fromCharCode(65 + c)}${r + 1}`
      const cell = store.cells[cellId]
      if (cell && (cell.displayValue || cell.rawValue)) {
        maxRow = Math.max(maxRow, r)
        maxCol = Math.max(maxCol, c)
      }
    }
  }
  if (maxRow === 0 && maxCol === 0) {
    const firstCell = store.cells['A1']
    if (!firstCell || (!firstCell.displayValue && !firstCell.rawValue))
      return ''
  }
  for (let r = 0; r <= maxRow; r++) {
    const line: string[] = []
    let hasData = false
    for (let c = 0; c <= maxCol; c++) {
      const cellId = `${String.fromCharCode(65 + c)}${r + 1}`
      const cell = store.cells[cellId]
      const value = cell ? cell.displayValue || cell.rawValue || '' : ''
      if (value) hasData = true
      line.push(escapeCSVField(value))
    }
    if (hasData) lines.push(line.join(','))
  }
  return lines.join('\n')
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function exportToJSON(store: SpreadsheetStore, doc: Document): string {
  const data = {
    name: doc.name,
    version: '1.0',
    exportedAt: new Date().toISOString(),
    spreadsheet: {
      rowCount: store.rowCount,
      colCount: store.colCount,
      columnWidths: store.columnWidths,
      rowHeights: store.rowHeights,
      cells: store.cells,
    },
  }
  return JSON.stringify(data, null, 2)
}

export const documentsApi = {
  list: async (): Promise<DocumentPreview[]> => {
    await delay(100)
    const userId = getCurrentUserId()
    if (!userId) throw new ApiError(401, 'Нет доступа')
    const docs = getUserDocuments()
    return docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      preview: getPreview(doc),
    }))
  },

  get: async (id: string): Promise<Document> => {
    await delay(100)
    const userId = getCurrentUserId()
    if (!userId) throw new ApiError(401, 'Нет доступа')
    const docs = getUserDocuments()
    const doc = docs.find((d) => d.id === id)
    if (!doc) throw new ApiError(404, 'Документ не найден')
    return doc
  },

  create: async (data: CreateDocumentDTO): Promise<Document> => {
    await delay(200)
    const userId = getCurrentUserId()
    if (!userId) throw new ApiError(401, 'Нет доступа')
    const docs = getUserDocuments()
    const now = new Date().toISOString()
    const newDoc: Document = {
      id: generateId(),
      userId,
      name: data.name,
      createdAt: now,
      updatedAt: now,
      rowCount: data.rowCount,
      colCount: data.colCount,
      cells: createEmptyCells(data.rowCount, data.colCount),
      columnWidths: Object.fromEntries(
        Array.from({ length: data.colCount }, (_, i) => [i, 100])
      ),
      rowHeights: Object.fromEntries(
        Array.from({ length: data.rowCount }, (_, i) => [i, 24])
      ),
    }
    docs.push(newDoc)
    saveUserDocuments(docs)
    return newDoc
  },

  update: async (
    id: string,
    updateData: UpdateDocumentDTO
  ): Promise<Document> => {
    await delay(150)
    const userId = getCurrentUserId()
    if (!userId) throw new ApiError(401, 'Нет доступа')
    const docs = getUserDocuments()
    const index = docs.findIndex((d) => d.id === id)
    if (index === -1) throw new ApiError(404, 'Документ не найден')
    const doc = docs[index]
    if (doc.userId !== userId) throw new ApiError(403, 'Доступ запрещён')

    if (updateData.name !== undefined) doc.name = updateData.name
    if (updateData.cells) doc.cells = { ...doc.cells, ...updateData.cells }
    if (updateData.columnWidths)
      doc.columnWidths = { ...doc.columnWidths, ...updateData.columnWidths }
    if (updateData.rowHeights)
      doc.rowHeights = { ...doc.rowHeights, ...updateData.rowHeights }

    doc.updatedAt = new Date().toISOString()
    docs[index] = doc
    saveUserDocuments(docs)
    return doc
  },

  delete: async (id: string): Promise<void> => {
    await delay(100)
    const userId = getCurrentUserId()
    if (!userId) throw new ApiError(401, 'Нет доступа')
    let docs = getUserDocuments()
    const doc = docs.find((d) => d.id === id)
    if (!doc) throw new ApiError(404, 'Документ не найден')
    if (doc.userId !== userId) throw new ApiError(403, 'Доступ запрещён')
    docs = docs.filter((d) => d.id !== id)
    saveUserDocuments(docs)
  },

  duplicate: async (id: string, newName: string): Promise<Document> => {
    await delay(200)
    const userId = getCurrentUserId()
    if (!userId) throw new ApiError(401, 'Нет доступа')
    const docs = getUserDocuments()
    const original = docs.find((d) => d.id === id)
    if (!original) throw new ApiError(404, 'Документ не найден')
    if (original.userId !== userId) throw new ApiError(403, 'Доступ запрещён')

    const now = new Date().toISOString()
    const duplicate: Document = {
      ...original,
      id: generateId(),
      name: newName,
      createdAt: now,
      updatedAt: now,
      cells: { ...original.cells },
      columnWidths: { ...original.columnWidths },
      rowHeights: { ...original.rowHeights },
    }
    docs.push(duplicate)
    saveUserDocuments(docs)
    return duplicate
  },

  export: async (
    id: string,
    format: 'csv' | 'json'
  ): Promise<{ content: string; filename: string }> => {
    await delay(100)
    const userId = getCurrentUserId()
    if (!userId) throw new ApiError(401, 'Нет доступа')
    const docs = getUserDocuments()
    const doc = docs.find((d) => d.id === id)
    if (!doc) throw new ApiError(404, 'Документ не найден')
    if (doc.userId !== userId) throw new ApiError(403, 'Доступ запрещён')

    const store: SpreadsheetStore = {
      cells: doc.cells,
      columnWidths: doc.columnWidths,
      rowHeights: doc.rowHeights,
      rowCount: doc.rowCount,
      colCount: doc.colCount,
    }
    if (format === 'csv') {
      const content = exportToCSV(store)
      return { content, filename: `${doc.name}.csv` }
    } else {
      const content = exportToJSON(store, doc)
      return { content, filename: `${doc.name}.json` }
    }
  },
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
