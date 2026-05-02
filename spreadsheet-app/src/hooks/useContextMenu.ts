import { useState, useCallback } from 'react'

interface ContextMenuState {
  x: number
  y: number
  type: 'row' | 'col'
  index: number
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const openContextMenu = useCallback(
    (x: number, y: number, type: 'row' | 'col', index: number) => {
      setMenu({ x, y, type, index })
    },
    []
  )

  const closeContextMenu = useCallback(() => {
    setMenu(null)
  }, [])

  const handleColumnContextMenu = useCallback(
    (e: React.MouseEvent, col: number) => {
      e.preventDefault()
      openContextMenu(e.clientX, e.clientY, 'col', col)
    },
    [openContextMenu]
  )

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, row: number) => {
      e.preventDefault()
      openContextMenu(e.clientX, e.clientY, 'row', row)
    },
    [openContextMenu]
  )

  return {
    menu,
    openContextMenu,
    closeContextMenu,
    handleColumnContextMenu,
    handleRowContextMenu,
  }
}