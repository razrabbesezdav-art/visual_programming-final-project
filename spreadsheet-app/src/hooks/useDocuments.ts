import { useState, useCallback, useEffect } from 'react'
import { documentsApi } from '@/api/documents'
import { DocumentPreview, Document } from '@/types/documents'
import { SpreadsheetStore } from '@/types'
import { downloadJSON, downloadCSV } from '@/utils/exportImport'
import { importCSV as parseCSV } from '@/utils/csv'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загрузка списка документов
  useEffect(() => {
    const fetchDocuments = async () => {
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
    }
    fetchDocuments()
  }, [])

  const createDocument = useCallback(
    async (name: string, rows: number, cols: number) => {
      try {
        const doc = await documentsApi.create({
          name,
          rowCount: rows,
          colCount: cols,
        })
        const docs = await documentsApi.list()
        setDocuments(docs)
        return doc
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create document')
        return null
      }
    },
    []
  )

  const renameDocument = useCallback(async (id: string, newName: string) => {
    try {
      await documentsApi.update(id, { name: newName })
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename document')
    }
  }, [])

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await documentsApi.delete(id)
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete document')
    }
  }, [])

  const duplicateDocument = useCallback(async (id: string, newName: string) => {
    try {
      await documentsApi.duplicate(id, newName)
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to duplicate document')
    }
  }, [])

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

        await documentsApi.update(doc.id, { cells })
        const docs = await documentsApi.list()
        setDocuments(docs)
        return doc
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to import document')
        return null
      }
    },
    []
  )

  return {
    documents,
    loading,
    error,
    loadDocuments: () => {},
    createDocument,
    renameDocument,
    deleteDocument,
    duplicateDocument,
    loadDocument,
    exportDocument,
    importDocument,
  }
}
