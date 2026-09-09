"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import WorkEntry, { IWorkEntry } from "../../admin/models/WorkEntry";
import Employee from "../../admin/models/Employee";
import { getSessionUser } from "@/lib/session";

// ---------------- GET WORK ENTRIES ----------------
const getWorkEntries = async (req: NextRequest) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const url = req.nextUrl;
    const employeeId = url.searchParams.get("employeeId");
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 5);
    const search = url.searchParams.get("search") || "";
    const month = url.searchParams.get("month"); // "1"–"12"
    const year = url.searchParams.get("year"); // "2026"

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json({ success: false, message: "Invalid employee id" }, { status: 400 });
    }

    /* ---- base query ---- */
    const query: Record<string, unknown> = { employee: employeeId, userId };

    /* ---- month filter — set date range first, never conflicts with search ---- */
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    /* ---- search by quantity or amount (numeric fields) ---- */
    if (search.trim()) {
      const num = Number(search.trim());
      if (!isNaN(num)) {
        query.$or = [{ quantity: num }, { amount: num }];
      }
    }

    /* ---- aggregate query must use ObjectId — separate from paginated query ---- */
    const aggMatch: Record<string, unknown> = {
      employee: new mongoose.Types.ObjectId(employeeId),
      userId: new mongoose.Types.ObjectId(userId),
      status: "WORK",
    };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      aggMatch.date = { $gte: start, $lte: end };
    }

    const [total, entries, amountAgg] = await Promise.all([
      WorkEntry.countDocuments(query),
      WorkEntry.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<IWorkEntry[]>(),
      /* sum work-entry amounts for selected month (or all) using proper ObjectIds */
      WorkEntry.aggregate([
        { $match: aggMatch },
        { $group: { _id: null, totalWorkAmount: { $sum: "$amount" } } },
      ]),
    ]);

    const totalWorkAmount = amountAgg[0]?.totalWorkAmount ?? 0;

    return NextResponse.json({ success: true, entries, total, page, limit, totalWorkAmount });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: (error as Error)?.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
};

// ---------------- CREATE WORK ENTRY ----------------
const createWorkEntry = async (req: NextRequest) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();
    const body = await req.json();

    const entry = await WorkEntry.create({ ...body, userId });

    await Employee.findByIdAndUpdate(body.employee, {
      $push: { workEntries: entry._id },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: "Unknown error occurred" }, { status: 500 });
  }
};

export { getWorkEntries as GET, createWorkEntry as POST };
