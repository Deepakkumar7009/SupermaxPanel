import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  FactoryExpense,
  FetchFactoryExpensesParams,
  CreateFactoryExpensePayload,
} from "../types/factoryExpense";

/* ================= FETCH ALL EXPENSES ================= */
const fetchFactoryExpenses = createAsyncThunk<
  {
    success: boolean;
    expenses: FactoryExpense[];
    total: number;
    page: number;
    limit: number;
    totalPendingAmount: number;
    totalPayedAmount: number;
    totalMonthAmount: number;
  },
  FetchFactoryExpensesParams | undefined,
  { rejectValue: string }
>(
  "factoryExpense/fetchFactoryExpenses",
  async (params, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();

      if (params?.search) query.append("search", params.search);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.status) query.append("status", params.status);
      if (params?.month) query.append("month", params.month.toString());
      if (params?.year) query.append("year", params.year.toString());

      const { data } = await axios.get(
        `/api/factoryExpense?${query.toString()}`,
      );
      return {
        success: data.success,
        expenses: data.expenses ?? [],
        total: data.total ?? 0,
        page: data.page ?? 1,
        limit: data.limit ?? 10,
        totalPendingAmount: data.totalPendingAmount ?? 0,
        totalPayedAmount: data.totalPayedAmount ?? 0,
        totalMonthAmount: data.totalMonthAmount ?? 0,
      };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch factory expenses",
        );
      }
      return rejectWithValue(
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  },
);

/* ================= CREATE EXPENSE ================= */
const createFactoryExpense = createAsyncThunk<
  { success: boolean; expense: FactoryExpense },
  CreateFactoryExpensePayload,
  { rejectValue: string }
>(
  "factoryExpense/createFactoryExpense",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`/api/factoryExpense`, payload);
      return { success: true, expense: data.expense };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to create factory expense",
        );
      }
      return rejectWithValue(
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  },
);

/* ================= UPDATE EXPENSE ================= */
const updateFactoryExpense = createAsyncThunk<
  FactoryExpense,
  { id: string; updatedData: Partial<FactoryExpense> },
  { rejectValue: string }
>(
  "factoryExpense/updateFactoryExpense",
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put<FactoryExpense>(
        `/api/factoryExpense/${id}`,
        updatedData,
      );

      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.error || "Failed to update expense",
        );
      }
      return rejectWithValue(
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  },
);

export { fetchFactoryExpenses, createFactoryExpense, updateFactoryExpense };
