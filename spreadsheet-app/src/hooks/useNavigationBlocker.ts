import { useCallback, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export function useNavigationBlocker() {
  const hasUnsavedChanges = useAppSelector(
    (state) => state.ui.hasUnsavedChanges
  )

  const blocker = useBlocker(hasUnsavedChanges)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const shouldLeave = window.confirm(
        'У вас есть несохранённые изменения. Вы действительно хотите уйти?'
      )

      if (shouldLeave) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  return blocker
}
