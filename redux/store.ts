import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./slices/productSlice";
import categoryReducer from "./slices/categorySlice";
import orderReducer from "./slices/orderSlice";
import customerReducer from "./slices/customerSlice";
import employeeReducer from "./slices/employeeSlice";
import workReducer from "./slices/workSlice";
import factoryExpenseReducer from "./slices/factoryExpenseSlice";
import rawMaterialReducer from "./slices/rawMaterialSlice";
import dashboardReducer from "./slices/dashboardSlice";
import userReducer from "./slices/userSlice";
import advancePaymentReducer from "./slices/advancePaymentSlice";

export const store = configureStore({
  reducer: {
    users: userReducer,
    product: productReducer,
    category: categoryReducer,
    orders: orderReducer,
    customers: customerReducer,
    employee: employeeReducer,
    work: workReducer,
    factoryExpense: factoryExpenseReducer,
    rawMaterial: rawMaterialReducer,
    dashboard: dashboardReducer,
    advancePayment: advancePaymentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
