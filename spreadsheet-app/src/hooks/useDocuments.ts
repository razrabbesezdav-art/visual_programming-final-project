import { useState, useCallback, useEffect } from 'react'
import { documentsApi } from '@/api/documents'
import { DocumentPreview, Document } from '@/types/documents'
import { SpreadsheetStore } from '@/types'
import { downloadJSON, downloadCSV } from '@/utils/exportImport'
import { exportToCSV, importCSV as parseCSV } from '@/utils/csv'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const docs = await documentsApi.list()
      setDocuments(docs)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const createDocument = useCallback(
    async (name: string, rows: number, cols: number) => {
      try {
        const doc = await documentsApi.create({
          name,
          rowCount: rows,
          colCount: cols,
        })
        await loadDocuments()
        return doc
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create document')
        return null
      }
    },
    [loadDocuments]
  )

  const renameDocument = useCallback(
    async (id: string, newName: string) => {
      try {
        await documentsApi.update(id, { name: newName })
        await loadDocuments()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to rename document')
      }
    },
    [loadDocuments]
  )

  const deleteDocument = useCallback(
    async (id: string) => {
      try {
        await documentsApi.delete(id)
        await loadDocuments()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete document')
      }
    },
    [loadDocuments]
  )

  const duplicateDocument = useCallback(
    async (id: string, newName: string) => {
      try {
        await documentsApi.duplicate(id, newName)
        await loadDocuments()
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Failed to duplicate document'
        )
      }
    },
    [loadDocuments]
  )

  const loadDocument = useCallback(
    async (id: string): Promise<Document | null> => {
      try {
        return await documentsApi.get(id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load document')
        return null
      }
    },
    []
  )

  const exportDocument = useCallback(
    async (id: string, format: 'csv' | 'json') => {
      try {
        const doc = await documentsApi.get(id)
        if (!doc) return

        const store: SpreadsheetStore = {
          cells: doc.cells,
          columnWidths: doc.columnWidths,
          rowHeights: doc.rowHeights,
          rowCount: doc.rowCount,
          colCount: doc.colCount,
        }

        if (format === 'csv') {
          downloadCSV(store)
        } else {
          downloadJSON(store)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to export document')
      }
    },
    []
  )

  const importDocument = useCallback(
    async (csvContent: string, name: string) => {
      try {
        const { cells, rowCount, colCount } = parseCSV(csvContent)

        const doc = await documentsApi.create({
          name,
          rowCount: Math.max(rowCount, 100),
          colCount: Math.max(colCount, 26),
        })

        // Обновляем ячейки
        await documentsApi.update(doc.id, { cells })
        await loadDocuments()
        return doc
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to import document')
        return null
      }
    },
    [loadDocuments]
  )

  return {
    documents,
    loading,
    error,
    loadDocuments,
    createDocument,
    renameDocument,
    deleteDocument,
    duplicateDocument,
    loadDocument,
    exportDocument,
    importDocument,
  }
}
