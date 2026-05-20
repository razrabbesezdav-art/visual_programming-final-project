import { Middleware, isAction } from '@reduxjs/toolkit'
import { setUnsavedChanges } from '@/store/slices/uiSlice'

const TRACKED_ACTIONS = [
  'spreadsheet/updateCell',
  'spreadsheet/addRow',
  'spreadsheet/addCol',
  'spreadsheet/deleteRow',
  'spreadsheet/deleteCol',
  'spreadsheet/updateCellStyle',
  'spreadsheet/clearCells',
  'spreadsheet/pasteRange',
  'spreadsheet/cutRange',
  'spreadsheet/setColumnWidth',
  'spreadsheet/setRowHeight',
  'spreadsheet/clearCellStyles',
]

export const autoSaveMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)

  if (
    isAction(action) &&
    TRACKED_ACTIONS.some((prefix) => action.type.startsWith(prefix))
  ) {
    store.dispatch(setUnsavedChanges(true))
  }

  return result
}
