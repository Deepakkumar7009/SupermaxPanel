"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchOrders } from "@/redux/thunks/orderThunks";
import { Eye } from "lucide-react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Table, { Column } from "@/components/common/Table";
import { Card } from "@/components/ui/card";

import OrderViewModal from "@/components/modals/OrderViewModal";
import { Order } from "@/redux/types/order";
import { useRouter } from "next/navigation";
import Pagination from "@/components/common/Pagination";

type OrderTableRow = Order & {
  email: string;
  actions: string;
};

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type PaymentStatus = "unpaid" | "advance" | "partial" | "paid" | "overpaid";

const OrdersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { orders, total, limit, totalOrderAmount, totalReceivedAmount, totalPendingAmount } = useSelector((s: RootState) => s.orders);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof OrderTableRow;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  useEffect(() => {
    dispatch(
      fetchOrders({
        search,
        status: status === "all" ? "" : status,
        page: currentPage,
        limit,
      })
    );
  }, [dispatch, search, status, currentPage, limit]);

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const handleSort = (key: keyof OrderTableRow) => {
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const paymentStatusColors: Record<PaymentStatus, string> = {
    unpaid:   "bg-[color:var(--color-payment-unpaid-bg)]   text-[color:var(--color-payment-unpaid-text)]   border-[color:var(--color-payment-unpaid-border)]",
    advance:  "bg-[color:var(--color-payment-advance-bg)]  text-[color:var(--color-payment-advance-text)]  border-[color:var(--color-payment-advance-border)]",
    partial:  "bg-[color:var(--color-payment-partial-bg)]  text-[color:var(--color-payment-partial-text)]  border-[color:var(--color-payment-partial-border)]",
    paid:     "bg-[color:var(--color-payment-paid-bg)]     text-[color:var(--color-payment-paid-text)]     border-[color:var(--color-payment-paid-border)]",
    overpaid: "bg-[color:var(--color-payment-overpaid-bg)] text-[color:var(--color-payment-overpaid-text)] border-[color:var(--color-payment-overpaid-border)]",
  };

  const columns: Column<OrderTableRow>[] = [
    { key: "_id", label: "#" },
    { key: "customerName", label: "Customer" },
    { key: "totalAmount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "paymentStatus", label: "Payment" },
    { key: "actions", label: "Actions" },
  ];

  const displayedOrders: OrderTableRow[] = orders.map((o) => ({
    ...o,
    email: o.customerEmail,
    actions: "view",
  }));

  const handleView = (order: Order) => {
    setViewOrder(order);
    setIsViewOpen(true);
  };

  const totalPages = Math.ceil(total / limit);

  // Theme-based status colors
  const statusColors: Record<OrderStatus, string> = {
    pending:
      "bg-[color:var(--color-status-pending-bg)] text-[color:var(--color-status-pending-text)] border-[color:var(--color-status-pending-border)]",
    processing:
      "bg-[color:var(--color-status-processing-bg)] text-[color:var(--color-status-processing-text)] border-[color:var(--color-status-processing-border)]",
    shipped:
      "bg-[color:var(--color-status-shipped-bg)] text-[color:var(--color-status-shipped-text)] border-[color:var(--color-status-shipped-border)]",
    delivered:
      "bg-[color:var(--color-status-delivered-bg)] text-[color:var(--color-status-delivered-text)] border-[color:var(--color-status-delivered-border)]",
    cancelled:
      "bg-[color:var(--color-status-cancelled-bg)] text-[color:var(--color-status-cancelled-text)] border-[color:var(--color-status-cancelled-border)]",
  };

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Orders</h1>
      </div>

      <OrderViewModal
        isOpen={isViewOpen}
        setIsOpen={setIsViewOpen}
        order={viewOrder}
      />

      {/* Totals cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <h2 className="text-sm text-[var(--muted-foreground)]">Total Amount Get</h2>
          <p className="text-xl font-bold">₹ {totalReceivedAmount.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm text-[var(--muted-foreground)]">Total Amount Pending</h2>
          <p className="text-xl font-bold">₹ {totalPendingAmount.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm text-[var(--muted-foreground)]">Total Order Amount</h2>
          <p className="text-xl font-bold">₹ {totalOrderAmount.toFixed(2)}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={status}
          onChange={(value) => setStatus(value as "all" | OrderStatus)}
          options={statusOptions}
          placeholder="Select status"
        />
        <Button
          onClick={() => router.push("/admin/orders/create")}
          className="sm:ml-auto"
        >
          Create Order
        </Button>
      </div>

      <Card className="p-4 rounded-xl">
        <Table<OrderTableRow>
          columns={columns}
          data={displayedOrders}
          onSort={handleSort}
          sortConfig={sortConfig}
          renderCell={(order, key, index) => {
            switch (key) {
              case "_id":
                return <span>{index + 1 + (currentPage - 1) * limit}</span>;
              case "totalAmount":
                return (
                  <span>
                    ₹{order.totalAmount.toFixed(2)}
                    {(order.paidAmount ?? 0) > 0 && (
                      <span className="block text-xs text-[var(--amount-paid)]">
                        paid ₹{(order.paidAmount ?? 0).toFixed(2)}
                      </span>
                    )}
                  </span>
                );
              case "status":
                return (
                  <span
                    className={`px-2 py-1 rounded-md border text-sm capitalize ${
                      order.status ? statusColors[order.status as OrderStatus] : ""
                    }`}
                  >
                    {order.status}
                  </span>
                );
              case "paymentStatus": {
                // cancelled orders show a neutral dash — no payment badge
                if (order.status === "cancelled") {
                  return <span className="text-muted-foreground text-xs">—</span>;
                }
                const ps = (order.paymentStatus ?? "unpaid") as PaymentStatus;
                return (
                  <span className={`px-2 py-1 rounded-md border text-xs font-semibold capitalize ${paymentStatusColors[ps]}`}>
                    {ps}
                  </span>
                );
              }
              case "actions":
                return (
                  <Button onClick={() => handleView(order)}>
                    <Eye className="w-5 h-5" />
                  </Button>
                );
              default:
                return order[key] ? String(order[key]) : "";
            }
          }}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </Card>
    </div>
  );
};

export default OrdersPage;
