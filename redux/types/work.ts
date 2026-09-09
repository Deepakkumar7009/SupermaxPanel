export interface WorkEntry {
  _id: string;
  employee: string;
  date: string;
  quantity?: number;
  amount?: number;
  status: "WORK" | "WORK_OFF";
  actions?: string; // optional for table rendering
}

/* -------- API TYPES -------- */
export interface FetchWorkEntriesResponse {
  success:         boolean;
  entries:         WorkEntry[];
  total:           number; // total number of work entries
  page:            number; // current page
  limit:           number; // page size
  totalWorkAmount: number; // sum of all work-entry amounts for this employee
}

export interface CreateWorkEntryPayload {
  employee: string;
  date: string;
  quantity?: number;
  amount?: number;
  status?: "WORK" | "WORK_OFF";
}

export interface CreateWorkEntryResponse {
  success: boolean;
  entry: WorkEntry;
}

export interface UpdateWorkEntryPayload {
  id:        string;
  date:      string;
  quantity?: number;
  amount?:   number;
}

export interface UpdateWorkEntryResponse {
  success: boolean;
  entry:   WorkEntry;
}
