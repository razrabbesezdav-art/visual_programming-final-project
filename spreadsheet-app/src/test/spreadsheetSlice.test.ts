import { describe, it, expect } from 'vitest'
import spreadsheetReducer, {
  updateCell,
  undo,
  redo,
  pushHistory,
  loadDocument,
  setColumnWidth,
  setRowHeight,
  addRowAbove,
  deleteRow,
  addColumnLeft,
  deleteColumn,
} from '@/store/slices/spreadsheetSlice'

import type { UnknownAction } from 'redux'

describe('spreadsheetSlice', () => {
  it('should initialize with empty cells', () => {
    const state = spreadsheetReducer(undefined, {
      type: '@@INIT',
    } as UnknownAction)
    expect(state.rowCount).toBe(100)
    expect(state.colCount).toBe(26)
    expect(state.cells).toEqual({})
    expect(state.past).toHaveLength(0)
    expect(state.future).toHaveLength(0)
  })

  it('should update a cell value and recalc', () => {
    const state = spreadsheetReducer(
      undefined,
      updateCell({ position: { row: 0, col: 0 }, value: '42' })
    )
    expect(state.cells['A1'].displayValue).toBe('42')
    expect(state.cells['A1'].type).toBe('number')
  })

  it('should push history and undo last update', () => {
    let state = spreadsheetReducer(undefined, pushHistory())
    state = spreadsheetReducer(
      state,
      updateCell({ position: { row: 0, col: 0 }, value: '100' })
    )
    expect(state.cells['A1'].displayValue).toBe('100')
    state = spreadsheetReducer(state, undo())
    expect(state.cells['A1']?.displayValue).toBeUndefined()
    expect(state.cells['A1']).toBeUndefined()
  })

  it('should redo after undo', () => {
    let state = spreadsheetReducer(undefined, pushHistory())
    state = spreadsheetReducer(
      state,
      updateCell({ position: { row: 0, col: 0 }, value: '999' })
    )
    state = spreadsheetReducer(state, undo())
    state = spreadsheetReducer(state, redo())
    expect(state.cells['A1'].displayValue).toBe('999')
  })

  it('should load a document and reset history', () => {
    const doc = {
      cells: {
        A1: {
          rawValue: 'x',
          computedValue: 'x',
          displayValue: 'x',
          type: 'string' as const,
        },
      },
      columnWidths: { 0: 150 },
      rowHeights: { 0: 30 },
      rowCount: 10,
      colCount: 5,
    }
    const state = spreadsheetReducer(undefined, loadDocument(doc))
    expect(state.cells['A1'].displayValue).toBe('x')
    expect(state.columnWidths[0]).toBe(150)
    expect(state.rowHeights[0]).toBe(30)
    expect(state.rowCount).toBe(10)
    expect(state.colCount).toBe(5)
    expect(state.past).toHaveLength(0)
  })

  it('should set column and row sizes', () => {
    let state = spreadsheetReducer(
      undefined,
      setColumnWidth({ col: 2, width: 200 })
    )
    expect(state.columnWidths[2]).toBe(200)

    state = spreadsheetReducer(state, setRowHeight({ row: 3, height: 40 }))
    expect(state.rowHeights[3]).toBe(40)
  })

  it('should add and delete rows/columns', () => {
    // Добавим строку выше 0, количество строк увеличится
    let state = spreadsheetReducer(undefined, addRowAbove(0))
    expect(state.rowCount).toBe(101)
    // Удалим строку 0, количество вернётся
    state = spreadsheetReducer(state, deleteRow(0))
    expect(state.rowCount).toBe(100)

    // Добавим столбец слева от 0
    state = spreadsheetReducer(undefined, addColumnLeft(0))
    expect(state.colCount).toBe(27)
    // Удалим столбец 0
    state = spreadsheetReducer(state, deleteColumn(0))
    expect(state.colCount).toBe(26)
  })

  it('should recalc formulas when updating a cell', () => {
    // Установим A1 = 5
    let state = spreadsheetReducer(
      undefined,
      updateCell({ position: { row: 0, col: 0 }, value: '5' })
    )
    // Установим B1 = =A1*2
    state = spreadsheetReducer(
      state,
      updateCell({ position: { row: 0, col: 1 }, value: '=A1*2' })
    )
    expect(state.cells['B1'].displayValue).toBe('10')
  })
})
