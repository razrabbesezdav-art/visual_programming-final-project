import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { documentsApi } from '@/api/documents'

export function useDocumentName(documentId: string | undefined): string {
  const [name, setName] = useState<string>('')
  const documents = useAppSelector((state) => state.documents.list)

  useEffect(() => {
    if (!documentId) return
    const doc = documents.find((d) => d.id === documentId)
    if (doc) {
      setTimeout(() => setName(doc.name), 0)
    } else {
      documentsApi
        .get(documentId)
        .then((doc) => setName(doc.name))
        .catch(() => setName('Документ'))
    }
  }, [documentId, documents])

  return name
}
