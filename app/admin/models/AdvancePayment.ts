import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAdvancePayment extends Document {
  userId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  type: "ADVANCE" | "SALARY_PAYMENT";
  amount: number;
  note?: string;
  date: Date;
}

const advancePaymentSchema = new Schema<IAdvancePayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    type: {
      type: String,
      enum: ["ADVANCE", "SALARY_PAYMENT"],
      required: true,
    },
    amount: { type: Number, required: true },
    note: { type: String },
    date: { type: Date, required: true },
  },
  { timestamps: true },
);

advancePaymentSchema.index({ employee: 1, date: -1 });

const AdvancePayment =
  models.AdvancePayment || model<IAdvancePayment>("AdvancePayment", advancePaymentSchema);

export default AdvancePayment;
