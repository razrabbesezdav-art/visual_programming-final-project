import React, { useState, useCallback, useRef } from 'react'
import { useSpreadsheetData } from '@/hooks/useSpreadsheetData'
import { useContextMenu } from '@/hooks/useContextMenu'
import { Grid } from '@/components/Grid'
import { FormulaBar } from '@/components/FormulaBar'
import { ColumnHeaders } from '@/components/ColumnHeaders'
import { RowHeaders } from '@/components/RowHeaders'
import { ContextMenu } from '@/components/ContextMenu'
import { Position, CellRange } from '@/types'
import { toCellId } from '@/utils/cellUtils'

export const Spreadsheet: React.FC = () => {
  const {
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
  } = useSpreadsheetData()

  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [selectedRange, setSelectedRange] = useState<CellRange | null>(null)
  const [editingCell, setEditingCell] = useState<Position | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const {
    menu: contextMenu,
    closeContextMenu,
    handleColumnContextMenu,
    handleRowContextMenu,
  } = useContextMenu()

  const formulaBarRef = useRef<HTMLInputElement>(null)

  const handleCellMouseDown = useCallback(
    (pos: Position, e: React.MouseEvent) => {
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
    },
    [updateCell]
  )

  const handleFormulaChange = useCallback(
    (value: string) => {
      if (selectedCell) {
        updateCell(selectedCell, value)
      }
    },
    [selectedCell, updateCell]
  )

  const activeCellData = selectedCell
    ? store.cells[toCellId(selectedCell.row, selectedCell.col)]
    : null

  // Общая ширина всех столбцов
  const totalWidth = Object.values(store.columnWidths)
    .slice(0, store.colCount)
    .reduce((sum, w) => sum + w, 0)

  // Колбэк из Grid при скролле
  const handleScroll = useCallback((top: number, left: number) => {
    setScrollTop(top)
    setScrollLeft(left)
  }, [])

  return (
    <div className="spreadsheet">
      <FormulaBar
        ref={formulaBarRef}
        value={activeCellData?.rawValue || ''}
        onChange={handleFormulaChange}
      />
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
