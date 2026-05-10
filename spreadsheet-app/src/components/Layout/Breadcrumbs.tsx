import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { documentsApi } from '@/api/documents';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { documentId } = useParams<{ documentId: string }>();
  const [documentName, setDocumentName] = useState<string>('');
  const documents = useAppSelector(state => state.documents.list);
  
  useEffect(() => {
    if (documentId) {
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        setDocumentName(doc.name);
      } else {
        documentsApi.get(documentId)
          .then(doc => setDocumentName(doc.name))
          .catch(() => setDocumentName('Документ'));
      }
    }
  }, [documentId, documents]);
  
  const breadcrumbs = [
    { path: '/dashboard', label: 'Мои документы', show: true }
  ];
  
  if (documentId && documentName) {
    breadcrumbs.push({
      path: `/documents/${documentId}`,
      label: documentName,
      show: true
    });
  }
  
  return (
    <div className="breadcrumbs">
      {breadcrumbs
        .filter(b => b.show)
        .map((crumb, index, arr) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && <span className="breadcrumb-separator">›</span>}
            <Link to={crumb.path} className="breadcrumb-link">
              {crumb.label}
            </Link>
          </React.Fragment>
        ))
      }
    </div>
  );
};