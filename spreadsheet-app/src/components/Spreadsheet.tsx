import React, { useEffect, useCallback, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  updateCell,
  loadDocument,
  setColumnWidth,
  setRowHeight,
  addRowAbove,
  addRowBelow,
  deleteRow,
  addColumnLeft,
  addColumnRight,
  deleteColumn,
  setSelectedCell,
  setSelectedRange,
  setEditingCell,
  setScrollTop,
  setScrollLeft,
  undo,
  redo,
  pushHistory,
  selectAll,
  clearCells,
  updateCellStyle,
} from '@/store/slices/spreadsheetSlice'
import { setActiveDocument } from '@/store/slices/documentsSlice'
import { setSaveStatus } from '@/store/slices/uiSlice'
import { documentsApi, downloadFile } from '@/api/documents'
import { useContextMenu } from '@/hooks/useContextMenu'
import { useClipboard } from '@/hooks/useClipboard'
import { Grid } from '@/components/Grid'
import { FormulaBar } from '@/components/FormulaBar'
import { ColumnHeaders } from '@/components/ColumnHeaders'
import { RowHeaders } from '@/components/RowHeaders'
import { ContextMenu } from '@/components/ContextMenu'
import { SaveIndicator } from '@/components/Spreadsheet/SaveIndicator'
import { FormattingToolbar } from '@/components/Spreadsheet/FormattingToolBar'
import { Position } from '@/types'
import { toCellId } from '@/utils/cellUtils'
import { getSelectedPositions } from '@/utils/selectionUtils'

interface SpreadsheetProps {
  documentId: string | null
  onBack: () => void
}

export const Spreadsheet: React.FC<SpreadsheetProps> = ({
  documentId,
  onBack,
}) => {
  const dispatch = useAppDispatch()
  const store = useAppSelector((state) => state.spreadsheet)
  const saveStatus = useAppSelector((state) => state.ui.saveStatus)
  const [documentName, setDocumentName] = React.useState('')
  const [showExportMenu, setShowExportMenu] = React.useState(false)

  const {
    menu: contextMenu,
    closeContextMenu,
    handleColumnContextMenu,
    handleRowContextMenu,
  } = useContextMenu()
  const { copy, cut, paste } = useClipboard()
  const formulaBarRef = useRef<HTMLInputElement>(null)

  // Загрузка документа
  useEffect(() => {
    if (!documentId) return
    const fetchDoc = async () => {
      try {
        const doc = await documentsApi.get(documentId)
        if (doc) {
          setDocumentName(doc.name)
          dispatch(
            loadDocument({
              cells: doc.cells,
              columnWidths: doc.columnWidths,
              rowHeights: doc.rowHeights,
              rowCount: doc.rowCount,
              colCount: doc.colCount,
            })
          )
          dispatch(setActiveDocument(documentId))
        }
      } catch (error) {
        console.error('Failed to load document:', error)
      }
    }
    fetchDoc()
  }, [documentId, dispatch])

  const handleManualSave = useCallback(() => {
    if (!documentId) return
    dispatch(setSaveStatus({ status: 'saving', lastSaved: new Date() }))
    documentsApi
      .update(documentId, {
        cells: store.cells,
        columnWidths: store.columnWidths,
        rowHeights: store.rowHeights,
      })
      .then(() => {
        dispatch(setSaveStatus({ status: 'saved', lastSaved: new Date() }))
      })
      .catch((err) => {
        dispatch(
          setSaveStatus({
            status: 'error',
            lastSaved: new Date(),
            error: err.message,
          })
        )
      })
  }, [dispatch, documentId, store])

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        const isCtrl = e.ctrlKey || e.metaKey
        if (
          !(
            isCtrl &&
            (e.key === 's' ||
              e.key === 'z' ||
              e.key === 'y' ||
              e.key === 'c' ||
              e.key === 'v' ||
              e.key === 'x' ||
              e.key === 'b' ||
              e.key === 'i' ||
              e.key === 'u')
          )
        ) {
          return
        }
      }

      const isCtrl = e.ctrlKey || e.metaKey

      // Ctrl+S - сохранить
      if (isCtrl && e.key === 's') {
        e.preventDefault()
        e.stopPropagation()
        handleManualSave()
      }
      // Ctrl+Z - Undo
      else if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        dispatch(undo())
      }
      // Ctrl+Y или Ctrl+Shift+Z - Redo
      else if (
        (isCtrl && e.key === 'y') ||
        (isCtrl && e.shiftKey && e.key === 'Z')
      ) {
        e.preventDefault()
        e.stopPropagation()
        dispatch(redo())
      }
      // Ctrl+C - копировать
      else if (isCtrl && e.key === 'c') {
        e.preventDefault()
        e.stopPropagation()
        copy()
      }
      // Ctrl+X - вырезать
      else if (isCtrl && e.key === 'x') {
        e.preventDefault()
        e.stopPropagation()
        cut()
      }
      // Ctrl+V - вставить
      else if (isCtrl && e.key === 'v') {
        e.preventDefault()
        e.stopPropagation()
        paste()
      }
      // Delete / Backspace - очистить (только если не в инпуте)
      else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        e.stopPropagation()
        const positions = getSelectedPositions(
          store.selectedCell,
          store.selectedRange
        )
        if (positions.length > 0) {
          dispatch(pushHistory())
          dispatch(clearCells(positions))
        }
      }
      // Ctrl+A - выделить всё
      else if (
        isCtrl &&
        e.key === 'a' &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        e.stopPropagation()
        dispatch(selectAll())
      }
      // Ctrl+B - жирный
      else if (isCtrl && e.key === 'b') {
        e.preventDefault()
        e.stopPropagation()
        const positions = getSelectedPositions(
          store.selectedCell,
          store.selectedRange
        )
        if (positions.length > 0) {
          const firstId = toCellId(positions[0].row, positions[0].col)
          const firstCell = store.cells[firstId]
          const isBold = firstCell?.style?.bold || false
          dispatch(updateCellStyle({ positions, style: { bold: !isBold } }))
        }
      }
      // Ctrl+I - курсив
      else if (isCtrl && e.key === 'i') {
        e.preventDefault()
        e.stopPropagation()
        const positions = getSelectedPositions(
          store.selectedCell,
          store.selectedRange
        )
        if (positions.length > 0) {
          const firstId = toCellId(positions[0].row, positions[0].col)
          const firstCell = store.cells[firstId]
          const isItalic = firstCell?.style?.italic || false
          dispatch(updateCellStyle({ positions, style: { italic: !isItalic } }))
        }
      }
      // Ctrl+U - подчёркивание
      else if (isCtrl && e.key === 'u') {
        e.preventDefault()
        e.stopPropagation()
        const positions = getSelectedPositions(
          store.selectedCell,
          store.selectedRange
        )
        if (positions.length > 0) {
          const firstId = toCellId(positions[0].row, positions[0].col)
          const firstCell = store.cells[firstId]
          const isUnderline = firstCell?.style?.underline || false
          dispatch(
            updateCellStyle({ positions, style: { underline: !isUnderline } })
          )
        }
      }
      // Tab - навигация вправо
      else if (
        e.key === 'Tab' &&
        !isCtrl &&
        !store.editingCell &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        e.stopPropagation()
        if (store.selectedCell) {
          const newCol = store.selectedCell.col + 1
          if (newCol < store.colCount) {
            dispatch(
              setSelectedCell({ row: store.selectedCell.row, col: newCol })
            )
          }
        }
      }
      // Enter - переход на следующую строку
      else if (
        e.key === 'Enter' &&
        !isCtrl &&
        !store.editingCell &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        e.stopPropagation()
        if (store.selectedCell) {
          const newRow = store.selectedCell.row + 1
          if (newRow < store.rowCount) {
            dispatch(
              setSelectedCell({ row: newRow, col: store.selectedCell.col })
            )
          }
        }
      }
      // Escape - отмена редактирования
      else if (e.key === 'Escape' && store.editingCell) {
        e.preventDefault()
        e.stopPropagation()
        dispatch(setEditingCell(null))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, store, handleManualSave, copy, cut, paste])

  // Экспорты
  const handleExportCSV = useCallback(async () => {
    if (!documentId) return
    try {
      const { content, filename } = await documentsApi.export(documentId, 'csv')
      downloadFile(content, filename, 'text/csv')
      setShowExportMenu(false)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [documentId])

  const handleExportJSON = useCallback(async () => {
    if (!documentId) return
    try {
      const { content, filename } = await documentsApi.export(
        documentId,
        'json'
      )
      downloadFile(content, filename, 'application/json')
      setShowExportMenu(false)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [documentId])

  // Обработчики ячеек
  const handleCellMouseDown = useCallback(
    (pos: Position, e: React.MouseEvent) => {
      dispatch(setEditingCell(null))
      if (e.shiftKey && store.selectedCell) {
        dispatch(setSelectedRange({ start: store.selectedCell, end: pos }))
      } else {
        dispatch(setSelectedCell(pos))
        dispatch(setSelectedRange(null))
      }
    },
    [dispatch, store.selectedCell]
  )

  const handleCellDoubleClick = useCallback(
    (pos: Position) => {
      dispatch(setEditingCell(pos))
    },
    [dispatch]
  )

  const handleCellCommit = useCallback(
    (pos: Position, value: string) => {
      dispatch(pushHistory())
      dispatch(updateCell({ position: pos, value }))
      dispatch(setEditingCell(null))
    },
    [dispatch]
  )

  const handleFormulaChange = useCallback(
    (value: string) => {
      if (store.selectedCell) {
        dispatch(pushHistory())
        dispatch(updateCell({ position: store.selectedCell, value }))
      }
    },
    [dispatch, store.selectedCell]
  )

  const activeCellData = store.selectedCell
    ? store.cells[toCellId(store.selectedCell.row, store.selectedCell.col)]
    : null

  const totalWidth = Object.values(store.columnWidths)
    .slice(0, store.colCount)
    .reduce((sum, w) => sum + w, 0)

  const handleScroll = useCallback(
    (top: number, left: number) => {
      dispatch(setScrollTop(top))
      dispatch(setScrollLeft(left))
    },
    [dispatch]
  )

  return (
    <div className="spreadsheet">
      <FormattingToolbar />

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
        <button
          onClick={handleManualSave}
          title="Сохранить (Ctrl+S)"
          className="btn-save"
        >
          Сохранить
        </button>
        <div className="export-dropdown">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-icon"
            title="Экспорт"
          ></button>
          {showExportMenu && (
            <div className="export-menu">
              <button onClick={handleExportCSV} className="export-menu-item">
                Экспорт в CSV
              </button>
              <button onClick={handleExportJSON} className="export-menu-item">
                Экспорт в JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="spreadsheet-body">
        <div className="corner-placeholder" />
        <ColumnHeaders
          columnWidths={store.columnWidths}
          colCount={store.colCount}
          totalWidth={totalWidth}
          scrollLeft={store.scrollLeft}
          onColumnResize={(col, width) =>
            dispatch(setColumnWidth({ col, width }))
          }
          onContextMenu={handleColumnContextMenu}
        />
        <RowHeaders
          rowHeights={store.rowHeights}
          rowCount={store.rowCount}
          scrollTop={store.scrollTop}
          onRowResize={(row, height) => dispatch(setRowHeight({ row, height }))}
          onContextMenu={handleRowContextMenu}
        />
        <div className="grid-wrapper">
          <Grid
            store={store}
            selectedCell={store.selectedCell}
            selectedRange={store.selectedRange}
            editingCell={store.editingCell}
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
          onAddRowAbove={() => dispatch(addRowAbove(contextMenu.index))}
          onAddRowBelow={() => dispatch(addRowBelow(contextMenu.index))}
          onDeleteRow={() => dispatch(deleteRow(contextMenu.index))}
          onAddColumnLeft={() => dispatch(addColumnLeft(contextMenu.index))}
          onAddColumnRight={() => dispatch(addColumnRight(contextMenu.index))}
          onDeleteColumn={() => dispatch(deleteColumn(contextMenu.index))}
        />
      )}
    </div>
  )
}
