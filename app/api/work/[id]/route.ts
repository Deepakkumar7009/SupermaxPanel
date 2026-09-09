"use server";

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import WorkEntry from "@/app/admin/models/WorkEntry";
import { getSessionUser } from "@/lib/session";

interface Params {
  id: string;
}

/* ================= UPDATE WORK ENTRY ================= */
const updateWorkEntry = async (
  req: NextRequest,
  context: { params: Promise<Params> },
) => {
  try {
    const { userId, error } = await getSessionUser();
    if (error) return error;

    await connectToDatabase();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid work entry id" }, { status: 400 });
    }

    const { date, quantity, amount } = await req.json() as {
      date: string;
      quantity?: number;
      amount?: number;
    };

    /* if quantity or amount is provided → WORK, otherwise stay WORK_OFF */
    const hasWork = quantity != null || amount != null;
    const status = hasWork ? "WORK" : "WORK_OFF";

    /* build update — $set filled fields, $unset cleared ones */
    const $set: Record<string, unknown> = { date, status };
    const $unset: Record<string, unknown> = {};

    if (quantity != null) $set.quantity = quantity; else $unset.quantity = "";
    if (amount != null) $set.amount = amount; else $unset.amount = "";

    const entry = await WorkEntry.findOneAndUpdate(
      { _id: id, userId },
      { $set, ...( Object.keys($unset).length ? { $unset } : {}) },
      { new: true },
    );

    if (!entry) {
      return NextResponse.json({ success: false, message: "Work entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
};

export { updateWorkEntry as PUT };
