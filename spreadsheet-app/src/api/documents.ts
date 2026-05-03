import {
  Document,
  DocumentPreview,
  CreateDocumentDTO,
  UpdateDocumentDTO,
} from '@/types/documents'
import { CellData } from '@/types'

const STORAGE_KEY = 'spreadsheet-documents'
const USER_ID = 'current-user'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Задержка для имитации сети
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Генерация ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Работа с localStorage
function getDocuments(): Document[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveDocuments(docs: Document[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

export const documentsApi = {
  // Получить список документов
  list: async (): Promise<DocumentPreview[]> => {
    await delay(100) // Имитация задержки сети
    const docs = getDocuments()
    return docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      preview: getPreview(doc),
    }))
  },

  // Получить документ по ID
  get: async (id: string): Promise<Document> => {
    await delay(100)
    const docs = getDocuments()
    const doc = docs.find((d) => d.id === id)
    if (!doc) throw new ApiError(404, 'Document not found')
    return doc
  },

  // Создать документ
  create: async (data: CreateDocumentDTO): Promise<Document> => {
    await delay(200)
    const docs = getDocuments()
    const now = new Date().toISOString()

    const newDoc: Document = {
      id: generateId(),
      userId: USER_ID,
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
    saveDocuments(docs)
    return newDoc
  },

  // Обновить документ (PATCH)
  update: async (id: string, data: UpdateDocumentDTO): Promise<Document> => {
    await delay(150)
    const docs = getDocuments()
    const index = docs.findIndex((d) => d.id === id)
    if (index === -1) throw new ApiError(404, 'Document not found')

    const doc = docs[index]

    // Обновляем поля
    if (data.name !== undefined) doc.name = data.name
    if (data.cells) {
      doc.cells = { ...doc.cells, ...data.cells }
    }
    if (data.columnWidths) {
      doc.columnWidths = { ...doc.columnWidths, ...data.columnWidths }
    }
    if (data.rowHeights) {
      doc.rowHeights = { ...doc.rowHeights, ...data.rowHeights }
    }

    doc.updatedAt = new Date().toISOString()
    docs[index] = doc
    saveDocuments(docs)
    return doc
  },

  // Удалить документ
  delete: async (id: string): Promise<void> => {
    await delay(100)
    const docs = getDocuments()
    const filtered = docs.filter((d) => d.id !== id)
    if (filtered.length === docs.length) {
      throw new ApiError(404, 'Document not found')
    }
    saveDocuments(filtered)
  },

  // Дублировать документ
  duplicate: async (id: string, newName: string): Promise<Document> => {
    await delay(200)
    const docs = getDocuments()
    const original = docs.find((d) => d.id === id)
    if (!original) throw new ApiError(404, 'Document not found')

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
    saveDocuments(docs)
    return duplicate
  },
}

// Создание пустых ячеек
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

// Создание превью (первые 3x3 ячейки)
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
