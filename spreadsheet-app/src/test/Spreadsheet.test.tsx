import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Spreadsheet } from '@/components/Spreadsheet'

describe('Spreadsheet', () => {
  it('renders the formula bar and column headers', () => {
    render(<Spreadsheet documentId={null} onBack={() => {}} />)
    expect(screen.getByText('fx')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
