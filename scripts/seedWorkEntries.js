/**
 * Seed Work Entries — SupermaxPanel
 * Usage:  node scripts/seedWorkEntries.js
 *
 * Adds 30 days of work entries (WORK + WORK_OFF) for every employee
 * belonging to the superadmin account.
 * Does NOT touch any other collection.
 *
 * Safe to re-run — skips dates that already have an entry (unique index).
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/supermax";

const { Schema, model, models } = mongoose;
const ObjectId = Schema.Types.ObjectId;

/* ─── Minimal schema definitions ─── */
const Admin = models.Admin || model("Admin", new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  role:  { type: String },
}, { timestamps: true }));

const Employee = models.Employee || model("Employee", new Schema({
  userId:      { type: ObjectId, ref: "Admin", required: true },
  name:        { type: String },
  workEntries: [{ type: ObjectId, ref: "WorkEntry" }],
}, { timestamps: true }));

const WorkEntry = models.WorkEntry || model("WorkEntry", new Schema({
  userId:   { type: ObjectId, ref: "Admin",    required: true },
  employee: { type: ObjectId, ref: "Employee", required: true },
  date:     { type: Date,   required: true },
  quantity: Number,
  amount:   Number,
  status:   { type: String, enum: ["WORK", "WORK_OFF"], default: "WORK" },
}, { timestamps: true }));

/* ─── Helpers ─── */
const rand     = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const midnight = (d) => { const dt = new Date(d); dt.setHours(0, 0, 0, 0); return dt; };

async function seedWorkEntries() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected →", MONGO_URI);

  /* find the superadmin */
  const admin = await Admin.findOne({ role: "superadmin" });
  if (!admin) {
    console.error("❌ No superadmin found. Run the main seed first.");
    process.exit(1);
  }
  console.log(`👤 Superadmin → ${admin.email}`);

  const employees = await Employee.find({ userId: admin._id });
  if (!employees.length) {
    console.error("❌ No employees found for this admin. Run the main seed first.");
    process.exit(1);
  }
  console.log(`👷 Employees found → ${employees.length}`);

  const today = midnight(new Date());
  let inserted = 0;
  let skipped  = 0;

  for (const emp of employees) {
    console.log(`\n  📋 ${emp.name}`);

    for (let i = 29; i >= 0; i--) {
      const date = midnight(new Date(today.getTime() - i * 86_400_000));

      /* skip if entry already exists for this employee+date */
      const exists = await WorkEntry.findOne({ employee: emp._id, date });
      if (exists) { skipped++; continue; }

      /* realistic pattern:
         - Sundays (day 0) → WORK_OFF
         - 1 in 6 weekdays  → WORK_OFF  (random day off)
         - rest             → WORK with quantity + amount  */
      const isSunday  = date.getDay() === 0;
      const isRandOff = !isSunday && Math.random() < 0.15;
      const isWorkOff = isSunday || isRandOff;

      const entry = await WorkEntry.create({
        userId:   admin._id,
        employee: emp._id,
        date,
        status:   isWorkOff ? "WORK_OFF" : "WORK",
        quantity: isWorkOff ? undefined : rand(20, 80),
        amount:   isWorkOff ? undefined : rand(150, 900),
      });

      await Employee.findByIdAndUpdate(emp._id, {
        $push: { workEntries: entry._id },
      });

      console.log(
        `    ${date.toDateString().slice(0, 10)}  →  ${isWorkOff ? "🔴 WORK_OFF" : `🟢 WORK  qty:${entry.quantity}  ₹${entry.amount}`}`,
      );
      inserted++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Done!  inserted: ${inserted}  skipped (already existed): ${skipped}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seedWorkEntries().catch((err) => {
  console.error("❌ Failed:", err.message || err);
  mongoose.disconnect();
  process.exit(1);
});
