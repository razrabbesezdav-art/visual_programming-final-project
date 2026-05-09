import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { documentsApi } from '@/api/documents'
import { DocumentPreview } from '@/types/documents'

interface DocumentsState {
  list: DocumentPreview[]
  loading: boolean
  error: string | null
  activeDocumentId: string | null
}

const initialState: DocumentsState = {
  list: [],
  loading: false,
  error: null,
  activeDocumentId: null,
}

export const fetchDocuments = createAsyncThunk(
  'documents/fetchList',
  async () => {
    return await documentsApi.list()
  }
)

export const createDocument = createAsyncThunk(
  'documents/create',
  async (data: { name: string; rowCount: number; colCount: number }) => {
    const doc = await documentsApi.create(data)
    const previews = await documentsApi.list()
    return { doc, previews }
  }
)

export const renameDocument = createAsyncThunk(
  'documents/rename',
  async ({ id, name }: { id: string; name: string }) => {
    await documentsApi.update(id, { name })
    return await documentsApi.list()
  }
)

export const deleteDocument = createAsyncThunk(
  'documents/delete',
  async (id: string) => {
    await documentsApi.delete(id)
    return await documentsApi.list()
  }
)

export const duplicateDocument = createAsyncThunk(
  'documents/duplicate',
  async ({ id, newName }: { id: string; newName: string }) => {
    await documentsApi.duplicate(id, newName)
    return await documentsApi.list()
  }
)

export const exportDocumentCSV = createAsyncThunk(
  'documents/exportCSV',
  async (id: string, { rejectWithValue }) => {
    try {
      const { content, filename } = await documentsApi.export(id, 'csv')
      return { content, filename, format: 'csv' }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Export failed'
      )
    }
  }
)

export const exportDocumentJSON = createAsyncThunk(
  'documents/exportJSON',
  async (id: string, { rejectWithValue }) => {
    try {
      const { content, filename } = await documentsApi.export(id, 'json')
      return { content, filename, format: 'json' }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Export failed'
      )
    }
  }
)

export const importDocument = createAsyncThunk(
  'documents/import',
  async (data: { csvContent: string; name: string }) => {
    const { cells, rowCount, colCount } = parseCSV(data.csvContent)
    const doc = await documentsApi.create({
      name: data.name,
      rowCount: Math.max(rowCount, 100),
      colCount: Math.max(colCount, 26),
    })
    await documentsApi.update(doc.id, { cells })
    const previews = await documentsApi.list()
    return { doc, previews }
  }
)

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setActiveDocument(state, action) {
      state.activeDocumentId = action.payload
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDocuments
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.list = action.payload
        state.loading = false
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load documents'
      })
      // createDocument
      .addCase(createDocument.fulfilled, (state, action) => {
        state.list = action.payload.previews
      })
      // renameDocument
      .addCase(renameDocument.fulfilled, (state, action) => {
        state.list = action.payload
      })
      // deleteDocument
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.list = action.payload
      })
      // duplicateDocument
      .addCase(duplicateDocument.fulfilled, (state, action) => {
        state.list = action.payload
      })
  },
})

export const { setActiveDocument, clearError } = documentsSlice.actions
export default documentsSlice.reducer

function parseCSV(csvContent: string): {
  cells: any
  rowCount: any
  colCount: any
} {
  throw new Error('Function not implemented.')
}
