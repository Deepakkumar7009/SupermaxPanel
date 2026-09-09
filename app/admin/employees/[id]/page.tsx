"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";

import { fetchEmployeeById } from "@/redux/thunks/employeeThunk";
import { fetchWorkEntries, fetchAllTimeWorkTotal } from "@/redux/thunks/workThunk";
import { fetchAdvancePayments, fetchAllTimeTotals } from "@/redux/thunks/advancePaymentThunks";
import { setPage } from "@/redux/slices/workSlice";
import { setPayPage } from "@/redux/slices/advancePaymentSlice";

import { Card } from "@/components/ui/card";
import Table, { Column } from "@/components/common/Table";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Pagination from "@/components/common/Pagination";
import Select from "@/components/common/Select";

import { Phone, Mail, Briefcase, Eye, Wallet, Pencil } from "lucide-react";
import AddWorkEntryModal from "@/components/modals/AddWorkEntryModal";
import AddAdvancePaymentModal from "@/components/modals/AddAdvancePaymentModal";
import WorkEntryViewModal from "@/components/modals/WorkEntryViewModal";
import { WorkEntry } from "@/redux/types/work";
import { AdvancePayment } from "@/redux/types/advancePayment";

const PAGE_SIZE = 5;

const MONTHS = [
  { label: "All Months", value: "all" },
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

/* build year options: current year going back 3 years */
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => {
  const y = String(currentYear - i);
  return { label: y, value: y };
});

const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { currentEmployee, loading: empLoading, error: empError } =
    useSelector((state: RootState) => state.employee);

  const { entries, total, loading: workLoading, error: workError, page, totalWorkAmount, allTimeTotalWorkAmount } =
    useSelector((state: RootState) => state.work);

  const {
    payments, total: payTotal, page: payPage,
    totalAdvance, totalSalaryPaid, balance,
    allTimeAdvance, allTimeSalaryPaid, allTimeBalance,
    loading: payLoading,
  } = useSelector((state: RootState) => state.advancePayment);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [addWorkOpen, setAddWorkOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editWorkOpen, setEditWorkOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  /* ---------------- DEBOUNCE SEARCH ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!id) return;
    dispatch(fetchEmployeeById(id));
    dispatch(fetchAllTimeTotals(id));
    dispatch(fetchAllTimeWorkTotal(id));
  }, [id, dispatch]);

  /* re-fetch both work entries AND payment totals whenever month/year/debouncedSearch changes */
  useEffect(() => {
    if (!id) return;
    const activeMonth = month !== "all" ? month : undefined;
    const activeYear = activeMonth ? year : undefined;

    dispatch(setPage(1));
    dispatch(fetchWorkEntries({ employeeId: id, page: 1, limit: PAGE_SIZE, search: debouncedSearch, month: activeMonth, year: activeYear }));
    dispatch(fetchAdvancePayments({ employeeId: id, page: 1, limit: 5, month: activeMonth, year: activeYear }));
  }, [id, dispatch, debouncedSearch, month, year]);

  /* re-fetch payment history when payPage changes */
  useEffect(() => {
    if (!id) return;
    const activeMonth = month !== "all" ? month : undefined;
    dispatch(fetchAdvancePayments({
      employeeId: id,
      page:  payPage,
      limit: 5,
      month: activeMonth,
      year:  activeMonth ? year : undefined,
    }));
  }, [payPage]);

  useEffect(() => {
    if (!id) return;
    const activeMonth = month !== "all" ? month : undefined;
    dispatch(fetchWorkEntries({
      employeeId: id,
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      month: activeMonth,
      year:  activeMonth ? year : undefined,
    }));
  }, [page]);   // page change keeps existing work filters

  /* only block on employee profile load — work/payment load in background */
  if (empLoading) return <div className="p-6">Loading...</div>;
  if (empError)   return <div className="p-6 text-[var(--text-error)]">{empError}</div>;
  if (!currentEmployee) return <div className="p-6">Employee not found</div>;

  /* ---------------- WORK TABLE COLUMNS ---------------- */
  const workColumns: Column<WorkEntry>[] = [
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "quantity", label: "Quantity" },
    { key: "amount", label: "Amount" },
    { key: "actions" as keyof WorkEntry, label: "Action" },
  ];

  /* ---------------- PAYMENT TABLE COLUMNS ---------------- */
  const payColumns: Column<AdvancePayment>[] = [
    { key: "date", label: "Date" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "note", label: "Note" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* ===================== LEFT PROFILE ===================== */}
      <Card className="p-5 rounded-xl">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold">
            {currentEmployee.name[0]}
          </div>
          <h2 className="text-lg font-semibold">{currentEmployee.name}</h2>

          <div className="text-sm flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {currentEmployee.phone}
          </div>

          {currentEmployee.email && (
            <div className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {currentEmployee.email}
            </div>
          )}

          <div className="w-full border-t pt-3 mt-1 flex flex-col gap-2">
            {/* When a month is selected show filtered totals; otherwise show all-time */}
            {(() => {
              const isFiltered = month !== "all";
              const displayEarned   = isFiltered ? totalWorkAmount       : allTimeTotalWorkAmount;
              const displayAdvance  = isFiltered ? totalAdvance          : allTimeAdvance;
              const displaySalary   = isFiltered ? totalSalaryPaid       : allTimeSalaryPaid;
              const netBalance      = displayEarned - displayAdvance - displaySalary;
              const monthLabel      = MONTHS.find((m) => m.value === month)?.label;

              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Work Entries</span>
                    <span className="font-semibold">{total}</span>
                  </div>

                  {isFiltered && (
                    <div className="text-xs text-center rounded px-2 py-0.5 bg-[color:var(--color-banner-warning-bg)] border border-[color:var(--color-banner-warning-border)] text-[color:var(--color-banner-warning-label)]">
                      Showing {monthLabel} {year}
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>Total Earned</span>
                    <span className="font-semibold">₹ {displayEarned}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Advance Given</span>
                    <span className="font-semibold text-[color:var(--color-pay-advance-text)]">₹ {displayAdvance}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Salary Paid</span>
                    <span className="font-semibold text-[color:var(--color-pay-salary-text)]">₹ {displaySalary}</span>
                  </div>

                  {/* +ve → owe emp salary → green | -ve → emp owes advance → red | 0 → settled */}
                  <div className="flex justify-between text-sm items-center">
                    <span className="font-semibold">Balance Due</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        netBalance > 0
                          ? "bg-[color:var(--color-balance-positive-bg)] text-[color:var(--color-balance-positive-text)]"
                          : netBalance < 0
                          ? "bg-[color:var(--color-balance-negative-bg)] text-[color:var(--color-balance-negative-text)]"
                          : "bg-[color:var(--color-balance-zero-bg)] text-[color:var(--color-balance-zero-text)]"
                      }`}
                    >
                      {netBalance > 0
                        ? `₹${netBalance} due to emp`
                        : netBalance < 0
                        ? `₹${Math.abs(netBalance)} advance owed`
                        : "Settled"}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="w-full flex justify-between text-sm">
            <span>Joined</span>
            <span>{new Date(currentEmployee.createdAt).toLocaleDateString()}</span>
          </div>

          <Button className="w-full mt-2" onClick={() => setAddPaymentOpen(true)}>
            <Wallet className="w-4 h-4 mr-2" /> Add Payment
          </Button>
        </div>
      </Card>

      {/* ===================== RIGHT COLUMN ===================== */}
      <div className="lg:col-span-3 flex flex-col gap-6">

        {/* ---------- WORK ENTRIES ---------- */}
        <Card className="p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Work Entries</h3>
            </div>
            <Button onClick={() => setAddWorkOpen(true)}>Add Work Entry</Button>
          </div>

          {/* ---- filters row ---- */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Search by quantity or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={month}
              onChange={(v) => setMonth(v)}
              options={MONTHS}
              placeholder="All Months"
              className="w-40"
            />
            {month !== "all" && (
              <Select
                value={year}
                onChange={(v) => setYear(v)}
                options={YEARS}
                placeholder="Year"
                className="w-28"
              />
            )}
            {/* show filtered total work amount when a month is selected */}
            {month !== "all" && (
              <div className="flex items-center gap-1 text-sm font-semibold rounded-md px-3 py-1 bg-[color:var(--color-banner-warning-bg)] border border-[color:var(--color-banner-warning-border)] text-[color:var(--color-banner-warning-label)]">
                {MONTHS.find((m) => m.value === month)?.label} total: ₹{totalWorkAmount}
              </div>
            )}
          </div>

          <Table
            columns={workColumns}
            data={entries}
            renderCell={(entry, key) => {
              switch (key) {
                case "date":
                  return new Date(entry.date).toLocaleDateString();
                case "status":
                  return (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        entry.status === "WORK"
                          ? "bg-[color:var(--color-work-status-active-bg)] text-[color:var(--color-work-status-active-text)]"
                          : "bg-[color:var(--color-work-status-off-bg)] text-[color:var(--color-work-status-off-text)]"
                      }`}
                    >
                      {entry.status === "WORK" ? "Work" : "Work Off"}
                    </span>
                  );
                case "quantity":
                  if (entry.status === "WORK_OFF") {
                    return (
                      <span className="text-xs font-semibold italic text-[color:var(--color-work-status-off-text)]">
                        No entry for this day
                      </span>
                    );
                  }
                  return entry.quantity != null ? String(entry.quantity) : "—";
                case "amount":
                  if (entry.status === "WORK_OFF") return null;
                  return entry.amount != null ? `₹${entry.amount}` : "—";
                case "actions":
                  if (entry.status === "WORK_OFF") {
                    /* WORK_OFF — open edit modal directly to fill in entry */
                    return (
                      <Button
                        className="p-2"
                        onClick={() => {
                          setSelectedEntryId(entry._id);
                          setEditWorkOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    );
                  }
                  /* WORK — open view modal */
                  return (
                    <Button
                      className="p-2"
                      onClick={() => {
                        setSelectedEntryId(entry._id);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  );
                default:
                  return String(entry[key] ?? "");
              }
            }}
          />

          {entries.length === 0 && (
            <div className="text-center text-muted-foreground py-6">
              No work entries found
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            totalItems={total}
            onPageChange={(p) => dispatch(setPage(p))}
          />
        </Card>

        {/* ---------- PAYMENT HISTORY ---------- */}
        <Card className="p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Payment History</h3>
            </div>
          </div>

          <Table
            columns={payColumns}
            data={payments}
            renderCell={(p, key) => {
              switch (key) {
                case "date":
                  return new Date(p.date).toLocaleDateString();
                case "type":
                  return (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.type === "ADVANCE"
                          ? "bg-[color:var(--color-pay-type-advance-bg)] text-[color:var(--color-pay-type-advance-text)]"
                          : "bg-[color:var(--color-pay-type-salary-bg)] text-[color:var(--color-pay-type-salary-text)]"
                      }`}
                    >
                      {p.type === "ADVANCE" ? "Advance" : "Salary Paid"}
                    </span>
                  );
                case "amount":
                  /* ADVANCE = you paid out  → show + (money left your pocket)  */
                  /* SALARY  = deduct owed   → show − (reduces employee balance) */
                  return (
                    <span className={`font-semibold ${p.type === "ADVANCE" ? "text-[color:var(--color-pay-advance-text)]" : "text-[color:var(--color-pay-salary-text)]"}`}>
                      {p.type === "ADVANCE" ? `+ ₹${p.amount}` : `− ₹${p.amount}`}
                    </span>
                  );
                default:
                  return String(p[key] ?? "—");
              }
            }}
          />

          {payments.length === 0 && (
            <div className="text-center text-muted-foreground py-6">
              No payments recorded yet
            </div>
          )}

          <Pagination
            currentPage={payPage}
            totalPages={Math.ceil(payTotal / 5)}
            totalItems={payTotal}
            onPageChange={(p) => dispatch(setPayPage(p))}
          />
        </Card>
      </div>

      {/* ===================== MODALS ===================== */}
      <AddWorkEntryModal
        isOpen={addWorkOpen}
        setIsOpen={setAddWorkOpen}
        employee={currentEmployee}
      />

      {/* direct edit for WORK_OFF rows — opens with date pre-filled, qty/amount blank */}
      <AddWorkEntryModal
        isOpen={editWorkOpen}
        setIsOpen={setEditWorkOpen}
        employee={currentEmployee}
        entry={entries.find((e) => e._id === selectedEntryId) ?? null}
      />

      <AddAdvancePaymentModal
        isOpen={addPaymentOpen}
        setIsOpen={setAddPaymentOpen}
        employee={currentEmployee}
        selectedMonth={month !== "all" ? month : undefined}
        selectedYear={month !== "all" ? year : undefined}
      />

      <WorkEntryViewModal
        isOpen={viewOpen}
        setIsOpen={setViewOpen}
        entryId={selectedEntryId}
        employee={currentEmployee}
      />
    </div>
  );
};

export default EmployeeDetailPage;
