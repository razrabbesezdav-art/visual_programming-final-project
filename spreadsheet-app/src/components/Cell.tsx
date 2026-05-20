import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { CellStyle } from '@/types'

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
  style?: CellStyle
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
    style: cellStyleProps,
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

    const getFormattedValue = (): string => {
      if (!value) return ''

      if (
        cellStyleProps?.numberFormat &&
        cellStyleProps.numberFormat !== 'number'
      ) {
        const num = parseFloat(value)
        if (!isNaN(num)) {
          switch (cellStyleProps.numberFormat) {
            case 'percent':
              return `${(num * 100).toFixed(2)}%`
            case 'currency':
              return `$${num.toFixed(2)}`
            case 'date':
              return new Date(num).toLocaleDateString()
            default:
              return value
          }
        }
      }
      return value
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
      backgroundColor: isSelected
        ? '#e3f2fd'
        : isInRange
          ? '#f0f8ff'
          : cellStyleProps?.backgroundColor || 'white',
      color: cellStyleProps?.textColor || 'black',
      fontWeight: cellStyleProps?.bold ? 'bold' : 'normal',
      fontStyle: cellStyleProps?.italic ? 'italic' : 'normal',
      textDecoration: cellStyleProps?.underline ? 'underline' : 'none',
      textAlign: cellStyleProps?.textAlign || 'left',
      outline: isSelected ? '2px solid #1a73e8' : 'none',
      outlineOffset: '-2px',
    }

    const displayValue = getFormattedValue()

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
          <span>{displayValue}</span>
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
      prevProps.height === nextProps.height &&
      prevProps.style?.bold === nextProps.style?.bold &&
      prevProps.style?.italic === nextProps.style?.italic &&
      prevProps.style?.underline === nextProps.style?.underline &&
      prevProps.style?.backgroundColor === nextProps.style?.backgroundColor &&
      prevProps.style?.textColor === nextProps.style?.textColor &&
      prevProps.style?.textAlign === nextProps.style?.textAlign &&
      prevProps.style?.numberFormat === nextProps.style?.numberFormat
    )
  }
)
