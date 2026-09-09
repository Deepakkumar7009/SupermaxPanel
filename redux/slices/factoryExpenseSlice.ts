import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FactoryExpense } from "../types/factoryExpense";
import {
  createFactoryExpense,
  fetchFactoryExpenses,
  updateFactoryExpense,
} from "../thunks/factoryExpenseThunks";

interface FactoryExpenseState {
  expenses: FactoryExpense[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  totalPendingAmount: number;
  totalPayedAmount: number;
  totalMonthAmount: number;
}

const initialState: FactoryExpenseState = {
  expenses: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  totalPendingAmount: 0,
  totalPayedAmount: 0,
  totalMonthAmount: 0,
};

const factoryExpenseSlice = createSlice({
  name: "factoryExpense",
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    /* ================= FETCH EXPENSES ================= */
    builder.addCase(fetchFactoryExpenses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(
      fetchFactoryExpenses.fulfilled,
      (
        state,
        action: PayloadAction<{
          success: boolean;
          expenses: FactoryExpense[];
          total: number;
          page: number;
          limit: number;
          totalPendingAmount?: number;
          totalPayedAmount?: number;
          totalMonthAmount?: number;
        }>,
      ) => {
        state.loading = false;
        state.expenses = action.payload.expenses ?? [];
        state.total = action.payload.total ?? 0;
        state.page = action.payload.page ?? 1;
        // Do NOT overwrite limit — list pages manage their own limit via setLimit()
        state.totalPendingAmount = action.payload.totalPendingAmount ?? 0;
        state.totalPayedAmount = action.payload.totalPayedAmount ?? 0;
        state.totalMonthAmount = action.payload.totalMonthAmount ?? 0;
      },
    );

    builder.addCase(fetchFactoryExpenses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* ================= CREATE ================= */
    builder.addCase(createFactoryExpense.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(
      createFactoryExpense.fulfilled,
      (
        state,
        action: PayloadAction<{ success: boolean; expense: FactoryExpense }>,
      ) => {
        state.loading = false;
        state.expenses.unshift(action.payload.expense);
        state.total += 1;

        if (action.payload.expense.status === "pending") {
          state.totalPendingAmount += action.payload.expense.amount;
        } else if (action.payload.expense.status === "paid") {
          state.totalPayedAmount += action.payload.expense.amount;
        }
        state.totalMonthAmount += action.payload.expense.amount;
      },
    );

    builder.addCase(createFactoryExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* ================= UPDATE ================= */
    builder.addCase(updateFactoryExpense.fulfilled, (state, action) => {
      const updated = action.payload;
      const index = state.expenses.findIndex((e) => e._id === updated._id);

      if (index !== -1) {
        const old = state.expenses[index];

        if (old.status === "pending") {
          state.totalPendingAmount -= old.amount;
        } else {
          state.totalPayedAmount -= old.amount;
        }
        state.totalMonthAmount -= old.amount;

        state.expenses[index] = updated;

        if (updated.status === "pending") {
          state.totalPendingAmount += updated.amount;
        } else {
          state.totalPayedAmount += updated.amount;
        }
        state.totalMonthAmount += updated.amount;
      }
    });
  },
});

export const { setPage, setLimit } = factoryExpenseSlice.actions;
export default factoryExpenseSlice.reducer;
