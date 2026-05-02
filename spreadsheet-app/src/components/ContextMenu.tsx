import React, { useEffect, useRef } from 'react'

interface ContextMenuProps {
  x: number
  y: number
  type: 'row' | 'col'
  index: number
  onClose: () => void
  onAddRowAbove: () => void
  onAddRowBelow: () => void
  onDeleteRow: () => void
  onAddColumnLeft: () => void
  onAddColumnRight: () => void
  onDeleteColumn: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  onClose,
  onAddRowAbove,
  onAddRowBelow,
  onDeleteRow,
  onAddColumnLeft,
  onAddColumnRight,
  onDeleteColumn,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const items =
    type === 'row'
      ? [
          { label: 'Добавить строку выше', action: onAddRowAbove },
          { label: 'Добавить строку ниже', action: onAddRowBelow },
          { label: 'Удалить строку', action: onDeleteRow },
        ]
      : [
          { label: 'Добавить столбец слева', action: onAddColumnLeft },
          { label: 'Добавить столбец справа', action: onAddColumnRight },
          { label: 'Удалить столбец', action: onDeleteColumn },
        ]

  return (
    <div ref={menuRef} className="context-menu" style={{ top: y, left: x }}>
      {items.map((item) => (
        <button
          key={item.label}
          className="context-menu-item"
          onClick={() => {
            item.action()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
