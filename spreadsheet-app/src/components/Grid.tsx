import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { Cell } from './Cell'
import { toCellId, isInRange } from '@/utils/cellUtils'
import { SpreadsheetStore, Position, CellRange } from '@/types'
import { CellData, CellStyle } from '@/types'

interface GridProps {
  store: SpreadsheetStore
  selectedCell: Position | null
  selectedRange: CellRange | null
  editingCell: Position | null
  onCellCommit: (pos: Position, value: string) => void
  onCellDoubleClick: (pos: Position) => void
  onCellMouseDown: (pos: Position, e: React.MouseEvent) => void
  onScroll: (scrollTop: number, scrollLeft: number) => void
}

export const Grid: React.FC<GridProps> = ({
  store,
  selectedCell,
  selectedRange,
  editingCell,
  onCellCommit,
  onCellDoubleClick,
  onCellMouseDown,
  onScroll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)
  const [viewportWidth, setViewportWidth] = useState(800)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setViewportHeight(height)
      setViewportWidth(width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const totalWidth = useMemo(() => {
    let total = 0
    for (let c = 0; c < store.colCount; c++) {
      total += store.columnWidths[c] || 100
    }
    return total
  }, [store.columnWidths, store.colCount])

  const totalHeight = useMemo(() => {
    let total = 0
    for (let r = 0; r < store.rowCount; r++) {
      total += store.rowHeights[r] || 24
    }
    return total
  }, [store.rowHeights, store.rowCount])

  const visibleRows = useMemo(() => {
    const rows: number[] = []
    let top = 0
    for (let r = 0; r < store.rowCount; r++) {
      const h = store.rowHeights[r] || 24
      const bottom = top + h
      if (bottom > scrollTop && top < scrollTop + viewportHeight) {
        rows.push(r)
      }
      top += h
    }
    return rows
  }, [store.rowHeights, store.rowCount, scrollTop, viewportHeight])

  const visibleCols = useMemo(() => {
    const cols: number[] = []
    let left = 0
    for (let c = 0; c < store.colCount; c++) {
      const w = store.columnWidths[c] || 100
      const right = left + w
      if (right > scrollLeft && left < scrollLeft + viewportWidth) {
        cols.push(c)
      }
      left += w
    }
    return cols
  }, [store.columnWidths, store.colCount, scrollLeft, viewportWidth])

  const getCellStyle = useCallback(
    (row: number, col: number): React.CSSProperties => {
      let top = 0
      for (let r = 0; r < row; r++) {
        top += store.rowHeights[r] || 24
      }
      let left = 0
      for (let c = 0; c < col; c++) {
        left += store.columnWidths[c] || 100
      }
      return {
        position: 'absolute',
        top,
        left,
        width: store.columnWidths[col] || 100,
        height: store.rowHeights[row] || 24,
      }
    },
    [store.columnWidths, store.rowHeights]
  )

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (el) {
      const top = el.scrollTop
      const left = el.scrollLeft
      setScrollTop(top)
      setScrollLeft(left)
      onScroll(top, left)
    }
  }, [onScroll])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && selectedCell && !editingCell) {
        e.preventDefault()
        onCellDoubleClick(selectedCell)
      }
    },
    [selectedCell, editingCell, onCellDoubleClick]
  )

  // Форматирование значения для отображения с учётом стилей
  const getFormattedValue = useCallback(
    (
      cellData: CellData | undefined,
      cellStyle: CellStyle | undefined,
      rawValue: string
    ): string => {
      if (!rawValue) return ''

      if (cellStyle?.numberFormat && cellStyle.numberFormat !== 'number') {
        const num = parseFloat(rawValue)
        if (!isNaN(num)) {
          switch (cellStyle.numberFormat) {
            case 'percent':
              return `${(num * 100).toFixed(2)}%`
            case 'currency':
              return `$${num.toFixed(2)}`
            case 'date':
              return new Date(num).toLocaleDateString()
            default:
              return rawValue
          }
        }
      }
      return cellData?.displayValue || rawValue || ''
    },
    []
  )

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        outline: 'none',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{ width: totalWidth, height: totalHeight, position: 'relative' }}
      >
        {visibleRows.map((row) =>
          visibleCols.map((col) => {
            const id = toCellId(row, col)
            const cellData = store.cells[id]
            const cellStyle = cellData?.style
            const formattedValue = getFormattedValue(
              cellData,
              cellStyle,
              cellData?.rawValue || ''
            )
            const isSelected =
              selectedCell?.row === row && selectedCell?.col === col
            const isEditing =
              editingCell?.row === row && editingCell?.col === col
            const isInRangeCell = selectedRange
              ? isInRange({ row, col }, selectedRange)
              : false

            return (
              <div key={id} style={getCellStyle(row, col)}>
                <Cell
                  value={formattedValue}
                  isSelected={!!isSelected}
                  isInRange={!!isInRangeCell}
                  isEditing={!!isEditing}
                  onCommit={(val) => onCellCommit({ row, col }, val)}
                  onDoubleClick={() => onCellDoubleClick({ row, col })}
                  onMouseDown={(e) => onCellMouseDown({ row, col }, e)}
                  width={store.columnWidths[col] || 100}
                  height={store.rowHeights[row] || 24}
                  style={cellStyle}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
