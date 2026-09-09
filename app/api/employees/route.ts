"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose, { FilterQuery } from "mongoose";
import Employee, { IEmployee } from "../../admin/models/Employee";
import AdvancePayment from "../../admin/models/AdvancePayment";
import "@/app/admin/models/WorkEntry";
import { getSessionUser } from "@/lib/session";

// ---------------- GET ALL / SINGLE EMPLOYEE ----------------
const getEmployees = async (req: NextRequest) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const url = req.nextUrl;
    const id = url.searchParams.get("id");
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "10");

    if (id && mongoose.Types.ObjectId.isValid(id)) {
      const employee = await Employee.findOne({ _id: id, userId }).populate("workEntries").lean();

      if (!employee) {
        return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, employee });
    }

    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid employee id" }, { status: 400 });
    }

    const query: FilterQuery<IEmployee> = { userId };

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      Employee.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Employee.countDocuments(query),
    ]);

    /* ---- sync advancePayment / paidPayment from AdvancePayment collection ---- */
    const employeeIds = employees.map((e) => e._id);
    const totalsAgg = await AdvancePayment.aggregate([
      { $match: { employee: { $in: employeeIds }, userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$employee",
          advancePayment: { $sum: { $cond: [{ $eq: ["$type", "ADVANCE"] }, "$amount", 0] } },
          paidPayment:    { $sum: { $cond: [{ $eq: ["$type", "SALARY_PAYMENT"] }, "$amount", 0] } },
        },
      },
    ]);

    const totalsMap = new Map(totalsAgg.map((t) => [String(t._id), t]));
    const syncedEmployees = employees.map((emp) => {
      const t = totalsMap.get(String(emp._id));
      return {
        ...emp,
        advancePayment: t?.advancePayment ?? 0,
        paidPayment:    t?.paidPayment    ?? 0,
      };
    });

    return NextResponse.json({ success: true, employees: syncedEmployees, total, page, limit });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: "Unknown error occurred" }, { status: 500 });
  }
};

// ---------------- CREATE EMPLOYEE ----------------
const createEmployee = async (req: NextRequest) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();
    const body = await req.json();

    const employee = await Employee.create({ ...body, userId });

    return NextResponse.json({ success: true, employee });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: "Unknown error occurred" }, { status: 500 });
  }
};

export { getEmployees as GET, createEmployee as POST };
