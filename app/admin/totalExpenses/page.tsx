"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  Factory,
  Layers,
  Users,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  IndianRupee,
} from "lucide-react";

import { RootState, AppDispatch } from "@/redux/store";
import { fetchFactoryExpenses } from "@/redux/thunks/factoryExpenseThunks";
import { fetchRawMaterials } from "@/redux/thunks/rawMaterialThunks";
import { fetchEmployees } from "@/redux/thunks/employeeThunk";
import { fetchOrders } from "@/redux/thunks/orderThunks";
import { Card } from "@/components/ui/card";
import Select from "@/components/common/Select";

/* ---------- helpers ---------- */
const months = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(0, i).toLocaleString("default", { month: "long" }),
  value: String(i + 1),
}));

const years = Array.from({ length: 10 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { label: String(y), value: String(y) };
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

/* ---------- page ---------- */
const TotalExpensesPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const factory = useSelector((state: RootState) => state.factoryExpense);
  const rawMat = useSelector((state: RootState) => state.rawMaterial);
  const empState = useSelector((state: RootState) => state.employee);
  const ordersState = useSelector((state: RootState) => state.orders);

  /* fetch totals on mount / filter change (no limit override — keep list pages' limit intact) */
  useEffect(() => {
    dispatch(fetchFactoryExpenses({ month, year }));
    dispatch(fetchRawMaterials({ month: Number(month), year: Number(year) }));
    dispatch(fetchOrders({}));
  }, [dispatch, month, year]);

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 9999 }));
  }, [dispatch]);

  /* employee totals aggregated from the list */
  const empTotals = useMemo(() => {
    const totalAdvance = empState.employees.reduce(
      (s, e) => s + (e.advancePayment ?? 0),
      0,
    );
    const totalPaid = empState.employees.reduce(
      (s, e) => s + (e.paidPayment ?? 0),
      0,
    );
    return { totalAdvance, totalPaid, grand: totalAdvance + totalPaid };
  }, [empState.employees]);

  /* combined grand totals */
  const grandTotal =
    factory.totalMonthAmount +
    rawMat.totalAmount +
    empTotals.grand +
    ordersState.totalOrderAmount;
  const grandPending =
    factory.totalPendingAmount +
    rawMat.pendingAmount +
    ordersState.totalPendingAmount;
  const grandPaid =
    factory.totalPayedAmount +
    rawMat.paidAmount +
    empTotals.totalPaid +
    ordersState.totalReceivedAmount;

  const loading =
    factory.loading || rawMat.loading || empState.loading || ordersState.loading;

  /* ---- category cards data ---- */
  const categories = [
    {
      label: "Factory Expenses",
      icon: Factory,
      total: factory.totalMonthAmount,
      pending: factory.totalPendingAmount,
      paid: factory.totalPayedAmount,
      href: "/admin/factoryExpense",
      color: "text-[color:var(--color-cat-factory-color)]",
      bg: "bg-[color:var(--color-cat-factory-bg)]",
      border: "border-[color:var(--color-cat-factory-border)]",
    },
    {
      label: "Raw Material",
      icon: Layers,
      total: rawMat.totalAmount,
      pending: rawMat.pendingAmount,
      paid: rawMat.paidAmount,
      href: "/admin/rawMaterial",
      color: "text-[color:var(--color-cat-rawmat-color)]",
      bg: "bg-[color:var(--color-cat-rawmat-bg)]",
      border: "border-[color:var(--color-cat-rawmat-border)]",
    },
    {
      label: "Employee Expenses",
      icon: Users,
      total: empTotals.grand,
      pending: empTotals.totalAdvance,
      paid: empTotals.totalPaid,
      href: "/admin/employees",
      color: "text-[color:var(--color-cat-employee-color)]",
      bg: "bg-[color:var(--color-cat-employee-bg)]",
      border: "border-[color:var(--color-cat-employee-border)]",
      pendingLabel: "Advance",
      paidLabel: "Paid",
    },
    {
      label: "Orders",
      icon: ShoppingCart,
      total: ordersState.totalOrderAmount,
      pending: ordersState.totalPendingAmount,
      paid: ordersState.totalReceivedAmount,
      href: "/admin/orders",
      color: "text-[color:var(--color-cat-orders-color)]",
      bg: "bg-[color:var(--color-cat-orders-bg)]",
      border: "border-[color:var(--color-cat-orders-border)]",
      pendingLabel: "Due",
      paidLabel: "Received",
    },
  ];

  /* ---- % share helpers ---- */
  const pct = (part: number) =>
    grandTotal > 0 ? Math.round((part / grandTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Total Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Consolidated view of all business expenditure
          </p>
        </div>

        {/* Month / Year filter */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={month}
            onChange={setMonth}
            options={months}
            placeholder="Month"
          />
          <Select
            value={year}
            onChange={setYear}
            options={years}
            placeholder="Year"
          />
        </div>
      </div>

      {/* ── Grand summary cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Grand Total</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "—" : `₹ ${fmt(grandTotal)}`}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                All categories combined
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Pending</p>
              <p className="mt-2 text-2xl font-bold text-[var(--status-pending-text)]">
                {loading ? "—" : `₹ ${fmt(grandPending)}`}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Factory + Raw Material + Orders due
              </p>
            </div>
            <div className="rounded-lg bg-[var(--status-pending-bg)] p-3">
              <Clock className="h-5 w-5 text-[var(--status-pending-text)]" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Paid</p>
              <p className="mt-2 text-2xl font-bold text-[var(--status-delivered-text)]">
                {loading ? "—" : `₹ ${fmt(grandPaid)}`}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Across all categories
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Orders received + other paid expenses
              </p>
            </div>
            <div className="rounded-lg bg-[var(--status-delivered-bg)] p-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--status-delivered-text)]" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Category breakdown cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const share = pct(cat.total);

          return (
            <Card
              key={cat.label}
              className={`p-5 border ${cat.border} ${cat.bg} flex flex-col gap-3`}
            >
              {/* card header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${cat.color}`} />
                  <span className={`font-semibold text-sm ${cat.color}`}>
                    {cat.label}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs font-medium">
                  {share}% of total
                </span>
              </div>

              {/* total */}
              <div>
                <p className="text-muted-foreground text-xs">Total</p>
                <p className="text-xl font-bold">
                  {loading ? "—" : `₹ ${fmt(cat.total)}`}
                </p>
              </div>

              {/* progress bar */}
              <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-1.5 rounded-full bg-current transition-all"
                  style={{ width: `${share}%` }}
                />
              </div>

              {/* pending / paid row */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--status-pending-text)]">
                  {cat.pendingLabel ?? "Pending"}: ₹ {loading ? "—" : fmt(cat.pending)}
                </span>
                <span className="text-[var(--status-delivered-text)]">
                  {cat.paidLabel ?? "Paid"}: ₹ {loading ? "—" : fmt(cat.paid)}
                </span>
              </div>

              {/* link */}
              <Link
                href={cat.href}
                className={`mt-auto flex items-center gap-1 text-xs font-medium ${cat.color} hover:underline`}
              >
                View Details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          );
        })}
      </div>

      {/* ── Summary table ── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="text-muted-foreground h-5 w-5" />
          <h2 className="font-semibold text-base">Expense Breakdown</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--table-header-bg)] text-[var(--table-header-text)]">
                <th className="rounded-l-md px-4 py-2 text-left font-semibold">
                  Category
                </th>
                <th className="px-4 py-2 text-right font-semibold">
                  Pending / Advance
                </th>
                <th className="px-4 py-2 text-right font-semibold">
                  Paid
                </th>
                <th className="rounded-r-md px-4 py-2 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {categories.map((cat) => (
                <tr key={cat.label} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <cat.icon className={`h-4 w-4 ${cat.color}`} />
                      <span className="font-medium">{cat.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--status-pending-text)]">
                    {loading ? "—" : `₹ ${fmt(cat.pending)}`}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--status-delivered-text)]">
                    {loading ? "—" : `₹ ${fmt(cat.paid)}`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {loading ? "—" : `₹ ${fmt(cat.total)}`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--border)] font-bold">
                <td className="px-4 py-3">Grand Total</td>
                <td className="px-4 py-3 text-right text-[var(--status-pending-text)]">
                  {loading ? "—" : `₹ ${fmt(grandPending)}`}
                </td>
                <td className="px-4 py-3 text-right text-[var(--status-delivered-text)]">
                  {loading ? "—" : `₹ ${fmt(grandPaid)}`}
                </td>
                <td className="px-4 py-3 text-right">
                  {loading ? "—" : `₹ ${fmt(grandTotal)}`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TotalExpensesPage;
