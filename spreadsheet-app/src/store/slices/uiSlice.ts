import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SaveStatus } from '@/types/documents'

export interface UIState {
  saveStatus: SaveStatus
  createModalOpen: boolean
  importModalOpen: boolean
  hasUnsavedChanges: boolean
}

const initialState: UIState = {
  saveStatus: { status: 'saved', lastSaved: null },
  createModalOpen: false,
  importModalOpen: false,
  hasUnsavedChanges: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSaveStatus(state, action: PayloadAction<SaveStatus>) {
      state.saveStatus = action.payload
      if (action.payload.status === 'saved') {
        state.hasUnsavedChanges = false
      }
    },
    setUnsavedChanges(state, action: PayloadAction<boolean>) {
      state.hasUnsavedChanges = action.payload
    },
    openCreateModal(state) {
      state.createModalOpen = true
    },
    closeCreateModal(state) {
      state.createModalOpen = false
    },
    openImportModal(state) {
      state.importModalOpen = true
    },
    closeImportModal(state) {
      state.importModalOpen = false
    },
  },
})

export const {
  setSaveStatus,
  setUnsavedChanges,
  openCreateModal,
  closeCreateModal,
  openImportModal,
  closeImportModal,
} = uiSlice.actions

export default uiSlice.reducer
