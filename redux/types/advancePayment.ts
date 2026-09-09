/* ================= BASE MODEL ================= */
export interface AdvancePayment {
  _id: string;
  employee: string;
  type: "ADVANCE" | "SALARY_PAYMENT";
  amount: number;
  note?: string;
  date: string;
  createdAt?: string;
}

/* ================= FETCH PARAMS ================= */
export interface FetchAdvancePaymentsParams {
  employeeId: string;
  page?: number;
  limit?: number;
  month?: string; // "1"–"12"
  year?: string; // "2026"
}

/* ================= FETCH RESPONSE ================= */
export interface FetchAdvancePaymentsResponse {
  success: boolean;
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
}

/* ================= CREATE PAYLOAD ================= */
export interface CreateAdvancePaymentPayload {
  employee: string;
  type: "ADVANCE" | "SALARY_PAYMENT";
  amount: number;
  note?: string;
  date: string;
}

/* ================= CREATE RESPONSE ================= */
export interface CreateAdvancePaymentResponse {
  success: boolean;
  payment: AdvancePayment;
  totalAdvance: number;
  totalSalaryPaid: number;
  balance: number;
}
