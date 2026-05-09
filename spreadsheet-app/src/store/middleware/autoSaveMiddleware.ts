import { Middleware } from '@reduxjs/toolkit'
import { documentsApi } from '@/api/documents'
import { RootState } from '..'

let saveTimer: number | null = null
const DEBOUNCE_MS = 500

export const autoSaveMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)
  const act = action as { type: string }
  if (
    act.type?.startsWith('spreadsheet/updateCell') ||
    act.type?.startsWith('spreadsheet/addRow') ||
    act.type?.startsWith('spreadsheet/addCol') ||
    act.type?.startsWith('spreadsheet/deleteRow') ||
    act.type?.startsWith('spreadsheet/deleteCol')
  ) {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const state = store.getState() as RootState
      const docId = state.documents.activeDocumentId
      if (!docId) return
      documentsApi
        .update(docId, {
          cells: state.spreadsheet.cells,
          columnWidths: state.spreadsheet.columnWidths,
          rowHeights: state.spreadsheet.rowHeights,
        })
        .then(() => {
          store.dispatch({
            type: 'ui/setSaveStatus',
            payload: { status: 'saved', lastSaved: new Date() },
          })
        })
        .catch((err) => {
          store.dispatch({
            type: 'ui/setSaveStatus',
            payload: {
              status: 'error',
              lastSaved: new Date(),
              error: err.message,
            },
          })
        })
    }, DEBOUNCE_MS)
  }
  return result
}
