"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Order, { IOrder } from "@/app/admin/models/Order";
import Product from "@/app/admin/models/Product";
import { getSessionUser } from "@/lib/session";
import { sendInvoiceEmail } from "@/lib/mailer";

interface Params {
  id: string;
}

// -------- PUT /api/order/[id]  — update order status --------
const updatedOrder = async (
  req: NextRequest,
  context: { params: Promise<Params> }
) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const { id } = await context.params;
    const data = await req.json();

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (data.status && !validStatuses.includes(data.status)) {
      return NextResponse.json(
        { success: false, message: "Invalid order status" },
        { status: 400 }
      );
    }

    const existingOrder = await Order.findOne({ _id: id, userId });
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const prevStatus = existingOrder.status;
    const newStatus = data.status;

    // Cancel → restore stock
    if (prevStatus !== "cancelled" && newStatus === "cancelled") {
      for (const item of existingOrder.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    // Re-activate cancelled order → reduce stock again
    if (prevStatus === "cancelled" && newStatus !== "cancelled") {
      for (const item of existingOrder.items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { message: `${product.name} does not have enough stock` },
            { status: 400 }
          );
        }
        product.stock -= item.quantity;
        await product.save();
      }
    }

    const updated = await Order.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true }
    );

    if (updated && data.status) {
      const changeNote = `Order status has been updated to <strong style="text-transform:capitalize;">${data.status}</strong>.`;
      sendInvoiceEmail("status_update", updated as IOrder & { _id: string }, changeNote);
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

export { updatedOrder as PUT };
