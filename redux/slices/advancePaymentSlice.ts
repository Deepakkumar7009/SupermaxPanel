import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AdvancePayment, FetchAdvancePaymentsResponse } from "../types/advancePayment";
import { fetchAdvancePayments, addAdvancePayment, fetchAllTimeTotals } from "../thunks/advancePaymentThunks";

interface AdvancePaymentState {
  payments: AdvancePayment[];
  total: number;
  page: number;
  limit: number;
  totalAdvance: number;
  totalSalaryPaid: number;
  balance: number;
  allTimeAdvance: number;
  allTimeSalaryPaid: number;
  allTimeBalance: number;
  loading: boolean;
  error: string | null;
}

const initialState: AdvancePaymentState = {
  payments: [],
  total: 0,
  page: 1,
  limit: 5,
  totalAdvance: 0,
  totalSalaryPaid: 0,
  balance: 0,
  allTimeAdvance: 0,
  allTimeSalaryPaid: 0,
  allTimeBalance: 0,
  loading: false,
  error: null,
};

const advancePaymentSlice = createSlice({
  name: "advancePayment",
  initialState,
  reducers: {
    setPayPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    clearAdvancePayments(state) {
      state.payments = [];
      state.total = 0;
      state.page = 1;
      state.totalAdvance = 0;
      state.totalSalaryPaid = 0;
      state.balance = 0;
      state.allTimeAdvance = 0;
      state.allTimeSalaryPaid = 0;
      state.allTimeBalance = 0;
    },
  },
  extraReducers: (builder) => {
    /* ================= FETCH ================= */
    builder.addCase(fetchAdvancePayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(
      fetchAdvancePayments.fulfilled,
      (state, action: PayloadAction<FetchAdvancePaymentsResponse>) => {
        state.loading = false;
        state.payments = action.payload.payments;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalAdvance = action.payload.totalAdvance;
        state.totalSalaryPaid = action.payload.totalSalaryPaid;
        state.balance = action.payload.balance;
        state.allTimeAdvance = action.payload.allTimeAdvance ?? state.allTimeAdvance;
        state.allTimeSalaryPaid = action.payload.allTimeSalaryPaid ?? state.allTimeSalaryPaid;
        state.allTimeBalance = action.payload.allTimeBalance ?? state.allTimeBalance;
      },
    );

    builder.addCase(fetchAdvancePayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* ================= ADD ================= */
    builder.addCase(addAdvancePayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(
      addAdvancePayment.fulfilled,
      (state, action: PayloadAction<{ success: boolean; payment: AdvancePayment; totalAdvance: number; totalSalaryPaid: number; balance: number }>) => {
        state.loading = false;
        state.payments.unshift(action.payload.payment);
        state.totalAdvance = action.payload.totalAdvance;
        state.totalSalaryPaid = action.payload.totalSalaryPaid;
        state.balance = action.payload.balance;
        state.allTimeAdvance = action.payload.totalAdvance;
        state.allTimeSalaryPaid = action.payload.totalSalaryPaid;
        state.allTimeBalance = action.payload.balance;
      },
    );

    builder.addCase(addAdvancePayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* ================= ALL-TIME TOTALS ================= */
    builder.addCase(
      fetchAllTimeTotals.fulfilled,
      (state, action: PayloadAction<{ totalAdvance: number; totalSalaryPaid: number; balance: number }>) => {
        state.allTimeAdvance = action.payload.totalAdvance;
        state.allTimeSalaryPaid = action.payload.totalSalaryPaid;
        state.allTimeBalance = action.payload.balance;
      },
    );
  },
});

export const { setPayPage, clearAdvancePayments } = advancePaymentSlice.actions;
export default advancePaymentSlice.reducer;
