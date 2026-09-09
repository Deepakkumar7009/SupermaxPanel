"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import AdvancePayment from "@/app/admin/models/AdvancePayment";
import Employee from "@/app/admin/models/Employee";
import { getSessionUser } from "@/lib/session";

interface Params {
  id: string;
}

/* ================= GET — payment history + running balance ================= */
const getAdvancePayments = async (
  req: NextRequest,
  context: { params: Promise<Params> },
) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid employee id" }, { status: 400 });
    }

    const month = req.nextUrl.searchParams.get("month"); // "1"–"12"
    const year = req.nextUrl.searchParams.get("year"); // "2026"
    const page = Number(req.nextUrl.searchParams.get("page") || 1);
    const limit = Number(req.nextUrl.searchParams.get("limit") || 5);

    /* ---- build query — filter by month if provided ---- */
    const query: Record<string, unknown> = { employee: id, userId };
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    /* ---- paginated payments for history table ---- */
    /* ---- all-time totals (no month filter) — always matches employee list ---- */
    const allTimeQuery: Record<string, unknown> = { employee: id, userId };

    const [total, payments, allTimePayments] = await Promise.all([
      AdvancePayment.countDocuments(query),
      AdvancePayment.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdvancePayment.find(allTimeQuery).lean(),
    ]);

    /* ---- filtered totals (for payment history table) ---- */
    const filteredDocs = await AdvancePayment.find(query).lean();
    const totalAdvance = filteredDocs.filter((p) => p.type === "ADVANCE").reduce((s, p) => s + p.amount, 0);
    const totalSalaryPaid = filteredDocs.filter((p) => p.type === "SALARY_PAYMENT").reduce((s, p) => s + p.amount, 0);
    const balance = totalAdvance - totalSalaryPaid;

    /* ---- all-time totals (always unfiltered — same source as employee list) ---- */
    const allTimeAdvance = allTimePayments.filter((p) => p.type === "ADVANCE").reduce((s, p) => s + p.amount, 0);
    const allTimeSalaryPaid = allTimePayments.filter((p) => p.type === "SALARY_PAYMENT").reduce((s, p) => s + p.amount, 0);
    const allTimeBalance = allTimeAdvance - allTimeSalaryPaid;

    /* ---- sync employee counters so list page matches ---- */
    await Employee.findOneAndUpdate(
      { _id: id, userId },
      { advancePayment: allTimeAdvance, paidPayment: allTimeSalaryPaid },
    );

    return NextResponse.json({
      success: true, payments, total, page, limit,
      totalAdvance, totalSalaryPaid, balance,
      allTimeAdvance, allTimeSalaryPaid, allTimeBalance,
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
};

/* ================= POST — add advance OR salary payment ================= */
const addAdvancePayment = async (
  req: NextRequest,
  context: { params: Promise<Params> },
) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid employee id" }, { status: 400 });
    }

    const body = await req.json();
    const { type, amount, note, date } = body as {
      type: "ADVANCE" | "SALARY_PAYMENT";
      amount: number;
      note?: string;
      date: string;
    };

    if (!type || !amount || !date) {
      return NextResponse.json({ success: false, message: "type, amount and date are required" }, { status: 400 });
    }

    /* ---- save the payment record ---- */
    const payment = await AdvancePayment.create({ userId, employee: id, type, amount, note, date });

    /* ---- update the employee running totals ---- */
    const updateField = type === "ADVANCE"
      ? { $inc: { advancePayment: amount } }
      : { $inc: { paidPayment: amount } };

    await Employee.findOneAndUpdate({ _id: id, userId }, updateField);

    /* ---- return fresh balance ---- */
    const allPayments = await AdvancePayment.find({ employee: id, userId }).lean();

    const totalAdvance = allPayments.filter((p) => p.type === "ADVANCE").reduce((s, p) => s + p.amount, 0);
    const totalSalaryPaid = allPayments.filter((p) => p.type === "SALARY_PAYMENT").reduce((s, p) => s + p.amount, 0);
    const balance = totalAdvance - totalSalaryPaid;

    return NextResponse.json({ success: true, payment, totalAdvance, totalSalaryPaid, balance });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
};

export { getAdvancePayments as GET, addAdvancePayment as POST };
