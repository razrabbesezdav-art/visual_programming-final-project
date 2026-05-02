import React, { useState, useRef, useEffect, useCallback } from 'react'

interface CellProps {
  value: string
  isSelected: boolean
  isInRange: boolean
  isEditing: boolean
  onCommit: (val: string) => void
  onDoubleClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
  width: number
  height: number
}

export const Cell: React.FC<CellProps> = React.memo(
  ({
    value,
    isSelected,
    isInRange,
    isEditing,
    onCommit,
    onDoubleClick,
    onMouseDown,
    width,
    height,
  }) => {
    const [editValue, setEditValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [isEditing])

    useEffect(() => {
      setEditValue(value)
    }, [value])

    const handleBlur = useCallback(() => {
      if (isEditing) {
        onCommit(editValue)
      }
    }, [editValue, isEditing, onCommit])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onCommit(editValue)
      }
      if (e.key === 'Escape') {
        setEditValue(value)
        onCommit(value)
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        onCommit(editValue)
      }
    }

    let className = 'cell'
    if (isSelected) className += ' cell--selected'
    else if (isInRange) className += ' cell--in-range'

    const cellStyle: React.CSSProperties = {
      width,
      height,
      border: '1px solid #e0e0e0',
      padding: '2px 4px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      boxSizing: 'border-box',
      backgroundColor: isSelected ? '#e3f2fd' : isInRange ? '#f0f8ff' : 'white',
      outline: isSelected ? '2px solid #1a73e8' : 'none',
      outlineOffset: '-2px',
    }

    return (
      <div
        className={className}
        style={cellStyle}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              font: 'inherit',
              padding: 0,
            }}
          />
        ) : (
          <span>{value}</span>
        )}
      </div>
    )
  }
)