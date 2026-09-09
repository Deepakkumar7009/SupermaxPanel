export interface EmployeeState {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  currentEmployee: Employee | null;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  advancePayment: number;
  paidPayment: number;
  createdAt: string;
  actions: string;
}

/* -------- API TYPES -------- */
export interface FetchEmployeesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface FetchEmployeesResponse {
  success: boolean;
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
}

export interface FetchEmployeeByIdResponse {
  success: boolean;
  employee: Employee;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface CreateEmployeeResponse {
  success: boolean;
  employee: Employee;
}
