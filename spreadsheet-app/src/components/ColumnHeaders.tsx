import React, { useCallback, useState, useEffect } from 'react'
import { toColumnLetter } from '@/utils/cellUtils'

interface ColumnHeadersProps {
  columnWidths: Record<number, number>
  colCount: number
  totalWidth: number
  scrollLeft: number
  onColumnResize: (col: number, width: number) => void
  onContextMenu: (e: React.MouseEvent, col: number) => void
}

export const ColumnHeaders: React.FC<ColumnHeadersProps> = ({
  columnWidths,
  colCount,
  totalWidth,
  scrollLeft,
  onColumnResize,
  onContextMenu,
}) => {
  const [resizingCol, setResizingCol] = useState<number | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const handleMouseDown = useCallback(
    (col: number, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizingCol(col)
      setStartX(e.clientX)
      setStartWidth(columnWidths[col] || 100)
    },
    [columnWidths]
  )

  useEffect(() => {
    if (resizingCol === null) return
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const newWidth = Math.max(30, startWidth + dx)
      onColumnResize(resizingCol, newWidth)
    }
    const handleMouseUp = () => {
      setResizingCol(null)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingCol, startX, startWidth, onColumnResize])

  const cols = Array.from({ length: colCount }, (_, i) => i)

  return (
    <div className="column-headers">
      <div
        style={{
          display: 'flex',
          width: totalWidth,
          transform: `translateX(-${scrollLeft}px)`,
        }}
      >
        {cols.map((col) => {
          const width = columnWidths[col] || 100
          const letter = toColumnLetter(col)
          return (
            <div
              key={col}
              className="column-header"
              style={{ width }}
              onContextMenu={(e) => onContextMenu(e, col)}
            >
              <span>{letter}</span>
              <div
                className="resize-handle"
                onMouseDown={(e) => handleMouseDown(col, e)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}