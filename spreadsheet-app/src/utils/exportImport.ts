import { SpreadsheetStore, CellData } from '@/types'
import { downloadFile } from './csv'

export function exportToJSON(store: SpreadsheetStore): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    spreadsheet: {
      rowCount: store.rowCount,
      colCount: store.colCount,
      columnWidths: store.columnWidths,
      rowHeights: store.rowHeights,
      cells: store.cells,
    },
  }
  return JSON.stringify(data, null, 2)
}

export function importFromJSON(jsonContent: string): SpreadsheetStore | null {
  try {
    const data = JSON.parse(jsonContent)
    
    if (!data.spreadsheet) {
      throw new Error('Invalid JSON format')
    }

    const { spreadsheet } = data

    // Валидация
    if (!spreadsheet.cells || !spreadsheet.rowCount || !spreadsheet.colCount) {
      throw new Error('Missing required fields')
    }

    return {
      cells: spreadsheet.cells,
      rowCount: spreadsheet.rowCount,
      colCount: spreadsheet.colCount,
      columnWidths: spreadsheet.columnWidths || {},
      rowHeights: spreadsheet.rowHeights || {},
    }
  } catch (error) {
    console.error('Import error:', error)
    return null
  }
}

export function downloadJSON(store: SpreadsheetStore) {
  const content = exportToJSON(store)
  const filename = `spreadsheet-${new Date().toISOString().split('T')[0]}.json`
  downloadFile(content, filename, 'application/json')
}

export function downloadCSV(store: SpreadsheetStore) {
  const { exportToCSV } = require('./csv')
  const content = exportToCSV(store)
  const filename = `spreadsheet-${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(content, filename, 'text/csv')
}