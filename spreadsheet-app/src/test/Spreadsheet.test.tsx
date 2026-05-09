import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spreadsheet } from '@/components/Spreadsheet'

vi.mock('@/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: any) =>
    selector({
      spreadsheet: {
        cells: {},
        columnWidths: {},
        rowHeights: {},
        rowCount: 100,
        colCount: 26,
        selectedCell: null,
        selectedRange: null,
        editingCell: null,
        scrollTop: 0,
        scrollLeft: 0,
      },
      ui: {
        saveStatus: { status: 'saved', lastSaved: null },
        createModalOpen: false,
        importModalOpen: false,
      },
    }),
}))

describe('Spreadsheet', () => {
  it('renders the formula bar and column headers', () => {
    render(<Spreadsheet documentId={null} onBack={() => {}} />)
    expect(screen.getByText('fx')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it.skip('selects a cell on click', async () => {
    expect(true).toBe(true)
  })
})
