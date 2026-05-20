import { CellData } from '@/types'
export interface Document {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
  rowCount: number
  colCount: number
  cells: Record<string, CellData>
  columnWidths: Record<number, number>
  rowHeights: Record<number, number>
}

export interface DocumentPreview {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  preview: string[][]
}

export interface CreateDocumentDTO {
  name: string
  rowCount: number
  colCount: number
}

export interface UpdateDocumentDTO {
  name?: string
  cells?: Record<string, CellData>
  columnWidths?: Record<number, number>
  rowHeights?: Record<number, number>
}

export interface SaveStatus {
  status: 'saved' | 'saving' | 'error' | 'unsaved'
  lastSaved: Date | null
  error?: string
}
