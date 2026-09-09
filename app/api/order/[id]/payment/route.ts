"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Order, { IOrder } from "@/app/admin/models/Order";
import { getSessionUser } from "@/lib/session";
import { sendInvoiceEmail } from "@/lib/mailer";

interface Params {
  id: string;
}

function computePaymentStatus(
  paid: number,
  total: number,
  hasNonAdvance: boolean
): "unpaid" | "advance" | "partial" | "paid" | "overpaid" {
  if (paid <= 0)      return "unpaid";
  if (paid > total)   return "overpaid";
  if (paid >= total)  return "paid";
  if (!hasNonAdvance) return "advance";
  return "partial";
}

// POST /api/order/[id]/payment
const addPayment = async (
  req: NextRequest,
  context: { params: Promise<Params> }
) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const { id } = await context.params;
    const { amount, type, method, note } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    const validTypes   = ["advance", "partial", "installment", "full"];
    const validMethods = ["cash", "upi", "bank", "other"];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: "Invalid payment type" }, { status: 400 });
    }
    if (method && !validMethods.includes(method)) {
      return NextResponse.json({ success: false, message: "Invalid payment method" }, { status: 400 });
    }

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    order.payments.push({
      amount,
      type,
      method: method || "cash",
      note: note || "",
      date: new Date(),
    });

    order.paidAmount += amount;

    const hasNonAdvance = order.payments.some((p: { type: string }) => p.type !== "advance");
    order.paymentStatus = computePaymentStatus(
      order.paidAmount,
      order.totalAmount,
      hasNonAdvance
    );

    await order.save();

    // Send payment-received invoice email (non-blocking)
    const changeNote = `A payment of <strong>&#8377; ${amount.toFixed ? amount.toFixed(2) : amount}</strong> (${type} via ${method || "cash"}) has been recorded on your order.`;
    sendInvoiceEmail("payment_added", order as IOrder & { _id: string }, changeNote);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

export { addPayment as POST };
