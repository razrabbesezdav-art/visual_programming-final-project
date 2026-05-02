export type CellType = 'string' | 'number' | 'boolean' | 'formula'

export interface CellData {
  rawValue: string   // ввод
  computedValue: string | number | boolean | null
  displayValue: string // отображение
  type: CellType
}

export interface Position {
  row: number
  col: number
}

export interface CellRange {
  start: Position
  end: Position
}

export interface SpreadsheetStore {
  cells: Record<string, CellData>
  columnWidths: Record<number, number>
  rowHeights: Record<number, number>
  rowCount: number
  colCount: number
}

export type Action =
  | { type: 'UPDATE_CELL'; position: Position; value: string }
  | { type: 'SET_COLUMN_WIDTH'; col: number; width: number }
  | { type: 'SET_ROW_HEIGHT'; row: number; height: number }
  | { type: 'ADD_ROW_ABOVE'; row: number }
  | { type: 'ADD_ROW_BELOW'; row: number }
  | { type: 'DELETE_ROW'; row: number }
  | { type: 'ADD_COLUMN_LEFT'; col: number }
  | { type: 'ADD_COLUMN_RIGHT'; col: number }
  | { type: 'DELETE_COLUMN'; col: number }