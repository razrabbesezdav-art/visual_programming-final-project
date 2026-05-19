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
} from '@/store/slices/spreadsheetSlice'
import { setActiveDocument } from '@/store/slices/documentsSlice'
import { setSaveStatus } from '@/store/slices/uiSlice'
import { documentsApi, downloadFile } from '@/api/documents'
import { useContextMenu } from '@/hooks/useContextMenu'
import { Grid } from '@/components/Grid'
import { FormulaBar } from '@/components/FormulaBar'
import { ColumnHeaders } from '@/components/ColumnHeaders'
import { RowHeaders } from '@/components/RowHeaders'
import { ContextMenu } from '@/components/ContextMenu'
import { SaveIndicator } from '@/components/Spreadsheet/SaveIndicator'
import { Position } from '@/types'
import { toCellId } from '@/utils/cellUtils'

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
  const hasUnsavedChanges = useAppSelector(
    (state) => state.ui.hasUnsavedChanges
  )
  const [documentName, setDocumentName] = React.useState('')
  const [showExportMenu, setShowExportMenu] = React.useState(false)

  const {
    menu: contextMenu,
    closeContextMenu,
    handleColumnContextMenu,
    handleRowContextMenu,
  } = useContextMenu()
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

  // Горячие клавиши: Undo/Redo, Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch(undo())
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        dispatch(redo())
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!documentId) return
        dispatch(setSaveStatus({ status: 'saving', lastSaved: new Date() }))
        const currentCells = store.cells
        const currentColWidths = store.columnWidths
        const currentRowHeights = store.rowHeights
        documentsApi
          .update(documentId, {
            cells: currentCells,
            columnWidths: currentColWidths,
            rowHeights: currentRowHeights,
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
      }
    }

    //предупреждение при несохранённых изменениях
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [dispatch, documentId, store, hasUnsavedChanges])

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
          onClick={() => {
            if (!documentId) return
            dispatch(setSaveStatus({ status: 'saving', lastSaved: new Date() }))
            documentsApi
              .update(documentId, {
                cells: store.cells,
                columnWidths: store.columnWidths,
                rowHeights: store.rowHeights,
              })
              .then(() =>
                dispatch(
                  setSaveStatus({ status: 'saved', lastSaved: new Date() })
                )
              )
              .catch((err) =>
                dispatch(
                  setSaveStatus({
                    status: 'error',
                    lastSaved: new Date(),
                    error: err.message,
                  })
                )
              )
          }}
          title="Сохранить (Ctrl+S)"
          className="btn-icon"
        >
          💾
        </button>
        <div className="export-dropdown">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-icon"
            title="Экспорт"
          >
            📥
          </button>
          {showExportMenu && (
            <div className="export-menu">
              <button onClick={handleExportCSV} className="export-menu-item">
                📊 Экспорт в CSV
              </button>
              <button onClick={handleExportJSON} className="export-menu-item">
                📋 Экспорт в JSON
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
