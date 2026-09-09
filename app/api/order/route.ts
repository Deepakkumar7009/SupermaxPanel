"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose, { FilterQuery } from "mongoose";
import Order, { IOrder } from "../../admin/models/Order";
import Customer from "../../admin/models/Customer";
import Product from "../../admin/models/Product";
import { getSessionUser } from "@/lib/session";
import { sendInvoiceEmail } from "@/lib/mailer";

// ---------------- CREATE ORDER ----------------
const createOrder = async (req: NextRequest) => {
  const { userId, error } = await getSessionUser();
  if (error) return error;

  await connectToDatabase();

  try {
    const data = await req.json();

    if (!data.customerName || !data.totalAmount || !Array.isArray(data.items)) {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    // Find or create customer scoped to this user
    // Try email first, then phone, to avoid duplicate key errors
    let customer =
      (data.customerEmail
        ? await Customer.findOne({ email: data.customerEmail.toLowerCase(), userId })
        : null) ??
      (data.customerMobile
        ? await Customer.findOne({ phone: data.customerMobile, userId })
        : null);

    if (!customer) {
      customer = await Customer.create({
        userId,
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerMobile,
        orders: [],
      });
    }

    // Validate & deduct product stock
    for (const item of data.items) {
      const productId = item.productId || item.product?._id || item.product || null;
      const qty = item.quantity || item.qty || 0;

      if (!productId) {
        return NextResponse.json({ success: false, message: "Product ID missing in order item" }, { status: 400 });
      }

      const product = await Product.findOne({ _id: productId, userId });

      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
      }

      if (product.stock < qty) {
        return NextResponse.json({ success: false, message: `${product.name} has insufficient stock` }, { status: 400 });
      }

      product.stock -= qty;
      await product.save();
    }

    // Compute paymentStatus helper
    const computePaymentStatus = (paid: number, total: number, allAdvance: boolean) => {
      if (paid <= 0)       return "unpaid";
      if (paid > total)    return "overpaid";
      if (paid === total)  return "paid";
      if (allAdvance)      return "advance";
      return "partial";
    };

    const advanceAmount = Number(data.advanceAmount) || 0;
    const advanceMethod = data.advanceMethod || "cash";

    const orderData: Record<string, unknown> = {
      ...data,
      userId,
      paidAmount: advanceAmount,
      advanceAmount,
      payments: [],
    };

    if (advanceAmount > 0) {
      orderData.payments = [
        {
          amount: advanceAmount,
          type: "advance",
          method: advanceMethod,
          note: "Advance at order creation",
          date: new Date(),
        },
      ];
      orderData.paymentStatus = computePaymentStatus(advanceAmount, data.totalAmount, true);
    } else {
      orderData.paymentStatus = "unpaid";
    }

    const newOrder = await Order.create(orderData);

    customer.orders.push(newOrder._id);
    await customer.save();

    // Send order-placed invoice email (non-blocking)
    sendInvoiceEmail("order_placed", newOrder as IOrder & { _id: string });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};

// ---------------- GET ALL / SINGLE ORDER ----------------
const getOrders = async (req: NextRequest) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const url = req.nextUrl;
    const id = url.searchParams.get("id");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "10");

    if (id) {
      const order = await Order.findOne({ _id: id, userId }).populate("items.product");
      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const query: FilterQuery<IOrder> = { userId };
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ customerName: regex }, { customerEmail: regex }];
    }

    const skip = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const baseQuery: FilterQuery<IOrder> = { userId: userObjectId };
    if (search) {
      const regex = new RegExp(search, "i");
      baseQuery.$or = [{ customerName: regex }, { customerEmail: regex }];
    }

    const [orders, total, amountAgg] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
      Order.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            totalOrderAmount:   { $sum: "$totalAmount" },
            totalReceivedAmount: { $sum: "$paidAmount" },
            totalPendingAmount: {
              $sum: { $subtract: ["$totalAmount", "$paidAmount"] },
            },
          },
        },
      ]),
    ]);

    const totals = amountAgg[0] ?? { totalOrderAmount: 0, totalReceivedAmount: 0, totalPendingAmount: 0 };

    return NextResponse.json({
      success: true,
      orders,
      total,
      page,
      limit,
      totalOrderAmount: totals.totalOrderAmount,
      totalReceivedAmount: totals.totalReceivedAmount,
      totalPendingAmount: totals.totalPendingAmount,
    });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Unknown error occurred" }, { status: 500 });
  }
};

export { createOrder as POST, getOrders as GET };
