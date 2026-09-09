import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RawMaterial, RawMaterialState } from "../types/rawMaterial";
import {
  fetchRawMaterials,
  createRawMaterial,
  updateRawMaterial,
} from "../thunks/rawMaterialThunks";

const initialState: RawMaterialState = {
  materials: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,

  totalAmount: 0,
  pendingAmount: 0,
  paidAmount: 0,
};

const rawMaterialSlice = createSlice({
  name: "rawMaterial",
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRawMaterials.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchRawMaterials.fulfilled, (state, action) => {
      state.loading = false;
      state.materials = action.payload.materials;
      state.total = action.payload.total;
      state.page = action.payload.page;
      // Do NOT overwrite limit — list page manages its own limit
      state.totalAmount = action.payload.totalAmount;
      state.pendingAmount = action.payload.pendingAmount;
      state.paidAmount = action.payload.paidAmount;
    });

    builder.addCase(fetchRawMaterials.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Error";
    });

    builder.addCase(createRawMaterial.fulfilled, (state, action) => {
      const mat = action.payload.material;
      state.materials.unshift(mat);
      state.total += 1;
      state.totalAmount += mat.amount;
      if (mat.status === "pending") {
        state.pendingAmount += mat.amount;
      } else if (mat.status === "paid") {
        state.paidAmount += mat.amount;
      }
    });
    builder.addCase(updateRawMaterial.fulfilled, (state, action) => {
      const index = state.materials.findIndex(
        (m) => m._id === action.payload._id,
      );

      if (index !== -1) {
        const old = state.materials[index];
        state.totalAmount -= old.amount;
        if (old.status === "pending") {
          state.pendingAmount -= old.amount;
        } else if (old.status === "paid") {
          state.paidAmount -= old.amount;
        }

        state.materials[index] = action.payload;

        const updated = action.payload;
        state.totalAmount += updated.amount;
        if (updated.status === "pending") {
          state.pendingAmount += updated.amount;
        } else if (updated.status === "paid") {
          state.paidAmount += updated.amount;
        }
      }
    });
  },
});

export const { setPage } = rawMaterialSlice.actions;

export default rawMaterialSlice.reducer;
