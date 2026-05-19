import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spreadsheet } from '@/components/Spreadsheet'
import { useAppSelector } from '@/store/hooks'
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker'
import { documentsApi } from '@/api/documents'

export const SpreadsheetPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const documents = useAppSelector((state) => state.documents.list)

  useNavigationBlocker()

  useEffect(() => {
    if (!documentId) return

    const checkDocumentAccess = async () => {
      try {
        await documentsApi.get(documentId)
      } catch (error: any) {
        if (error.status === 403 || error.status === 404) {
          navigate('/dashboard', { replace: true })
        } else {
          console.error('Не удалось загрузить документ:', error)
        }
      }
    }

    if (documents.length > 0) {
      const exists = documents.some((doc) => doc.id === documentId)
      if (!exists) {
        checkDocumentAccess()
      }
    } else {
      checkDocumentAccess()
    }
  }, [documentId, documents, navigate])

  const handleBack = () => {
    navigate('/dashboard')
  }

  return <Spreadsheet documentId={documentId || null} onBack={handleBack} />
}
