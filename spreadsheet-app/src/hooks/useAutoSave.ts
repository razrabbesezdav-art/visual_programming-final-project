import { useRef, useCallback, useEffect, useState } from 'react'
import { documentsApi } from '@/api/documents'
import { SaveStatus } from '@/types/documents'
import { SpreadsheetStore } from '@/types'

const DEBOUNCE_MS = 500

export function useAutoSave(
  documentId: string | null,
  store: SpreadsheetStore
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    status: 'saved',
    lastSaved: null,
  })

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const hasChanges = useRef(false)
  const lastSavedStore = useRef<SpreadsheetStore | null>(null)

  const save = useCallback(async () => {
    if (!documentId) return

    setSaveStatus((prev) => ({ ...prev, status: 'saving' }))

    try {
      const changedFields: Record<string, unknown> = {}

      // Сравниваем с последним сохраненным состоянием
      if (lastSavedStore.current) {
        const current = store.cells
        const saved = lastSavedStore.current.cells

        // Отправляем только измененные ячейки
        const changedCells: Record<string, unknown> = {}
        for (const key in current) {
          if (JSON.stringify(current[key]) !== JSON.stringify(saved[key])) {
            changedCells[key] = current[key]
          }
        }

        if (Object.keys(changedCells).length > 0) {
          changedFields.cells = changedCells
        }
      } else {
        changedFields.cells = store.cells
      }

      if (Object.keys(changedFields).length > 0) {
        await documentsApi.update(documentId, changedFields)
        lastSavedStore.current = JSON.parse(JSON.stringify(store))
        hasChanges.current = false
      }

      setSaveStatus({
        status: 'saved',
        lastSaved: new Date(),
      })
    } catch (error) {
      setSaveStatus({
        status: 'error',
        lastSaved: lastSavedStore.current ? new Date() : null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [documentId, store])

  const scheduleSave = useCallback(() => {
    hasChanges.current = true

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    setSaveStatus((prev) => ({
      ...prev,
      status: 'unsaved' as const,
    }))

    debounceTimer.current = setTimeout(() => {
      save()
    }, DEBOUNCE_MS)
  }, [save])

  const manualSave = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    await save()
  }, [save])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges.current) {
        e.preventDefault()
        e.returnValue = 'У вас есть несохраненные изменения'
        return e.returnValue
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        manualSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [manualSave])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return { saveStatus, scheduleSave, manualSave, save }
}
