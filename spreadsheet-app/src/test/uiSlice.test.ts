import { describe, it, expect } from 'vitest'
import uiReducer, {
  setSaveStatus,
  openCreateModal,
  closeCreateModal,
  openImportModal,
  closeImportModal,
} from '@/store/slices/uiSlice'

import type { UIState } from '@/store/slices/uiSlice'
import type { SaveStatus } from '@/types/documents'

describe('uiSlice', () => {
  const initialState: UIState = {
    saveStatus: { status: 'saved', lastSaved: null },
    createModalOpen: false,
    importModalOpen: false,
  }

  it('should update save status', () => {
    const newStatus: SaveStatus = {
      status: 'saving',
      lastSaved: new Date('2025-01-01'),
    }
    const state = uiReducer(initialState, setSaveStatus(newStatus))
    expect(state.saveStatus.status).toBe('saving')
    expect(state.saveStatus.lastSaved).toEqual(new Date('2025-01-01'))
  })

  it('should open and close create modal', () => {
    let state = uiReducer(initialState, openCreateModal())
    expect(state.createModalOpen).toBe(true)
    state = uiReducer(state, closeCreateModal())
    expect(state.createModalOpen).toBe(false)
  })

  it('should open and close import modal', () => {
    let state = uiReducer(initialState, openImportModal())
    expect(state.importModalOpen).toBe(true)
    state = uiReducer(state, closeImportModal())
    expect(state.importModalOpen).toBe(false)
  })
})
