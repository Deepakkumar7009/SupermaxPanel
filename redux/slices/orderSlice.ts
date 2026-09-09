import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  OrderState,
  FetchOrdersResponse,
  FetchOrderByIdResponse,
  CreateOrderResponse,
  UpdateOrderResponse,
  AddPaymentResponse,
} from "../types/order";
import {
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrder,
  addPayment,
} from "../thunks/orderThunks";

const initialState: OrderState = {
  orders: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  currentOrder: null,
  totalOrderAmount: 0,
  totalReceivedAmount: 0,
  totalPendingAmount: 0,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearCurrentOrder(state) {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    /* -------- FETCH ORDERS -------- */
    builder.addCase(fetchOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchOrders.fulfilled,
      (state, action: PayloadAction<FetchOrdersResponse>) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.total = action.payload.total;
        state.page = action.payload.page;
        // Do NOT overwrite limit — list page manages its own limit
        state.totalOrderAmount = action.payload.totalOrderAmount ?? 0;
        state.totalReceivedAmount = action.payload.totalReceivedAmount ?? 0;
        state.totalPendingAmount = action.payload.totalPendingAmount ?? 0;
      },
    );
    builder.addCase(fetchOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* -------- FETCH ORDER BY ID -------- */
    builder.addCase(fetchOrderById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchOrderById.fulfilled,
      (state, action: PayloadAction<FetchOrderByIdResponse>) => {
        state.loading = false;
        state.currentOrder = action.payload.order;
      },
    );
    builder.addCase(fetchOrderById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* -------- CREATE ORDER -------- */
    builder.addCase(createOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      createOrder.fulfilled,
      (state, action: PayloadAction<CreateOrderResponse>) => {
        state.loading = false;
        state.orders.unshift(action.payload.order);
        state.total += 1;
      },
    );
    builder.addCase(createOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* -------- UPDATE ORDER -------- */
    builder.addCase(updateOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateOrder.fulfilled,
      (state, action: PayloadAction<UpdateOrderResponse>) => {
        state.loading = false;
        const updated = action.payload.order;
        state.orders = state.orders.map((o) =>
          o._id === updated._id ? updated : o,
        );
        if (state.currentOrder?._id === updated._id) {
          state.currentOrder = updated;
        }
      },
    );
    builder.addCase(updateOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* -------- ADD PAYMENT -------- */
    builder.addCase(addPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addPayment.fulfilled,
      (state, action: PayloadAction<AddPaymentResponse>) => {
        state.loading = false;
        const updated = action.payload.order;
        state.orders = state.orders.map((o) =>
          o._id === updated._id ? updated : o,
        );
        if (state.currentOrder?._id === updated._id) {
          state.currentOrder = updated;
        }
      },
    );
    builder.addCase(addPayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
