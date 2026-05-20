import { useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  copyRange,
  pasteRange,
  cutRange,
} from '@/store/slices/spreadsheetSlice'
import { Position, CellRange, ClipboardData } from '@/types'
import { getRangeValues, getRangeStyles } from '@/utils/selectionUtils'

export function useClipboard() {
  const dispatch = useAppDispatch()
  const { cells, selectedCell, selectedRange } = useAppSelector(
    (state) => state.spreadsheet
  )

  const copy = useCallback(async () => {
    const range =
      selectedRange ||
      (selectedCell ? { start: selectedCell, end: selectedCell } : null)
    if (!range) return

    const values = getRangeValues(cells, range)
    const styles = getRangeStyles(cells, range)

    const clipboardData: ClipboardData = {
      values,
      styles,
      range: { rows: values.length, cols: values[0]?.length || 0 },
    }

    dispatch(copyRange(range))

    try {
      const textData = values.map((row) => row.join('\t')).join('\n')
      await navigator.clipboard.writeText(textData)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [dispatch, selectedCell, selectedRange, cells])

  const cut = useCallback(async () => {
    const range =
      selectedRange ||
      (selectedCell ? { start: selectedCell, end: selectedCell } : null)
    if (!range) return

    await copy()
    dispatch(cutRange(range))
  }, [copy, dispatch, selectedCell, selectedRange])

  const paste = useCallback(async () => {
    if (!selectedCell) return

    try {
      const text = await navigator.clipboard.readText()
      const rows = text.split('\n').filter((row) => row.trim())
      const values = rows.map((row) => row.split('\t'))

      if (values.length > 0 && values[0].length > 0) {
        const clipboardData: ClipboardData = {
          values,
          styles: [],
          range: { rows: values.length, cols: values[0].length },
        }
        dispatch(pasteRange({ targetPos: selectedCell, clipboardData }))
      }
    } catch (err) {
      console.error('Paste failed:', err)
    }
  }, [dispatch, selectedCell])

  return { copy, cut, paste }
}
