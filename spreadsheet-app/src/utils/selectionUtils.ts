import { Position, CellRange, CellData, CellStyle } from '@/types'
import { toCellId } from './cellUtils'

export function getSelectedPositions(
  selectedCell: Position | null,
  selectedRange: CellRange | null
): Position[] {
  const positions: Position[] = []

  if (selectedRange) {
    const minRow = Math.min(selectedRange.start.row, selectedRange.end.row)
    const maxRow = Math.max(selectedRange.start.row, selectedRange.end.row)
    const minCol = Math.min(selectedRange.start.col, selectedRange.end.col)
    const maxCol = Math.max(selectedRange.start.col, selectedRange.end.col)

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        positions.push({ row, col })
      }
    }
  } else if (selectedCell) {
    positions.push(selectedCell)
  }

  return positions
}

export function getRangeValues(
  cells: Record<string, CellData>,
  range: CellRange
): string[][] {
  const minRow = Math.min(range.start.row, range.end.row)
  const maxRow = Math.max(range.start.row, range.end.row)
  const minCol = Math.min(range.start.col, range.end.col)
  const maxCol = Math.max(range.start.col, range.end.col)

  const result: string[][] = []
  for (let row = minRow; row <= maxRow; row++) {
    const rowData: string[] = []
    for (let col = minCol; col <= maxCol; col++) {
      const id = toCellId(row, col)
      const cell = cells[id]
      rowData.push(cell?.rawValue || '')
    }
    result.push(rowData)
  }
  return result
}

export function getRangeStyles(
  cells: Record<string, CellData>,
  range: CellRange
): CellStyle[][] {
  const minRow = Math.min(range.start.row, range.end.row)
  const maxRow = Math.max(range.start.row, range.end.row)
  const minCol = Math.min(range.start.col, range.end.col)
  const maxCol = Math.max(range.start.col, range.end.col)

  const result: CellStyle[][] = []
  for (let row = minRow; row <= maxRow; row++) {
    const rowData: CellStyle[] = []
    for (let col = minCol; col <= maxCol; col++) {
      const id = toCellId(row, col)
      const cell = cells[id]
      rowData.push(cell?.style || {})
    }
    result.push(rowData)
  }
  return result
}

export function formatValueByStyle(
  value: string | number | null,
  style?: CellStyle
): string {
  if (value === null || value === undefined) return ''

  const num = typeof value === 'number' ? value : Number(value)
  const isNumber = !isNaN(num)

  if (!isNumber) return String(value)

  switch (style?.numberFormat) {
    case 'percent':
      return `${(num * 100).toFixed(2)}%`
    case 'currency':
      return `$${num.toFixed(2)}`
    case 'date':
      return new Date(num).toLocaleDateString()
    default:
      return num.toString()
  }
}
