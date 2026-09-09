import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  FetchAdvancePaymentsParams,
  FetchAdvancePaymentsResponse,
  CreateAdvancePaymentPayload,
  CreateAdvancePaymentResponse,
} from "../types/advancePayment";

/* ================= FETCH PAYMENT HISTORY ================= */
const fetchAdvancePayments = createAsyncThunk<
  FetchAdvancePaymentsResponse,
  FetchAdvancePaymentsParams,
  { rejectValue: string }
>(
  "advancePayment/fetchAdvancePayments",
  async ({ employeeId, page = 1, limit = 5, month, year }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (month) query.append("month", month);
      if (year) query.append("year", year);

      const { data } = await axios.get<FetchAdvancePaymentsResponse>(
        `/api/employees/${employeeId}/advance?${query.toString()}`,
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch payments");
      }
      return rejectWithValue(err instanceof Error ? err.message : "Unknown error");
    }
  },
);

/* ================= ADD ADVANCE / SALARY PAYMENT ================= */
const addAdvancePayment = createAsyncThunk<
  CreateAdvancePaymentResponse,
  CreateAdvancePaymentPayload,
  { rejectValue: string }
>(
  "advancePayment/addAdvancePayment",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<CreateAdvancePaymentResponse>(
        `/api/employees/${payload.employee}/advance`,
        payload,
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to add payment");
      }
      return rejectWithValue(err instanceof Error ? err.message : "Unknown error");
    }
  },
);

/* ================= FETCH ALL-TIME TOTALS (no month filter) ================= */
const fetchAllTimeTotals = createAsyncThunk<
  { totalAdvance: number; totalSalaryPaid: number; balance: number },
  string,
  { rejectValue: string }
>(
  "advancePayment/fetchAllTimeTotals",
  async (employeeId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get<{ totalAdvance: number; totalSalaryPaid: number; balance: number }>(
        `/api/employees/${employeeId}/advance?page=1&limit=1`,
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch totals");
      }
      return rejectWithValue(err instanceof Error ? err.message : "Unknown error");
    }
  },
);

export { fetchAdvancePayments, addAdvancePayment, fetchAllTimeTotals };
