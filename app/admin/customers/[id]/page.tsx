"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchCustomerDetailThunk } from "@/redux/thunks/customerThunks";
import { Card } from "@/components/ui/card";
import Table, { Column } from "@/components/common/Table";
import { Mail, Phone, ShoppingBag, Eye } from "lucide-react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Pagination from "@/components/common/Pagination";
import { Order } from "@/redux/types/order";
import OrderViewModal from "@/components/modals/OrderViewModal";

// ---------------------- Helper ----------------------
const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// ---------------------- Status Colors ----------------------
const statusColors: Record<Order["status"], string> = {
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

// ---------------------- Customer Detail Page ----------------------
const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { customer, loading, error } = useSelector(
    (state: RootState) => state.customers
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const PAGE_SIZE = 5;

  // All pagination and filtering is server-side; reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (!id) return;

    dispatch(
      fetchCustomerDetailThunk({
        id,
        orderPage: page,
        orderLimit: PAGE_SIZE,
        orderSearch: search,
        sortKey: "createdAt",
        sortDirection: "desc",
      })
    );
  }, [dispatch, id, page, search]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-[var(--text-error)]">{error}</div>;
  if (!customer) return <div className="p-6">Customer not found</div>;

  // Use server-provided pagination metadata
  const totalOrders = customer.ordersPagination?.totalItems ?? customer.orders.length;
  const totalPages = customer.ordersPagination?.totalPages ?? Math.ceil(totalOrders / PAGE_SIZE);

  const orderColumns: Column<Order>[] = [
    { key: "_id", label: "Order ID" },
    { key: "status", label: "Status" },
    { key: "totalAmount", label: "Amount" },
    { key: "createdAt", label: "Date" },
    { key: "actions" as keyof Order, label: "View" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* LEFT PROFILE */}
      <Card className="p-5 rounded-xl">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold">
            {customer.name[0]}
          </div>
          <h2 className="text-lg font-semibold">{customer.name}</h2>
          <div className="text-sm flex items-center gap-2">
            <Mail className="w-4 h-4" /> {customer.email}
          </div>
          <div className="text-sm flex items-center gap-2">
            <Phone className="w-4 h-4" /> {customer.phone}
          </div>
          <div className="w-full mt-4 flex justify-between text-sm">
            <span>Total Orders</span>
            <span className="font-semibold">{totalOrders}</span>
          </div>
          <div className="w-full flex justify-between text-sm">
            <span>Joined</span>
            <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>

      {/* RIGHT ORDERS */}
      <Card className="lg:col-span-3 p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Orders</h3>
        </div>

        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs mb-4"
        />

        <Table
          columns={orderColumns}
          data={customer.orders}
          renderCell={(order, key) => {
            switch (key) {
              case "createdAt":
                return new Date(order.createdAt).toLocaleDateString();
              case "totalAmount":
                return `₹${order.totalAmount}`;
              case "status":
                return (
                  <span
                    className={`px-3 py-1 rounded-md text-sm font-medium border ${
                      statusColors[order.status]
                    }`}
                  >
                    {capitalizeFirstLetter(order.status)}
                  </span>
                );
              case "actions":
                return (
                  <Button
                    className="p-2 rounded-md hover:bg-muted"
                    onClick={() => {
                      setSelectedOrder(order);
                      setModalOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                );
              default:
                return String(order[key] ?? "");
            }
          }}
        />

        {customer.orders.length === 0 && (
          <div className="text-center text-muted-foreground py-6">
            No orders found
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalOrders}
          onPageChange={setPage}
        />
      </Card>

      {/* ORDER MODAL */}
      <OrderViewModal
        order={selectedOrder}
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
      />
    </div>
  );
};

export default CustomerDetailPage;
