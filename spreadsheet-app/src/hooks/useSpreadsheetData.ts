import { useReducer, useCallback } from 'react'
import { SpreadsheetStore, CellData, Action, Position } from '@/types'
import { toCellId, parseCellId } from '@/utils/cellUtils'
import { evaluateFormula, detectType } from '@/utils/formulaParser'

// Размеры по умолчанию
const DEFAULT_ROWS = 100
const DEFAULT_COLS = 26
const DEFAULT_COL_WIDTH = 100
const DEFAULT_ROW_HEIGHT = 24

function initializeStore(rows: number, cols: number): SpreadsheetStore {
  const cells: Record<string, CellData> = {}
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = toCellId(r, c)
      cells[id] = {
        rawValue: '',
        computedValue: null,
        displayValue: '',
        type: 'string',
      }
    }
  }
  return {
    cells,
    columnWidths: Object.fromEntries(
      Array.from({ length: cols }, (_, i) => [i, DEFAULT_COL_WIDTH])
    ),
    rowHeights: Object.fromEntries(
      Array.from({ length: rows }, (_, i) => [i, DEFAULT_ROW_HEIGHT])
    ),
    rowCount: rows,
    colCount: cols,
  }
}

// пересчёт формул после любого изменения ячейки
function recalcAll(state: SpreadsheetStore): SpreadsheetStore {
  const newCells = { ...state.cells }
  for (const id in newCells) {
    const cell = newCells[id]
    if (cell.type === 'formula') {
      const res = evaluateFormula(
        cell.rawValue,
        (refId) => newCells[refId] || undefined
      )
      const newDisplay =
        res === null || res === undefined ? '#ERROR' : String(res)
      newCells[id] = {
        ...cell,
        computedValue: res,
        displayValue: newDisplay,
      }
    } else {
      newCells[id] = {
        ...cell,
        displayValue: cell.rawValue,
      }
    }
  }
  return { ...state, cells: newCells }
}

// добавление/удаление строк
function shiftRows(
  cells: Record<string, CellData>,
  rowCount: number,
  colCount: number,
  startRow: number,
  direction: 'down' | 'up',
  insertEmptyRowAt: number | null
): { cells: Record<string, CellData>; rowCount: number } {
  const newCells: Record<string, CellData> = {}
  for (const id in cells) {
    const { row, col } = parseCellId(id)
    let newRow = row
    if (direction === 'down' && row >= startRow) {
      newRow = row + 1
      if (newRow >= rowCount) continue
    } else if (direction === 'up' && row > startRow) {
      newRow = row - 1
    } else if (direction === 'up' && row === startRow) {
      continue
    }
    newCells[toCellId(newRow, col)] = cells[id]
  }
  if (insertEmptyRowAt !== null) {
    for (let c = 0; c < colCount; c++) {
      const id = toCellId(insertEmptyRowAt, c)
      newCells[id] = {
        rawValue: '',
        computedValue: null,
        displayValue: '',
        type: 'string',
      }
    }
  }
  return {
    cells: newCells,
    rowCount: direction === 'down' ? rowCount + 1 : rowCount - 1,
  }
}

// Сдвиг столбцов
function shiftCols(
  cells: Record<string, CellData>,
  rowCount: number,
  colCount: number,
  startCol: number,
  direction: 'right' | 'left',
  insertEmptyColAt: number | null
): { cells: Record<string, CellData>; colCount: number } {
  const newCells: Record<string, CellData> = {}
  for (const id in cells) {
    const { row, col } = parseCellId(id)
    let newCol = col
    if (direction === 'right' && col >= startCol) {
      newCol = col + 1
      if (newCol >= colCount) continue
    } else if (direction === 'left' && col > startCol) {
      newCol = col - 1
    } else if (direction === 'left' && col === startCol) {
      continue
    }
    newCells[toCellId(row, newCol)] = cells[id]
  }
  if (insertEmptyColAt !== null) {
    for (let r = 0; r < rowCount; r++) {
      newCells[toCellId(r, insertEmptyColAt)] = {
        rawValue: '',
        computedValue: null,
        displayValue: '',
        type: 'string',
      }
    }
  }
  return {
    cells: newCells,
    colCount: direction === 'right' ? colCount + 1 : colCount - 1,
  }
}

function reducer(state: SpreadsheetStore, action: Action): SpreadsheetStore {
  switch (action.type) {
    case 'UPDATE_CELL': {
      const id = toCellId(action.position.row, action.position.col)
      const type = detectType(action.value)
      const newCell: CellData = {
        rawValue: action.value,
        computedValue:
          type === 'number'
            ? Number(action.value)
            : type === 'boolean'
              ? action.value === 'true'
              : null,
        displayValue: action.value,
        type,
      }
      const newState: SpreadsheetStore = {
        ...state,
        cells: {
          ...state.cells,
          [id]: newCell,
        },
      }
      return recalcAll(newState)
    }

    case 'SET_COLUMN_WIDTH':
      return {
        ...state,
        columnWidths: {
          ...state.columnWidths,
          [action.col]: action.width,
        },
      }
    case 'SET_ROW_HEIGHT':
      return {
        ...state,
        rowHeights: {
          ...state.rowHeights,
          [action.row]: action.height,
        },
      }

    // Операции над строками
    case 'ADD_ROW_ABOVE': {
      const { cells, rowCount } = shiftRows(
        state.cells,
        state.rowCount,
        state.colCount,
        action.row,
        'down',
        action.row
      )
      const newHeights = { ...state.rowHeights }
      for (let r = state.rowCount - 1; r >= action.row; r--) {
        newHeights[r + 1] = newHeights[r] || DEFAULT_ROW_HEIGHT
      }
      newHeights[action.row] = DEFAULT_ROW_HEIGHT
      return recalcAll({ ...state, cells, rowCount, rowHeights: newHeights })
    }

    case 'ADD_ROW_BELOW': {
      const insertAt = action.row + 1
      const { cells, rowCount } = shiftRows(
        state.cells,
        state.rowCount,
        state.colCount,
        insertAt,
        'down',
        insertAt
      )
      const newHeights = { ...state.rowHeights }
      for (let r = state.rowCount - 1; r >= insertAt; r--) {
        newHeights[r + 1] = newHeights[r] || DEFAULT_ROW_HEIGHT
      }
      newHeights[insertAt] = DEFAULT_ROW_HEIGHT
      return recalcAll({ ...state, cells, rowCount, rowHeights: newHeights })
    }

    case 'DELETE_ROW': {
      const { cells, rowCount } = shiftRows(
        state.cells,
        state.rowCount,
        state.colCount,
        action.row,
        'up',
        null
      )
      const newHeights = { ...state.rowHeights }
      for (let r = action.row; r < state.rowCount - 1; r++) {
        newHeights[r] = newHeights[r + 1] || DEFAULT_ROW_HEIGHT
      }
      delete newHeights[state.rowCount - 1]
      return recalcAll({ ...state, cells, rowCount, rowHeights: newHeights })
    }

    // Операции над столбцами
    case 'ADD_COLUMN_LEFT': {
      const { cells, colCount } = shiftCols(
        state.cells,
        state.rowCount,
        state.colCount,
        action.col,
        'right',
        action.col
      )
      const newWidths = { ...state.columnWidths }
      for (let c = state.colCount - 1; c >= action.col; c--) {
        newWidths[c + 1] = newWidths[c] || DEFAULT_COL_WIDTH
      }
      newWidths[action.col] = DEFAULT_COL_WIDTH
      return recalcAll({ ...state, cells, colCount, columnWidths: newWidths })
    }

    case 'ADD_COLUMN_RIGHT': {
      const insertAt = action.col + 1
      const { cells, colCount } = shiftCols(
        state.cells,
        state.rowCount,
        state.colCount,
        insertAt,
        'right',
        insertAt
      )
      const newWidths = { ...state.columnWidths }
      for (let c = state.colCount - 1; c >= insertAt; c--) {
        newWidths[c + 1] = newWidths[c] || DEFAULT_COL_WIDTH
      }
      newWidths[insertAt] = DEFAULT_COL_WIDTH
      return recalcAll({ ...state, cells, colCount, columnWidths: newWidths })
    }

    case 'DELETE_COLUMN': {
      const { cells, colCount } = shiftCols(
        state.cells,
        state.rowCount,
        state.colCount,
        action.col,
        'left',
        null
      )
      const newWidths = { ...state.columnWidths }
      for (let c = action.col; c < state.colCount - 1; c++) {
        newWidths[c] = newWidths[c + 1] || DEFAULT_COL_WIDTH
      }
      delete newWidths[state.colCount - 1]
      return recalcAll({ ...state, cells, colCount, columnWidths: newWidths })
    }

    default:
      return state
  }
}

export function useSpreadsheetData(
  initialRows = DEFAULT_ROWS,
  initialCols = DEFAULT_COLS
) {
  const [store, dispatch] = useReducer(
    reducer,
    { rows: initialRows, cols: initialCols },
    () => initializeStore(initialRows, initialCols)
  )

  const updateCell = useCallback((pos: Position, value: string) => {
    dispatch({ type: 'UPDATE_CELL', position: pos, value })
  }, [])

  const setColumnWidth = useCallback((col: number, width: number) => {
    dispatch({ type: 'SET_COLUMN_WIDTH', col, width })
  }, [])

  const setRowHeight = useCallback((row: number, height: number) => {
    dispatch({ type: 'SET_ROW_HEIGHT', row, height })
  }, [])

  // Методы для контекстного меню
  const addRowAbove = useCallback(
    (row: number) => dispatch({ type: 'ADD_ROW_ABOVE', row }),
    []
  )
  const addRowBelow = useCallback(
    (row: number) => dispatch({ type: 'ADD_ROW_BELOW', row }),
    []
  )
  const deleteRow = useCallback(
    (row: number) => dispatch({ type: 'DELETE_ROW', row }),
    []
  )
  const addColLeft = useCallback(
    (col: number) => dispatch({ type: 'ADD_COLUMN_LEFT', col }),
    []
  )
  const addColRight = useCallback(
    (col: number) => dispatch({ type: 'ADD_COLUMN_RIGHT', col }),
    []
  )
  const deleteCol = useCallback(
    (col: number) => dispatch({ type: 'DELETE_COLUMN', col }),
    []
  )

  return {
    store,
    updateCell,
    setColumnWidth,
    setRowHeight,
    addRowAbove,
    addRowBelow,
    deleteRow,
    addColLeft,
    addColRight,
    deleteCol,
    dispatch,
  }
}
