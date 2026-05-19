import { configureStore } from '@reduxjs/toolkit'
import spreadsheetReducer from './slices/spreadsheetSlice'
import documentsReducer from './slices/documentsSlice'
import uiReducer from './slices/uiSlice'
import authReducer from './slices/authSlice'
import { autoSaveMiddleware } from './middleware/autoSaveMiddleware'

export const store = configureStore({
  reducer: {
    spreadsheet: spreadsheetReducer,
    documents: documentsReducer,
    ui: uiReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(autoSaveMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
