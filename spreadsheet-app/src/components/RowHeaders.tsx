import React, { useCallback, useState, useEffect } from 'react'

interface RowHeadersProps {
  rowHeights: Record<number, number>
  rowCount: number
  scrollTop: number
  onRowResize: (row: number, height: number) => void
  onContextMenu: (e: React.MouseEvent, row: number) => void
}

export const RowHeaders: React.FC<RowHeadersProps> = ({
  rowHeights,
  rowCount,
  scrollTop,
  onRowResize,
  onContextMenu,
}) => {
  const [resizingRow, setResizingRow] = useState<number | null>(null)
  const [startY, setStartY] = useState(0)
  const [startHeight, setStartHeight] = useState(0)

  const handleMouseDown = useCallback(
    (row: number, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizingRow(row)
      setStartY(e.clientY)
      setStartHeight(rowHeights[row] || 24)
    },
    [rowHeights]
  )

  useEffect(() => {
    if (resizingRow === null) return
    const handleMouseMove = (e: MouseEvent) => {
      const dy = e.clientY - startY
      const newHeight = Math.max(18, startHeight + dy)
      onRowResize(resizingRow, newHeight)
    }
    const handleMouseUp = () => {
      setResizingRow(null)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingRow, startY, startHeight, onRowResize])

  const rows = Array.from({ length: rowCount }, (_, i) => i)

  return (
    <div className="row-headers" style={{ overflow: 'hidden' }}>
      <div style={{ transform: `translateY(-${scrollTop}px)` }}>
        {rows.map((row) => {
          const height = rowHeights[row] || 24
          return (
            <div
              key={row}
              className="row-header"
              style={{ height }}
              onContextMenu={(e) => onContextMenu(e, row)}
            >
              <span>{row + 1}</span>
              <div
                className="resize-handle row-resize-handle"
                onMouseDown={(e) => handleMouseDown(row, e)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
