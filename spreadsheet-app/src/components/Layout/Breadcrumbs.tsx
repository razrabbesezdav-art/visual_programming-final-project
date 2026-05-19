import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDocumentName } from '@/hooks/useDocumentName'

export const Breadcrumbs: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>()
  const documentName = useDocumentName(documentId)

  const breadcrumbs = [
    { path: '/dashboard', label: 'Мои документы', show: true },
    ...(documentId && documentName
      ? [{ path: `/documents/${documentId}`, label: documentName, show: true }]
      : []),
  ]

  return (
    <div className="breadcrumbs">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span className="breadcrumb-separator">›</span>}
          <Link to={crumb.path} className="breadcrumb-link">
            {crumb.label}
          </Link>
        </React.Fragment>
      ))}
    </div>
  )
}
