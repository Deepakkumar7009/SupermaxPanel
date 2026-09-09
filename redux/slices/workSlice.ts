import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  WorkEntry,
  FetchWorkEntriesResponse,
  CreateWorkEntryResponse,
} from "../types/work";
import { createWorkEntry, fetchWorkEntries, updateWorkEntry, fetchAllTimeWorkTotal } from "../thunks/workThunk";

interface WorkState {
  entries: WorkEntry[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalWorkAmount: number;
  allTimeTotalWorkAmount: number;
}

const initialState: WorkState = {
  entries: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 5,
  totalWorkAmount: 0,
  allTimeTotalWorkAmount: 0,
};

const workSlice = createSlice({
  name: "work",
  initialState,
  reducers: {
    clearWorkEntries(state) {
      state.entries = [];
      state.total = 0;
      state.page = 1;
      state.allTimeTotalWorkAmount = 0;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    /* ================= FETCH WORK ENTRIES ================= */
    builder.addCase(fetchWorkEntries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(
      fetchWorkEntries.fulfilled,
      (state, action: PayloadAction<FetchWorkEntriesResponse>) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.total = action.payload.total ?? action.payload.entries.length;
        state.totalWorkAmount = action.payload.totalWorkAmount ?? 0;
      },
    );

    builder.addCase(fetchWorkEntries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* ================= CREATE WORK ENTRY ================= */
    builder.addCase(createWorkEntry.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(
      createWorkEntry.fulfilled,
      (state, action: PayloadAction<CreateWorkEntryResponse>) => {
        state.loading = false;
        state.entries.unshift(action.payload.entry);
        state.total += 1;
      },
    );

    builder.addCase(createWorkEntry.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* ================= UPDATE WORK ENTRY ================= */
    builder.addCase(updateWorkEntry.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(updateWorkEntry.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.entries.findIndex((e) => e._id === action.payload.entry._id);
      if (idx !== -1) state.entries[idx] = action.payload.entry;
    });

    builder.addCase(updateWorkEntry.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* ================= ALL-TIME WORK TOTAL ================= */
    builder.addCase(
      fetchAllTimeWorkTotal.fulfilled,
      (state, action: PayloadAction<{ totalWorkAmount: number }>) => {
        state.allTimeTotalWorkAmount = action.payload.totalWorkAmount;
      },
    );
  },
});

export const { clearWorkEntries, setPage, setLimit } = workSlice.actions;
export default workSlice.reducer;
