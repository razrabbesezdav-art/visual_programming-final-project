import React, { useState } from 'react'
import { Dashboard } from './components/Dashboard/Dashboard'
import { Spreadsheet } from './components/Spreadsheet'

const App: React.FC = () => {
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    null
  )

  return (
    <div className="app">
      {currentDocumentId ? (
        <Spreadsheet
          documentId={currentDocumentId}
          onBack={() => setCurrentDocumentId(null)}
        />
      ) : (
        <Dashboard onOpenDocument={setCurrentDocumentId} />
      )}
    </div>
  )
}

export default App
