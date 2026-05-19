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

  // Блокировка ухода при несохраненных изменениях
  useNavigationBlocker()

  useEffect(() => {
    if (documentId && documents.length > 0) {
      const exists = documents.some((doc) => doc.id === documentId)
      if (!exists) {
        documentsApi.get(documentId).catch(() => {
          navigate('/404', { replace: true })
        })
      }
    }
  }, [documentId, documents, navigate])

  const handleBack = () => {
    navigate('/dashboard')
  }

  return <Spreadsheet documentId={documentId || null} onBack={handleBack} />
}
