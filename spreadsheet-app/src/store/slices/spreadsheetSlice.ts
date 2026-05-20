import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  CellData,
  SpreadsheetStore,
  Position,
  CellRange,
  CellStyle,
  ClipboardData,
} from '@/types'
import { toCellId, parseCellId } from '@/utils/cellUtils'
import { evaluateFormula, detectType } from '@/utils/formulaParser'

interface SpreadsheetState extends SpreadsheetStore {
  selectedCell: Position | null
  selectedRange: CellRange | null
  editingCell: Position | null
  scrollTop: number
  scrollLeft: number
  past: Pick<
    SpreadsheetStore,
    'cells' | 'columnWidths' | 'rowHeights' | 'rowCount' | 'colCount'
  >[]
  future: Pick<
    SpreadsheetStore,
    'cells' | 'columnWidths' | 'rowHeights' | 'rowCount' | 'colCount'
  >[]
}

const initialState: SpreadsheetState = {
  cells: {},
  columnWidths: {},
  rowHeights: {},
  rowCount: 100,
  colCount: 26,
  selectedCell: null,
  selectedRange: null,
  editingCell: null,
  scrollTop: 0,
  scrollLeft: 0,
  past: [],
  future: [],
}

const DEFAULT_COL_WIDTH = 100
const DEFAULT_ROW_HEIGHT = 24
const MAX_HISTORY = 50

const recalcAll = (state: SpreadsheetState): void => {
  const newCells = { ...state.cells }

  for (const id in newCells) {
    const cell = newCells[id]
    if (cell.type !== 'formula') {
      switch (cell.type) {
        case 'number': {
          const num = Number(cell.rawValue)
          newCells[id] = {
            ...cell,
            computedValue: isNaN(num) ? null : num,
            displayValue: cell.rawValue,
          }
          break
        }
        case 'boolean': {
          const bool = cell.rawValue?.toLowerCase() === 'true'
          newCells[id] = {
            ...cell,
            computedValue: bool,
            displayValue: cell.rawValue,
          }
          break
        }
        default: {
          newCells[id] = {
            ...cell,
            computedValue: cell.rawValue || null,
            displayValue: cell.rawValue || '',
          }
        }
      }
    }
  }

  for (const id in newCells) {
    const cell = newCells[id]
    if (cell.type === 'formula') {
      const res = evaluateFormula(cell.rawValue, (refId) => newCells[refId])
      const newDisplay =
        res === null || res === undefined ? '#ERROR' : String(res)
      newCells[id] = {
        ...cell,
        computedValue: res,
        displayValue: newDisplay,
      }
    }
  }

  state.cells = newCells
}

const snapshot = (state: SpreadsheetState) => ({
  cells: state.cells,
  columnWidths: state.columnWidths,
  rowHeights: state.rowHeights,
  rowCount: state.rowCount,
  colCount: state.colCount,
})

const applySnapshot = (
  state: SpreadsheetState,
  snap: ReturnType<typeof snapshot>
) => {
  state.cells = snap.cells
  state.columnWidths = snap.columnWidths
  state.rowHeights = snap.rowHeights
  state.rowCount = snap.rowCount
  state.colCount = snap.colCount
}

const shiftRows = (
  cells: Record<string, CellData>,
  rowCount: number,
  colCount: number,
  startRow: number,
  direction: 'down' | 'up',
  insertEmptyRowAt: number | null
): { cells: Record<string, CellData>; rowCount: number } => {
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

const shiftCols = (
  cells: Record<string, CellData>,
  rowCount: number,
  colCount: number,
  startCol: number,
  direction: 'right' | 'left',
  insertEmptyColAt: number | null
): { cells: Record<string, CellData>; colCount: number } => {
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

const spreadshetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    undo(state) {
      if (state.past.length === 0) return
      const previous = state.past[state.past.length - 1]
      state.past.pop()
      state.future.push(snapshot(state))
      applySnapshot(state, previous)
    },
    redo(state) {
      if (state.future.length === 0) return
      const next = state.future[state.future.length - 1]
      state.future.pop()
      state.past.push(snapshot(state))
      applySnapshot(state, next)
    },

    pushHistory(state) {
      state.past.push(snapshot(state))
      if (state.past.length > MAX_HISTORY) state.past.shift()
      state.future = []
    },

    updateCell(
      state,
      action: PayloadAction<{ position: Position; value: string }>
    ) {
      const { position, value } = action.payload
      const id = toCellId(position.row, position.col)
      const type = detectType(value)
      const newCell: CellData = {
        rawValue: value,
        computedValue: null,
        displayValue: value,
        type,
      }
      state.cells[id] = newCell
      recalcAll(state)
    },

    loadDocument(
      state,
      action: PayloadAction<{
        cells: Record<string, CellData>
        columnWidths: Record<number, number>
        rowHeights: Record<number, number>
        rowCount: number
        colCount: number
      }>
    ) {
      const { cells, columnWidths, rowHeights, rowCount, colCount } =
        action.payload
      state.cells = { ...cells }
      state.columnWidths = { ...columnWidths }
      state.rowHeights = { ...rowHeights }
      state.rowCount = rowCount
      state.colCount = colCount
      state.past = []
      state.future = []
      recalcAll(state)
    },

    setColumnWidth(
      state,
      action: PayloadAction<{ col: number; width: number }>
    ) {
      state.columnWidths[action.payload.col] = action.payload.width
    },
    setRowHeight(
      state,
      action: PayloadAction<{ row: number; height: number }>
    ) {
      state.rowHeights[action.payload.row] = action.payload.height
    },

    setSelectedCell(state, action: PayloadAction<Position | null>) {
      state.selectedCell = action.payload
    },
    setSelectedRange(state, action: PayloadAction<CellRange | null>) {
      state.selectedRange = action.payload
    },
    setEditingCell(state, action: PayloadAction<Position | null>) {
      state.editingCell = action.payload
    },
    setScrollTop(state, action: PayloadAction<number>) {
      state.scrollTop = action.payload
    },
    setScrollLeft(state, action: PayloadAction<number>) {
      state.scrollLeft = action.payload
    },

    addRowAbove(state, action: PayloadAction<number>) {
      const row = action.payload
      const { cells, rowCount } = shiftRows(
        state.cells,
        state.rowCount,
        state.colCount,
        row,
        'down',
        row
      )
      const newHeights = { ...state.rowHeights }
      for (let r = state.rowCount - 1; r >= row; r--) {
        newHeights[r + 1] = newHeights[r] || DEFAULT_ROW_HEIGHT
      }
      newHeights[row] = DEFAULT_ROW_HEIGHT
      state.cells = cells
      state.rowCount = rowCount
      state.rowHeights = newHeights
      recalcAll(state)
    },
    addRowBelow(state, action: PayloadAction<number>) {
      const insertAt = action.payload + 1
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
      state.cells = cells
      state.rowCount = rowCount
      state.rowHeights = newHeights
      recalcAll(state)
    },
    deleteRow(state, action: PayloadAction<number>) {
      const row = action.payload
      const { cells, rowCount } = shiftRows(
        state.cells,
        state.rowCount,
        state.colCount,
        row,
        'up',
        null
      )
      const newHeights = { ...state.rowHeights }
      for (let r = row; r < state.rowCount - 1; r++) {
        newHeights[r] = newHeights[r + 1] || DEFAULT_ROW_HEIGHT
      }
      delete newHeights[state.rowCount - 1]
      state.cells = cells
      state.rowCount = rowCount
      state.rowHeights = newHeights
      recalcAll(state)
    },

    addColumnLeft(state, action: PayloadAction<number>) {
      const col = action.payload
      const { cells, colCount } = shiftCols(
        state.cells,
        state.rowCount,
        state.colCount,
        col,
        'right',
        col
      )
      const newWidths = { ...state.columnWidths }
      for (let c = state.colCount - 1; c >= col; c--) {
        newWidths[c + 1] = newWidths[c] || DEFAULT_COL_WIDTH
      }
      newWidths[col] = DEFAULT_COL_WIDTH
      state.cells = cells
      state.colCount = colCount
      state.columnWidths = newWidths
      recalcAll(state)
    },
    addColumnRight(state, action: PayloadAction<number>) {
      const insertAt = action.payload + 1
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
      state.cells = cells
      state.colCount = colCount
      state.columnWidths = newWidths
      recalcAll(state)
    },
    deleteColumn(state, action: PayloadAction<number>) {
      const col = action.payload
      const { cells, colCount } = shiftCols(
        state.cells,
        state.rowCount,
        state.colCount,
        col,
        'left',
        null
      )
      const newWidths = { ...state.columnWidths }
      for (let c = col; c < state.colCount - 1; c++) {
        newWidths[c] = newWidths[c + 1] || DEFAULT_COL_WIDTH
      }
      delete newWidths[state.colCount - 1]
      state.cells = cells
      state.colCount = colCount
      state.columnWidths = newWidths
      recalcAll(state)
    },

    updateCellStyle(
      state,
      action: PayloadAction<{
        positions: Position[]
        style: Partial<CellStyle>
      }>
    ) {
      const { positions, style } = action.payload
      for (const pos of positions) {
        const id = toCellId(pos.row, pos.col)
        const existing = state.cells[id] || {
          rawValue: '',
          computedValue: null,
          displayValue: '',
          type: 'string' as const,
        }
        state.cells[id] = {
          ...existing,
          style: { ...existing.style, ...style },
        }
      }
      state.past.push(snapshot(state))
      if (state.past.length > MAX_HISTORY) state.past.shift()
      state.future = []
    },

    clearCellStyles(state, action: PayloadAction<Position[]>) {
      for (const pos of action.payload) {
        const id = toCellId(pos.row, pos.col)
        if (state.cells[id]) {
          const { style, ...rest } = state.cells[id]
          state.cells[id] = rest
        }
      }
      state.past.push(snapshot(state))
      if (state.past.length > MAX_HISTORY) state.past.shift()
      state.future = []
    },

    copyRange(state, action: PayloadAction<CellRange>) {},

    pasteRange(
      state,
      action: PayloadAction<{
        targetPos: Position
        clipboardData: ClipboardData
      }>
    ) {
      const { targetPos, clipboardData } = action.payload
      const { values, styles } = clipboardData

      for (let r = 0; r < values.length; r++) {
        for (let c = 0; c < values[0].length; c++) {
          const row = targetPos.row + r
          const col = targetPos.col + c
          if (row >= state.rowCount || col >= state.colCount) continue

          const id = toCellId(row, col)
          const value = values[r][c]
          const type = detectType(value)

          state.cells[id] = {
            rawValue: value,
            computedValue: null,
            displayValue: value,
            type,
            style: styles?.[r]?.[c],
          }
        }
      }
      recalcAll(state)
      state.past.push(snapshot(state))
      if (state.past.length > MAX_HISTORY) state.past.shift()
      state.future = []
    },

    cutRange(state, action: PayloadAction<CellRange>) {
      const minRow = Math.min(action.payload.start.row, action.payload.end.row)
      const maxRow = Math.max(action.payload.start.row, action.payload.end.row)
      const minCol = Math.min(action.payload.start.col, action.payload.end.col)
      const maxCol = Math.max(action.payload.start.col, action.payload.end.col)

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const id = toCellId(row, col)
          state.cells[id] = {
            rawValue: '',
            computedValue: null,
            displayValue: '',
            type: 'string',
          }
        }
      }
      recalcAll(state)
      state.past.push(snapshot(state))
      if (state.past.length > MAX_HISTORY) state.past.shift()
      state.future = []
    },

    selectAll(state) {
      state.selectedCell = { row: 0, col: 0 }
      state.selectedRange = {
        start: { row: 0, col: 0 },
        end: { row: state.rowCount - 1, col: state.colCount - 1 },
      }
    },

    clearCells(state, action: PayloadAction<Position[]>) {
      for (const pos of action.payload) {
        const id = toCellId(pos.row, pos.col)
        state.cells[id] = {
          rawValue: '',
          computedValue: null,
          displayValue: '',
          type: 'string',
        }
      }
      recalcAll(state)
      state.past.push(snapshot(state))
      if (state.past.length > MAX_HISTORY) state.past.shift()
      state.future = []
    },
  },
})

export const {
  undo,
  redo,
  pushHistory,
  updateCell,
  loadDocument,
  setColumnWidth,
  setRowHeight,
  setSelectedCell,
  setSelectedRange,
  setEditingCell,
  setScrollTop,
  setScrollLeft,
  addRowAbove,
  addRowBelow,
  deleteRow,
  addColumnLeft,
  addColumnRight,
  deleteColumn,
  updateCellStyle,
  clearCellStyles,
  copyRange,
  pasteRange,
  cutRange,
  selectAll,
  clearCells,
} = spreadshetSlice.actions

export default spreadshetSlice.reducer
