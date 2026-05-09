import React, { useState, useRef, useEffect, useCallback, memo } from 'react'

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

export const Cell: React.FC<CellProps> = memo(
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
    const [isLocalEditing, setIsLocalEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (isEditing) {
        setEditValue(value)
        setIsLocalEditing(true)
      } else {
        setIsLocalEditing(false)
      }
    }, [isEditing, value])

    useEffect(() => {
      if (isLocalEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [isLocalEditing])

    // Обновляем значение только если не в режиме редактирования
    useEffect(() => {
      if (!isLocalEditing) {
        setEditValue(value)
      }
    }, [value, isLocalEditing])

    const handleBlur = useCallback(() => {
      if (isLocalEditing) {
        onCommit(editValue)
        setIsLocalEditing(false)
      }
    }, [editValue, isLocalEditing, onCommit])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onCommit(editValue)
        setIsLocalEditing(false)
      }
      if (e.key === 'Escape') {
        setEditValue(value)
        onCommit(value)
        setIsLocalEditing(false)
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        onCommit(editValue)
        setIsLocalEditing(false)
      }
    }

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
        className="cell"
        style={cellStyle}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      >
        {isLocalEditing ? (
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isInRange === nextProps.isInRange &&
      prevProps.isEditing === nextProps.isEditing &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height
    )
  }
)
