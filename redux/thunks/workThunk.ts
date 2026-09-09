import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  FetchWorkEntriesResponse,
  CreateWorkEntryPayload,
  CreateWorkEntryResponse,
  UpdateWorkEntryPayload,
  UpdateWorkEntryResponse,
} from "../types/work";

/* -------- FETCH WORK ENTRIES WITH PAGINATION -------- */
const fetchWorkEntries = createAsyncThunk<
  FetchWorkEntriesResponse,
  { employeeId: string; page: number; limit: number; search?: string; month?: string; year?: string }
>(
  "work/fetchWorkEntries",
  async ({ employeeId, page, limit, search = "", month, year }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({
        employeeId,
        page: String(page),
        limit: String(limit),
        search,
      });
      if (month) query.append("month", month);
      if (year) query.append("year", year);

      const { data } = await axios.get<FetchWorkEntriesResponse>(`/api/work?${query.toString()}`);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch work entries",
        );
      }
      return rejectWithValue(
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  },
);

/* -------- CREATE WORK ENTRY -------- */
const createWorkEntry = createAsyncThunk<
  CreateWorkEntryResponse,
  CreateWorkEntryPayload
>(
  "work/createWorkEntry",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<CreateWorkEntryResponse>(
        "/api/work",
        payload,
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to create work entry",
        );
      }
      return rejectWithValue(
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  },
);

/* -------- UPDATE WORK ENTRY -------- */
const updateWorkEntry = createAsyncThunk<
  UpdateWorkEntryResponse,
  UpdateWorkEntryPayload,
  { rejectValue: string }
>(
  "work/updateWorkEntry",
  async ({ id, ...body }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put<UpdateWorkEntryResponse>(`/api/work/${id}`, body);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to update work entry");
      }
      return rejectWithValue(err instanceof Error ? err.message : "Unknown error");
    }
  },
);

/* -------- ALL-TIME WORK TOTAL (no month filter) -------- */
const fetchAllTimeWorkTotal = createAsyncThunk<
  { totalWorkAmount: number },
  string,
  { rejectValue: string }
>(
  "work/fetchAllTimeWorkTotal",
  async (employeeId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get<{ totalWorkAmount: number }>(
        `/api/work?employeeId=${employeeId}&page=1&limit=1`,
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch total");
      }
      return rejectWithValue(err instanceof Error ? err.message : "Unknown error");
    }
  },
);

export { fetchWorkEntries, createWorkEntry, updateWorkEntry, fetchAllTimeWorkTotal };
