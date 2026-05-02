export function toColumnLetter(col: number): string {
  let result = ''
  let n = col
  do {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return result
}

export function fromColumnLetter(letters: string): number {
  let col = 0
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64)
  }
  return col - 1
}

export function toCellId(row: number, col: number): string {
  const colLetter = toColumnLetter(col)
  return `${colLetter}${row + 1}`
}

export function parseCellId(cellId: string): { row: number; col: number } {
  const match = cellId.match(/^([A-Z]+)(\d+)$/)
  if (!match) throw new Error(`Invalid cell ID: ${cellId}`)
  const colStr = match[1]
  const row = parseInt(match[2], 10) - 1
  const col = fromColumnLetter(colStr)
  return { row, col }
}

export function isInRange(
  cell: { row: number; col: number },
  range: { start: { row: number; col: number }; end: { row: number; col: number } }
): boolean {
  const minRow = Math.min(range.start.row, range.end.row)
  const maxRow = Math.max(range.start.row, range.end.row)
  const minCol = Math.min(range.start.col, range.end.col)
  const maxCol = Math.max(range.start.col, range.end.col)
  return (
    cell.row >= minRow &&
    cell.row <= maxRow &&
    cell.col >= minCol &&
    cell.col <= maxCol
  )
}