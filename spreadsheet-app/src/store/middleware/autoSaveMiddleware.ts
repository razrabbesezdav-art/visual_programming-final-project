import { Middleware, isAction } from '@reduxjs/toolkit'
import { documentsApi } from '@/api/documents'
import { RootState } from '..'
import { setSaveStatus, setUnsavedChanges } from '@/store/slices/uiSlice'

let saveTimer: number | null = null
const DEBOUNCE_MS = 500

export const autoSaveMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)

  if (
    isAction(action) &&
    (action.type.startsWith('spreadsheet/updateCell') ||
      action.type.startsWith('spreadsheet/addRow') ||
      action.type.startsWith('spreadsheet/addCol') ||
      action.type.startsWith('spreadsheet/deleteRow') ||
      action.type.startsWith('spreadsheet/deleteCol'))
  ) {
    store.dispatch(setUnsavedChanges(true))

    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const state = store.getState() as RootState
      const docId = state.documents.activeDocumentId
      if (!docId) return

      store.dispatch(setSaveStatus({ status: 'saving', lastSaved: new Date() }))

      documentsApi
        .update(docId, {
          cells: state.spreadsheet.cells,
          columnWidths: state.spreadsheet.columnWidths,
          rowHeights: state.spreadsheet.rowHeights,
        })
        .then(() => {
          store.dispatch(
            setSaveStatus({ status: 'saved', lastSaved: new Date() })
          )
        })
        .catch((err) => {
          store.dispatch(
            setSaveStatus({
              status: 'error',
              lastSaved: new Date(),
              error: err.message,
            })
          )
        })
    }, DEBOUNCE_MS)
  }
  return result
}
