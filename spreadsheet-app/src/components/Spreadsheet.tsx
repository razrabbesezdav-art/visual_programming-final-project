import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useSpreadsheetData } from '@/hooks/useSpreadsheetData'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useContextMenu } from '@/hooks/useContextMenu'
import { documentsApi } from '@/api/documents'
import { Grid } from '@/components/Grid'
import { FormulaBar } from '@/components/FormulaBar'
import { ColumnHeaders } from '@/components/ColumnHeaders'
import { RowHeaders } from '@/components/RowHeaders'
import { ContextMenu } from '@/components/ContextMenu'
import { SaveIndicator } from '@/components/Spreadsheet/SaveIndicator'
import { Position, CellRange } from '@/types'
import { toCellId } from '@/utils/cellUtils'

interface SpreadsheetProps {
  documentId: string | null
  onBack: () => void
}

export const Spreadsheet: React.FC<SpreadsheetProps> = ({
  documentId,
  onBack,
}) => {
  const {
    store,
    updateCell,
    loadDocument,
    setColumnWidth,
    setRowHeight,
    addRowAbove,
    addRowBelow,
    deleteRow,
    addColLeft,
    addColRight,
    deleteCol,
  } = useSpreadsheetData()

  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [selectedRange, setSelectedRange] = useState<CellRange | null>(null)
  const [editingCell, setEditingCell] = useState<Position | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [documentName, setDocumentName] = useState('')

  const { saveStatus, scheduleSave, manualSave } = useAutoSave(
    documentId,
    store
  )

  const {
    menu: contextMenu,
    closeContextMenu,
    handleColumnContextMenu,
    handleRowContextMenu,
  } = useContextMenu()

  const formulaBarRef = useRef<HTMLInputElement>(null)

  // Загрузка документа при открытии
  useEffect(() => {
    if (documentId) {
      loadDocumentFromApi(documentId)
    }
  }, [documentId])

  const loadDocumentFromApi = async (id: string) => {
    try {
      const doc = await documentsApi.get(id)
      if (doc) {
        setDocumentName(doc.name)
        loadDocument({
          cells: doc.cells,
          columnWidths: doc.columnWidths,
          rowHeights: doc.rowHeights,
          rowCount: doc.rowCount,
          colCount: doc.colCount,
        })
      }
    } catch (error) {
      console.error('Failed to load document:', error)
    }
  }

  const handleCellMouseDown = useCallback(
    (pos: Position, e: React.MouseEvent) => {
      setEditingCell(null)
      if (e.shiftKey && selectedCell) {
        setSelectedRange({ start: selectedCell, end: pos })
      } else {
        setSelectedCell(pos)
        setSelectedRange(null)
      }
    },
    [selectedCell]
  )

  const handleCellDoubleClick = useCallback((pos: Position) => {
    setEditingCell(pos)
  }, [])

  const handleCellCommit = useCallback(
    (pos: Position, value: string) => {
      updateCell(pos, value)
      setEditingCell(null)
      scheduleSave()
    },
    [updateCell, scheduleSave]
  )

  const handleFormulaChange = useCallback(
    (value: string) => {
      if (selectedCell) {
        updateCell(selectedCell, value)
        scheduleSave()
      }
    },
    [selectedCell, updateCell, scheduleSave]
  )

  const activeCellData = selectedCell
    ? store.cells[toCellId(selectedCell.row, selectedCell.col)]
    : null

  const totalWidth = Object.values(store.columnWidths)
    .slice(0, store.colCount)
    .reduce((sum, w) => sum + w, 0)

  const handleScroll = useCallback((top: number, left: number) => {
    setScrollTop(top)
    setScrollLeft(left)
  }, [])

  return (
    <div className="spreadsheet">
      <div className="spreadsheet-header">
        <button onClick={onBack} className="btn-back">
          ← Назад
        </button>
        <span className="document-title">{documentName}</span>
        <FormulaBar
          ref={formulaBarRef}
          value={activeCellData?.rawValue || ''}
          onChange={handleFormulaChange}
        />
        <SaveIndicator status={saveStatus} />
        <button onClick={manualSave} title="Сохранить (Ctrl+S)">
          💾
        </button>
      </div>

      <div className="spreadsheet-body">
        <div className="corner-placeholder" />
        <ColumnHeaders
          columnWidths={store.columnWidths}
          colCount={store.colCount}
          totalWidth={totalWidth}
          scrollLeft={scrollLeft}
          onColumnResize={setColumnWidth}
          onContextMenu={handleColumnContextMenu}
        />
        <RowHeaders
          rowHeights={store.rowHeights}
          rowCount={store.rowCount}
          scrollTop={scrollTop}
          onRowResize={setRowHeight}
          onContextMenu={handleRowContextMenu}
        />
        <div className="grid-wrapper">
          <Grid
            store={store}
            selectedCell={selectedCell}
            selectedRange={selectedRange}
            editingCell={editingCell}
            onCellCommit={handleCellCommit}
            onCellDoubleClick={handleCellDoubleClick}
            onCellMouseDown={handleCellMouseDown}
            onScroll={handleScroll}
          />
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          index={contextMenu.index}
          onClose={closeContextMenu}
          onAddRowAbove={() => addRowAbove(contextMenu.index)}
          onAddRowBelow={() => addRowBelow(contextMenu.index)}
          onDeleteRow={() => deleteRow(contextMenu.index)}
          onAddColumnLeft={() => addColLeft(contextMenu.index)}
          onAddColumnRight={() => addColRight(contextMenu.index)}
          onDeleteColumn={() => deleteCol(contextMenu.index)}
        />
      )}
    </div>
  )
}
