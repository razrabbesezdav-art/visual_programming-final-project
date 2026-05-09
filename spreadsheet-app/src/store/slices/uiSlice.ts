import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SaveStatus } from '@/types/documents'

export interface UIState {
  saveStatus: SaveStatus
  createModalOpen: boolean
  importModalOpen: boolean
}

const initialState: UIState = {
  saveStatus: { status: 'saved', lastSaved: null },
  createModalOpen: false,
  importModalOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSaveStatus(state, action: PayloadAction<SaveStatus>) {
      state.saveStatus = action.payload
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
  openCreateModal,
  closeCreateModal,
  openImportModal,
  closeImportModal,
} = uiSlice.actions
export default uiSlice.reducer
