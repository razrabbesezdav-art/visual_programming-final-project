import { describe, it, expect, vi, beforeEach } from 'vitest'
import documentsReducer, {
  fetchDocuments,
  createDocument,
  renameDocument,
  deleteDocument,
  duplicateDocument,
  setActiveDocument,
} from '@/store/slices/documentsSlice'
import { documentsApi } from '@/api/documents'

// Мокаем API
vi.mock('@/api/documents', () => ({
  documentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
  },
}))

describe('documentsSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const initialState = {
    list: [],
    loading: false,
    error: null,
    activeDocumentId: null,
  }

  it('should set active document', () => {
    const state = documentsReducer(initialState, setActiveDocument('abc'))
    expect(state.activeDocumentId).toBe('abc')
  })

  it('should handle fetchDocuments pending', () => {
    const state = documentsReducer(initialState, {
      type: fetchDocuments.pending.type,
    })
    expect(state.loading).toBe(true)
  })

  it('should handle fetchDocuments fulfilled', () => {
    const previews = [
      {
        id: '1',
        name: 'Doc1',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        preview: [['Hello']],
      },
    ]
    const state = documentsReducer(initialState, {
      type: fetchDocuments.fulfilled.type,
      payload: previews,
    })
    expect(state.list).toEqual(previews)
    expect(state.loading).toBe(false)
  })

  it('should handle fetchDocuments rejected', () => {
    const error = new Error('Network error')
    const state = documentsReducer(initialState, {
      type: fetchDocuments.rejected.type,
      error: { message: error.message },
    })
    expect(state.loading).toBe(false)
    expect(state.error).toBe(error.message)
  })

  it('should handle createDocument fulfilled', async () => {
    const doc = {
      id: 'new1',
      name: 'New Doc',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      rowCount: 10,
      colCount: 5,
      cells: {},
      columnWidths: {},
      rowHeights: {},
    }
    const previews = [
      {
        id: '1',
        name: 'Old',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        preview: [],
      },
      {
        id: 'new1',
        name: 'New Doc',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        preview: [],
      },
    ]
    ;(documentsApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(doc)
    ;(documentsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue(previews)

    const state = documentsReducer(initialState, {
      type: createDocument.fulfilled.type,
      payload: { doc, previews },
    })
    expect(state.list).toEqual(previews)
  })

  it('should handle renameDocument fulfilled', async () => {
    const previews = [
      {
        id: '1',
        name: 'Renamed',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        preview: [],
      },
    ]
    const state = documentsReducer(
      {
        ...initialState,
        list: [
          {
            id: '1',
            name: 'Old',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
            preview: [],
          },
        ],
      },
      {
        type: renameDocument.fulfilled.type,
        payload: previews,
      }
    )
    expect(state.list).toEqual(previews)
  })

  it('should handle deleteDocument fulfilled', () => {
    const previews: any[] = []
    const state = documentsReducer(
      {
        ...initialState,
        list: [
          {
            id: '1',
            name: 'ToDelete',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
            preview: [],
          },
        ],
      },
      {
        type: deleteDocument.fulfilled.type,
        payload: previews,
      }
    )
    expect(state.list).toEqual(previews)
  })

  it('should handle duplicateDocument fulfilled', () => {
    const previews = [
      {
        id: '1',
        name: 'Original',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        preview: [],
      },
      {
        id: '2',
        name: 'Copy',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        preview: [],
      },
    ]
    const state = documentsReducer(
      {
        ...initialState,
        list: [
          {
            id: '1',
            name: 'Original',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
            preview: [],
          },
        ],
      },
      {
        type: duplicateDocument.fulfilled.type,
        payload: previews,
      }
    )
    expect(state.list).toEqual(previews)
  })
})
