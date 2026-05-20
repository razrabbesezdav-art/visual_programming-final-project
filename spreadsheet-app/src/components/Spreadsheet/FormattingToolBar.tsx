import React, { useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateCellStyle } from '@/store/slices/spreadsheetSlice'
import { Position, CellStyle } from '@/types'
import { toCellId } from '@/utils/cellUtils'
import { getSelectedPositions } from '@/utils/selectionUtils'
import './FormattingToolbar.css'

const COLOR_PALETTE = [
  { name: 'Белый', value: '#ffffff' },
  { name: 'Чёрный', value: '#000000' },
  { name: 'Синий', value: '#2196f3' },
  { name: 'Красный', value: '#f44336' },
  { name: 'Зелёный', value: '#4caf50' },
]

const TEXT_COLORS = [
  { name: 'Чёрный', value: '#000000' },
  { name: 'Белый', value: '#ffffff' },
  { name: 'Синий', value: '#2196f3' },
  { name: 'Красный', value: '#f44336' },
  { name: 'Зелёный', value: '#4caf50' },
]

export const FormattingToolbar: React.FC = () => {
  const dispatch = useAppDispatch()
  const { selectedCell, selectedRange, cells } = useAppSelector(
    (state) => state.spreadsheet
  )

  const getCurrentStyle = useCallback((): Partial<CellStyle> => {
    const positions = getSelectedPositions(selectedCell, selectedRange)
    if (positions.length === 0) return {}
    const firstPos = positions[0]
    const cellId = toCellId(firstPos.row, firstPos.col)
    const firstCell = cells[cellId]

    return firstCell?.style || {}
  }, [selectedCell, selectedRange, cells])

  const applyStyle = useCallback(
    (style: Partial<CellStyle>) => {
      const positions = getSelectedPositions(selectedCell, selectedRange)
      if (positions.length === 0) return

      dispatch(updateCellStyle({ positions, style }))
    },
    [dispatch, selectedCell, selectedRange]
  )

  const currentStyle = getCurrentStyle()

  return (
    <div className="formatting-toolbar">
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${currentStyle.bold ? 'active' : ''}`}
          onClick={() => applyStyle({ bold: !currentStyle.bold })}
          title="Жирный (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          className={`toolbar-btn ${currentStyle.italic ? 'active' : ''}`}
          onClick={() => applyStyle({ italic: !currentStyle.italic })}
          title="Курсив (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          className={`toolbar-btn ${currentStyle.underline ? 'active' : ''}`}
          onClick={() => applyStyle({ underline: !currentStyle.underline })}
          title="Подчёркнутый (Ctrl+U)"
        >
          <u>U</u>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <select
          className="toolbar-select"
          value={currentStyle.textAlign || 'left'}
          onChange={(e) =>
            applyStyle({
              textAlign: e.target.value as 'left' | 'center' | 'right',
            })
          }
          title="Выравнивание"
        >
          <option value="left">По левому краю</option>
          <option value="center">По центру</option>
          <option value="right">По правому краю</option>
        </select>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="color-picker-group" title="Цвет фона">
          <span className="color-label">Фон:</span>
          <div className="color-palette">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color.value}
                className={`color-btn ${currentStyle.backgroundColor === color.value ? 'active' : ''}`}
                style={{
                  backgroundColor: color.value,
                  border: color.value === '#ffffff' ? '1px solid #ccc' : 'none',
                }}
                onClick={() => applyStyle({ backgroundColor: color.value })}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="toolbar-group">
        <div className="color-picker-group" title="Цвет текста">
          <span className="color-label">Текст:</span>
          <div className="color-palette">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value}
                className={`color-btn ${currentStyle.textColor === color.value ? 'active' : ''}`}
                style={{
                  backgroundColor: color.value,
                  border: color.value === '#ffffff' ? '1px solid #ccc' : 'none',
                }}
                onClick={() => applyStyle({ textColor: color.value })}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <select
          className="toolbar-select"
          value={currentStyle.numberFormat || 'number'}
          onChange={(e) => applyStyle({ numberFormat: e.target.value as any })}
          title="Числовой формат"
        >
          <option value="number">Обычное число</option>
          <option value="percent">Процент</option>
          <option value="currency">Валюта</option>
          <option value="date">Дата</option>
        </select>
      </div>
    </div>
  )
}
