"use client";

import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateOrder, addPayment } from "@/redux/thunks/orderThunks";

import DialogModal from "@/components/common/DialogModal";
import Button from "@/components/common/Button";
import FloatingInput from "@/components/common/FloatingInput";
import Select from "@/components/common/Select";
import { Loader2, Printer } from "lucide-react";
import { Order, PaymentEntry } from "@/redux/types/order";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentType = PaymentEntry["type"];
type PaymentMethod = PaymentEntry["method"];
type PaymentStatus = "unpaid" | "advance" | "partial" | "paid" | "overpaid";

interface OrderViewModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order | null;
}

const OrderViewModal = ({ isOpen, setIsOpen, order }: OrderViewModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const printRef = useRef<HTMLDivElement>(null);

  // ----- order status -----
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [statusLoading, setStatusLoading] = useState(false);

  // ----- add payment form -----
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<PaymentType>("partial");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus((order.status as OrderStatus) || "pending");
      setShowPayForm(false);
      setPayAmount("");
      setPayNote("");
    }
  }, [order]);

  if (!order) return null;

  const paidAmount    = order.paidAmount    ?? 0;
  const advanceAmount = order.advanceAmount ?? 0;
  const dueAmount     = Math.max(0, order.totalAmount - paidAmount);
  const paymentStatus = (order.paymentStatus ?? "unpaid") as PaymentStatus;

  // ---- update order status ----
  const handleUpdateStatus = async () => {
    setStatusLoading(true);
    try {
      await dispatch(updateOrder({ id: order._id, updatedData: { status } })).unwrap();
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setStatusLoading(false);
    }
  };

  // ---- record a payment ----
  const handleAddPayment = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return alert("Enter a valid amount");
    setPayLoading(true);
    try {
      await dispatch(
        addPayment({
          orderId: order._id,
          amount: amt,
          type: payType,
          method: payMethod,
          note: payNote,
        })
      ).unwrap();
      setShowPayForm(false);
      setPayAmount("");
      setPayNote("");
    } catch (e) {
      console.error(e);
    } finally {
      setPayLoading(false);
    }
  };

  // ---- print invoice ----
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice #${order._id.slice(-8).toUpperCase()}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1f2328;padding:20px}
    h2{font-size:20px;font-weight:700;margin-bottom:4px}
    .badge{display:inline-block;padding:2px 10px;border-radius:5px;font-size:11px;font-weight:600;text-transform:capitalize;border:1px solid #e5e7eb}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th{background:#f7f8fa;padding:7px 6px;text-align:left;font-size:12px;border-bottom:2px solid #e5e7eb}
    td{padding:7px 6px;border-bottom:1px solid #f3f4f6;font-size:12px}
    .right{text-align:right}
    .center{text-align:center}
    .summary{background:#f7f8fa;border-radius:8px;padding:14px;margin-bottom:16px}
    .summary-row{display:flex;justify-content:space-between;padding:4px 0}
    .summary-row.total{border-top:1px solid #e5e7eb;padding-top:8px;margin-top:4px;font-weight:700;font-size:14px}
    .due{color:#dc2626}
    .paid{color:#16a34a}
    .advance{color:#7c3aed}
    .section-title{font-size:14px;font-weight:600;margin:16px 0 8px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:12px;color:#374151;margin-bottom:16px}
    .footer{text-align:center;color:#57606a;font-size:11px;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb}
    @media print{body{padding:0} .no-print{display:none}}
  </style>
</head>
<body>
  ${content.innerHTML}
  <div class="footer">System-generated invoice from <strong>SuperMax Panel</strong></div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  // ---- color maps ----
  const statusColors: Record<OrderStatus, string> = {
    pending:    "bg-[color:var(--color-status-pending-bg)] text-[color:var(--color-status-pending-text)] border-[color:var(--color-status-pending-border)]",
    processing: "bg-[color:var(--color-status-processing-bg)] text-[color:var(--color-status-processing-text)] border-[color:var(--color-status-processing-border)]",
    shipped:    "bg-[color:var(--color-status-shipped-bg)] text-[color:var(--color-status-shipped-text)] border-[color:var(--color-status-shipped-border)]",
    delivered:  "bg-[color:var(--color-status-delivered-bg)] text-[color:var(--color-status-delivered-text)] border-[color:var(--color-status-delivered-border)]",
    cancelled:  "bg-[color:var(--color-status-cancelled-bg)] text-[color:var(--color-status-cancelled-text)] border-[color:var(--color-status-cancelled-border)]",
  };

  const paymentStatusColors: Record<PaymentStatus, string> = {
    unpaid:   "bg-[color:var(--color-payment-unpaid-bg)]   text-[color:var(--color-payment-unpaid-text)]   border-[color:var(--color-payment-unpaid-border)]",
    advance:  "bg-[color:var(--color-payment-advance-bg)]  text-[color:var(--color-payment-advance-text)]  border-[color:var(--color-payment-advance-border)]",
    partial:  "bg-[color:var(--color-payment-partial-bg)]  text-[color:var(--color-payment-partial-text)]  border-[color:var(--color-payment-partial-border)]",
    paid:     "bg-[color:var(--color-payment-paid-bg)]     text-[color:var(--color-payment-paid-text)]     border-[color:var(--color-payment-paid-border)]",
    overpaid: "bg-[color:var(--color-payment-overpaid-bg)] text-[color:var(--color-payment-overpaid-text)] border-[color:var(--color-payment-overpaid-border)]",
  };

  return (
    <DialogModal isOpen={isOpen} setIsOpen={setIsOpen} title="Order Details">
      <div className="flex flex-col gap-4 p-2 max-h-[75vh] overflow-y-auto">

        {/* Printable invoice content */}
        <div ref={printRef} style={{ display: "none" }}>
          <h2>Invoice #{order._id.slice(-8).toUpperCase()}</h2>
          <p style={{ fontSize: 12, color: "#57606a", marginBottom: 16 }}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
          <div className="info-grid">
            <div><strong>Customer:</strong> {order.customerName}</div>
            <div><strong>Email:</strong> {order.customerEmail}</div>
            {order.customerMobile && <div><strong>Mobile:</strong> {order.customerMobile}</div>}
            {order.customerAddress && <div><strong>Address:</strong> {order.customerAddress}</div>}
            {order.note && <div><strong>Note:</strong> {order.note}</div>}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Status:</strong>{" "}
            <span className="badge">{order.status}</span>
            {" "}&nbsp;<strong>Payment:</strong>{" "}
            <span className="badge">{order.paymentStatus}</span>
          </div>
          <p className="section-title">Order Items</p>
          <table>
            <thead><tr><th>Product</th><th className="center">Qty</th><th className="right">Unit Price</th><th className="right">Subtotal</th></tr></thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td className="center">{item.quantity}</td>
                  <td className="right">₹{item.price.toFixed(2)}</td>
                  <td className="right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="summary">
            <div className="summary-row"><span>Order Total</span><span>₹ {order.totalAmount.toFixed(2)}</span></div>
            {(order.advanceAmount ?? 0) > 0 && <div className="summary-row"><span>Advance Paid</span><span className="advance">₹ {(order.advanceAmount ?? 0).toFixed(2)}</span></div>}
            <div className="summary-row"><span>Total Paid</span><span className="paid">₹ {(order.paidAmount ?? 0).toFixed(2)}</span></div>
            <div className="summary-row total"><span>Amount Due</span><span className={dueAmount > 0 ? "due" : "paid"}>₹ {dueAmount.toFixed(2)}</span></div>
          </div>
          {order.payments && order.payments.length > 0 && (
            <>
              <p className="section-title">Payment History</p>
              <table>
                <thead><tr><th>Type</th><th>Date</th><th className="right">Amount</th></tr></thead>
                <tbody>
                  {order.payments.map((p, i) => (
                    <tr key={p._id ?? i}>
                      <td style={{ textTransform: "capitalize" }}>{p.type} — {p.method}</td>
                      <td>{new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="right paid">₹ {p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Order ID"  value={order._id} />
          <Info label="Customer"  value={order.customerName} />
          <Info label="Email"     value={order.customerEmail} />
          <Info label="Mobile"    value={order.customerMobile || "-"} />
          <Info label="Address"   value={order.customerAddress || "-"} />
          <Info label="Note"      value={order.note || "-"} />
          <Info label="Order Amount" value={`₹ ${order.totalAmount.toFixed(2)}`} />
        </div>

        {/* Items */}
        <div>
          <h3 className="font-semibold mb-1 text-sm">Items</h3>
          <ul className="ml-4 space-y-1 text-sm list-disc">
            {order.items?.map((item) => (
              <li key={item.productId}>
                <span className="font-medium">{item.name}</span> — Qty: {item.quantity} — ₹{item.price}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Summary */}
        <div className="rounded-xl border p-3 bg-muted/30 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Payment Status</span>
            <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold capitalize ${paymentStatusColors[paymentStatus]}`}>
              {paymentStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-medium">₹ {order.totalAmount.toFixed(2)}</span>
          </div>
          {advanceAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advance Paid</span>
              <span className="text-[var(--amount-advance)] font-medium">₹ {advanceAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="text-[var(--amount-paid)] font-medium">₹ {paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-semibold">Amount Due</span>
            <span className={`font-bold ${dueAmount > 0 ? "text-[var(--amount-due)]" : "text-[var(--amount-paid)]"}`}>
              ₹ {dueAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment History */}
        {order.payments && order.payments.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Payment History</h3>
            <div className="space-y-2">
              {order.payments.map((p, i) => (
                <div key={p._id ?? i} className="flex justify-between items-center text-xs rounded-lg border px-3 py-2 bg-muted/20">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium capitalize">{p.type} — {p.method}</span>
                    {p.note && <span className="text-muted-foreground">{p.note}</span>}
                    <span className="text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <span className="font-bold text-[var(--amount-paid)]">₹ {p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Payment form (toggle) */}
        {paymentStatus !== "paid" && paymentStatus !== "overpaid" && (
          <div>
            {!showPayForm ? (
              <Button className="w-full" onClick={() => setShowPayForm(true)}>
                + Add Payment
              </Button>
            ) : (
              <div className="border rounded-xl p-3 space-y-3 bg-muted/20">
                <p className="font-semibold text-sm">Record Payment</p>
                <div className="flex gap-2">
                  <FloatingInput
                    label="Amount"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <div className="flex-1">
                    <Select
                      value={payType}
                      onChange={(v) => setPayType(v as PaymentType)}
                      options={[
                        { label: "Partial",     value: "partial"     },
                        { label: "Installment", value: "installment" },
                        { label: "Full",        value: "full"        },
                        { label: "Advance",     value: "advance"     },
                      ]}
                      className="max-w-full"
                    />
                  </div>
                </div>
                <Select
                  value={payMethod}
                  onChange={(v) => setPayMethod(v as PaymentMethod)}
                  options={[
                    { label: "Cash",  value: "cash"  },
                    { label: "UPI",   value: "upi"   },
                    { label: "Bank",  value: "bank"  },
                    { label: "Other", value: "other" },
                  ]}
                  className="max-w-full"
                />
                <FloatingInput
                  label="Note (optional)"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setShowPayForm(false)}>Cancel</Button>
                  <Button onClick={handleAddPayment} disabled={payLoading}>
                    {payLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Payment"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Status */}
        <div className="border-t pt-4">
          <label className="font-semibold text-sm mb-1 block">Order Status</label>
          <Select
            value={status}
            onChange={(value) => setStatus(value as OrderStatus)}
            options={[
              { label: "Pending",    value: "pending"    },
              { label: "Processing", value: "processing" },
              { label: "Shipped",    value: "shipped"    },
              { label: "Delivered",  value: "delivered"  },
              { label: "Cancelled",  value: "cancelled"  },
            ]}
            className={`w-full capitalize rounded-md py-2 ${statusColors[status]}`}
            placeholder="Select status"
          />
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between gap-3 pt-2">
          <Button onClick={handlePrint} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            Print Invoice
          </Button>
          <div className="flex gap-3">
            <Button onClick={() => setIsOpen(false)}>Close</Button>
            <Button onClick={handleUpdateStatus} disabled={statusLoading}>
              {statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Status"}
            </Button>
          </div>
        </div>

      </div>
    </DialogModal>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-sm text-muted-foreground">{label}</span>
      <span className="text-[15px] break-all">{value}</span>
    </div>
  );
};

export default OrderViewModal;
