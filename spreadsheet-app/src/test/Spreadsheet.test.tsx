import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Spreadsheet } from '@/components/Spreadsheet'

describe('Spreadsheet', () => {
  it('renders the formula bar and column headers', () => {
    render(<Spreadsheet />)
    // Панель формул должна содержать "fx"
    expect(screen.getByText('fx')).toBeInTheDocument()
    // Первый заголовок столбца – "A"
    expect(screen.getByText('A')).toBeInTheDocument()
    // Второй заголовок – "B"
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('selects a cell on click', async () => {
    render(<Spreadsheet />)
    const cells = document.querySelectorAll('.cell')
    expect(cells.length).toBeGreaterThan(0)
    const firstCell = cells[0] as HTMLElement
    fireEvent.mouseDown(firstCell)
    await waitFor(() => {
      expect(firstCell).toHaveClass('cell--selected')
    })
  })
})
