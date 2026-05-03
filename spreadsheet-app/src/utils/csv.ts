import { CellData, SpreadsheetStore } from '@/types'
import { toCellId } from './cellUtils'

export function exportToCSV(store: SpreadsheetStore): string {
  const lines: string[] = []

  for (let r = 0; r < store.rowCount; r++) {
    const line: string[] = []
    for (let c = 0; c < store.colCount; c++) {
      const cellId = toCellId(r, c)
      const cell = store.cells[cellId]
      const value = cell ? escapeCSVField(cell.displayValue || cell.rawValue || '') : ''
      line.push(value)
    }
    // Убираем пустые ячейки справа (оптимизация)
    while (line.length > 0 && line[line.length - 1] === '') {
      line.pop()
    }
    if (line.length > 0 || r < store.rowCount - 1) {
      lines.push(line.join(','))
    }
  }

  return lines.join('\n')
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

export interface CSVImportResult {
  cells: Record<string, CellData>
  rowCount: number
  colCount: number
}

export function importCSV(csvContent: string): CSVImportResult {
  const lines = parseCSVLines(csvContent)
  const cells: Record<string, CellData> = {}
  let maxCols = 0

  for (let r = 0; r < lines.length; r++) {
    const fields = lines[r]
    maxCols = Math.max(maxCols, fields.length)

    for (let c = 0; c < fields.length; c++) {
      const value = fields[c].trim()
      const isNumber = /^-?\d+(\.\d+)?$/.test(value)

      const cellId = toCellId(r, c)
      cells[cellId] = {
        rawValue: value,
        computedValue: isNumber ? Number(value) : null,
        displayValue: value,
        type: isNumber ? 'number' : 'string',
      }
    }
  }

  return {
    cells,
    rowCount: lines.length,
    colCount: Math.max(maxCols, 1),
  }
}

function parseCSVLines(csv: string): string[][] {
  const lines: string[][] = []
  let currentLine: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]
    const nextChar = csv[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"'
          i++ // Пропускаем следующую кавычку
        } else {
          inQuotes = false
        }
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentLine.push(currentField)
        currentField = ''
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++ // Пропускаем \n после \r
        }
        currentLine.push(currentField)
        lines.push(currentLine)
        currentLine = []
        currentField = ''
      } else {
        currentField += char
      }
    }
  }

  // Последнее поле/строка
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField)
    lines.push(currentLine)
  }

  return lines.filter(line => line.some(field => field !== ''))
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}