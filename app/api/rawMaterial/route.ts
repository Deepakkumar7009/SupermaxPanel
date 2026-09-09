"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose, { FilterQuery } from "mongoose";
import RawMaterial, { IRawMaterial } from "../../admin/models/RawMaterial";
import { getSessionUser } from "@/lib/session";

const getRawMaterials = async (req: NextRequest) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const url = req.nextUrl;
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "5");
    const status = url.searchParams.get("status") as "pending" | "paid" | undefined;
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const query: FilterQuery<IRawMaterial> = { userId: userObjectId };

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ shopName: regex }, { materialName: regex }, { buyerName: regex }, { status: regex }];
    }

    if (status) query.status = status;

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const skip = (page - 1) * limit;

    const [materials, total] = await Promise.all([
      RawMaterial.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RawMaterial.countDocuments(query),
    ]);

    const totals = await RawMaterial.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          pendingAmount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
          paidAmount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
        },
      },
    ]);

    const totalsData = totals[0] || { totalAmount: 0, pendingAmount: 0, paidAmount: 0 };

    return NextResponse.json({ success: true, materials, total, page, limit, ...totalsData });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

const createRawMaterial = async (req: NextRequest) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();
    const body = await req.json();
    const material = await RawMaterial.create({ ...body, userId });
    return NextResponse.json({ success: true, material });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

export { getRawMaterials as GET, createRawMaterial as POST };
