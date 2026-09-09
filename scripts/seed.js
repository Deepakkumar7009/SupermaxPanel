/**
 * Seed Script — SupermaxPanel
 * Usage:  npm run seed
 *
 * Populates every collection with realistic dummy data for one superadmin.
 * Clears that user's existing seed data first, then re-inserts.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/supermax";

/* ─── Inline schema definitions (avoids TS import issues) ─── */
const { Schema, model, models } = mongoose;

const ObjectId = Schema.Types.ObjectId;

const Admin = models.Admin || model("Admin", new Schema({
  name:      { type: String, default: "" },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["superadmin", "user"], default: "user" },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: ObjectId, ref: "Admin", default: null },
}, { timestamps: true }));

const Category = models.Category || model("Category", new Schema({
  userId:      { type: ObjectId, ref: "Admin", required: true },
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  description: String,
  parent:      { type: ObjectId, ref: "Category", default: null },
  level:       { type: Number, default: 0 },
  ancestors:   [{ _id: ObjectId, name: String, slug: String }],
  isActive:    { type: Boolean, default: true },
}, { timestamps: true }));

const Product = models.Product || model("Product", new Schema({
  userId:      { type: ObjectId, ref: "Admin", required: true },
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  description: String,
  categories:  [{ type: ObjectId, ref: "Category" }],
  price:       { type: Number, required: true },
  discount:    { type: Number, default: 0 },
  finalPrice:  { type: Number, required: true },
  stock:       { type: Number, default: 0 },
  sku:         { type: String, required: true, unique: true },
  brand:       String,
  tags:        [String],
  isFeatured:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true }));

const Customer = models.Customer || model("Customer", new Schema({
  userId: { type: ObjectId, ref: "Admin", required: true },
  name:   { type: String, required: true },
  email:  { type: String, required: true },
  phone:  { type: String, required: true },
  orders: [{ type: ObjectId, ref: "Order" }],
}, { timestamps: true }));

const Order = models.Order || model("Order", new Schema({
  userId:          { type: ObjectId, ref: "Admin", required: true },
  customerName:    { type: String, required: true },
  customerEmail:   { type: String, required: true },
  customerMobile:  String,
  customerAddress: String,
  note:            String,
  items: [{
    productId: { type: ObjectId, ref: "Product" },
    name:      String,
    quantity:  Number,
    price:     Number,
  }],
  totalAmount:   { type: Number, required: true },
  status:        { type: String, enum: ["pending","processing","shipped","delivered","cancelled"], default: "pending" },
  paidAmount:    { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["unpaid","advance","partial","paid","overpaid"], default: "unpaid" },
  payments: [{
    amount: Number,
    type:   { type: String, enum: ["advance","partial","installment","full"] },
    method: { type: String, enum: ["cash","upi","bank","other"], default: "cash" },
    note:   String,
    date:   { type: Date, default: Date.now },
  }],
}, { timestamps: true }));

const Employee = models.Employee || model("Employee", new Schema({
  userId:         { type: ObjectId, ref: "Admin", required: true },
  name:           { type: String, required: true },
  email:          { type: String, required: true },
  phone:          { type: String, required: true },
  address:        String,
  advancePayment: { type: Number, default: 0 },
  paidPayment:    { type: Number, default: 0 },
  workEntries:    [{ type: ObjectId, ref: "WorkEntry" }],
}, { timestamps: true }));

const WorkEntry = models.WorkEntry || model("WorkEntry", new Schema({
  userId:   { type: ObjectId, ref: "Admin", required: true },
  employee: { type: ObjectId, ref: "Employee", required: true },
  date:     { type: Date, required: true },
  quantity: Number,
  amount:   Number,
  status:   { type: String, enum: ["WORK","WORK_OFF"], default: "WORK" },
}, { timestamps: true }));

const FactoryExpense = models.FactoryExpense || model("FactoryExpense", new Schema({
  userId:      { type: ObjectId, ref: "Admin", required: true },
  name:        { type: String, required: true },
  amount:      { type: Number, required: true },
  entryDate:   { type: Date, required: true },
  entryPerson: { type: String, required: true },
  quantity:    { type: Number, required: true },
  shopName:    { type: String, required: true },
  status:      { type: String, enum: ["pending","paid"], default: "pending" },
}, { timestamps: true }));

const RawMaterial = models.RawMaterial || model("RawMaterial", new Schema({
  userId:       { type: ObjectId, ref: "Admin", required: true },
  shopName:     { type: String, required: true },
  materialName: { type: String, required: true },
  quantity:     { type: Number, required: true },
  buyerName:    { type: String, required: true },
  amount:       { type: Number, required: true },
  date:         { type: Date, default: Date.now },
  status:       { type: String, enum: ["pending","paid"], default: "pending" },
}, { timestamps: true }));

/* ─── Helpers ─── */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);
const thisMonth = () => {
  const d = new Date();
  d.setDate(rand(1, 28));
  d.setHours(rand(8, 18), rand(0, 59), 0, 0);
  return d;
};

/* ─── Main ─── */
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected →", MONGO_URI);

  /* 1. ADMIN */
  let admin = await Admin.findOne({ email: "seed@supermax.com" });
  if (!admin) {
    const hashed = await bcrypt.hash("Admin@1234", 10);
    admin = await Admin.create({ name: "Deepak Verma", email: "superadmin@business.com", password: hashed, role: "superadmin", isActive: true });
    console.log("👤 Admin created  →  superadmin@business.com / Admin@1234");
  } else {
    console.log("👤 Admin found    →  superadmin@business.com");
  }
  const userId = admin._id;

  /* 2. CATEGORIES */
  await Category.deleteMany({ userId });
  const catDefs = ["Fabric", "Hardware", "Accessories"];
  const subDefs = { Fabric: ["Cotton","Polyester"], Hardware: ["Bolts","Nuts"], Accessories: ["Buttons","Zippers"] };
  const rootCats = [];
  for (const name of catDefs) {
    const slug = name.toLowerCase() + "-" + userId.toString().slice(-4);
    const cat = await Category.create({ userId, name, slug, description: `${name} category`, level: 0, ancestors: [], isActive: true });
    rootCats.push(cat);
    for (const sub of subDefs[name]) {
      await Category.create({ userId, name: sub, slug: `${slug}-${sub.toLowerCase()}`, parent: cat._id, level: 1, ancestors: [{ _id: cat._id, name, slug }], isActive: true });
    }
  }
  console.log(`🗂  Categories     →  ${catDefs.length} root + 6 sub`);

  /* 3. PRODUCTS */
  await Product.deleteMany({ userId });
  const productDefs = [
    { name: "Cotton Roll 100m",    price: 1200, stock: 50,  brand: "TextileCo" },
    { name: "Polyester Fabric",    price: 850,  stock: 30,  brand: "FabriX"    },
    { name: "Steel Bolt M8",       price: 15,   stock: 500, brand: "BoltMart"  },
    { name: "Hex Nut M8",          price: 8,    stock: 600, brand: "BoltMart"  },
    { name: "Plastic Button 20mm", price: 3,    stock: 2000,brand: "AccCo"     },
    { name: "Metal Zipper 30cm",   price: 25,   stock: 400, brand: "ZipFast"   },
    { name: "Cotton Thread 500m",  price: 180,  stock: 80,  brand: "TextileCo" },
    { name: "Rubber Gasket",       price: 45,   stock: 150, brand: "SealPro"   },
    { name: "Fabric Dye Blue",     price: 320,  stock: 60,  brand: "ColorMax"  },
    { name: "Fabric Dye Red",      price: 310,  stock: 3,   brand: "ColorMax"  },
    { name: "Sewing Needle Pack",  price: 60,   stock: 200, brand: "NeedleX"   },
    { name: "Elastic Band 2cm",    price: 90,   stock: 5,   brand: "ElastiCo"  },
  ];
  const products = [];
  for (let i = 0; i < productDefs.length; i++) {
    const d      = productDefs[i];
    const disc   = pick([0, 5, 10]);
    const final  = d.price - (d.price * disc) / 100;
    const p = await Product.create({
      userId,
      name: d.name,
      slug: d.name.toLowerCase().replace(/\s+/g, "-") + "-" + userId.toString().slice(-4),
      description: `High quality ${d.name}.`,
      categories: [rootCats[i % rootCats.length]._id],
      price: d.price, discount: disc, finalPrice: final,
      stock: d.stock, sku: `SKU-${String(i+1).padStart(4,"0")}`,
      brand: d.brand, tags: [d.brand.toLowerCase(), "factory"],
      isFeatured: i < 3, isActive: true,
    });
    products.push(p);
  }
  console.log(`📦 Products       →  ${products.length}`);

  /* 4. CUSTOMERS */
  await Customer.deleteMany({ userId });
  const customerDefs = [
    { name: "Arjun Sharma",  email: "arjun.sharma@example.com",  phone: "9876543210" },
    { name: "Priya Patel",   email: "priya.patel@example.com",   phone: "9876543211" },
    { name: "Ravi Kumar",    email: "ravi.kumar@example.com",    phone: "9876543212" },
    { name: "Sneha Gupta",   email: "sneha.gupta@example.com",   phone: "9876543213" },
    { name: "Amit Verma",    email: "amit.verma@example.com",    phone: "9876543214" },
    { name: "Nisha Singh",   email: "nisha.singh@example.com",   phone: "9876543215" },
    { name: "Deepak Joshi",  email: "deepak.joshi@example.com",  phone: "9876543216" },
    { name: "Kavita Mehta",  email: "kavita.mehta@example.com",  phone: "9876543217" },
  ];
  const customers = [];
  for (const def of customerDefs) {
    customers.push(await Customer.create({ userId, ...def, orders: [] }));
  }
  console.log(`👥 Customers      →  ${customers.length}`);

  /* 5. ORDERS */
  await Order.deleteMany({ userId });
  const orderStatuses   = ["pending","processing","shipped","delivered","cancelled"];
  const paymentMethods  = ["cash","upi","bank","other"];
  const paymentTypes    = ["advance","partial","full"];
  for (let i = 0; i < 15; i++) {
    const cust   = pick(customers);
    const items  = Array.from({ length: rand(1,3) }, () => {
      const p = pick(products);
      return { productId: p._id, name: p.name, quantity: rand(1,5), price: p.finalPrice };
    });
    const total  = items.reduce((s, it) => s + it.quantity * it.price, 0);
    const paid   = pick([0, Math.floor(total*0.3), Math.floor(total*0.7), total]);
    const payStatus = paid === 0 ? "unpaid" : paid < total ? "partial" : "paid";
    const payments  = paid > 0 ? [{ amount: paid, type: pick(paymentTypes), method: pick(paymentMethods), date: daysAgo(rand(0,30)) }] : [];
    const order = await Order.create({
      userId, customerName: cust.name, customerEmail: cust.email,
      customerMobile: cust.phone, customerAddress: `${rand(1,99)} MG Road, Surat`,
      items, totalAmount: total, status: pick(orderStatuses),
      paidAmount: paid, advanceAmount: 0, paymentStatus: payStatus, payments,
    });
    await Customer.findByIdAndUpdate(cust._id, { $push: { orders: order._id } });
  }
  console.log(`🛒 Orders         →  15`);

  /* 6. EMPLOYEES */
  await Employee.deleteMany({ userId });
  const employeeDefs = [
    { name: "Ramesh Yadav",  email: "ramesh.yadav@factory.com",  phone: "8800001111" },
    { name: "Suresh Patel",  email: "suresh.patel@factory.com",  phone: "8800002222" },
    { name: "Geeta Bai",     email: "geeta.bai@factory.com",     phone: "8800003333" },
    { name: "Mahesh Thakur", email: "mahesh.thakur@factory.com", phone: "8800004444" },
    { name: "Lalita Kumari", email: "lalita.kumari@factory.com", phone: "8800005555" },
    { name: "Vinod Chauhan", email: "vinod.chauhan@factory.com", phone: "8800006666" },
  ];
  const employees = [];
  for (const def of employeeDefs) {
    employees.push(await Employee.create({ userId, ...def, address: `${rand(1,50)} Labour Colony, Surat`, advancePayment: rand(500,3000), paidPayment: rand(5000,20000), workEntries: [] }));
  }
  console.log(`👷 Employees      →  ${employees.length}`);

  /* 7. WORK ENTRIES */
  await WorkEntry.deleteMany({ userId });
  let workCount = 0;
  const used = new Set();
  for (const emp of employees) {
    for (let d = 1; d <= 28; d += rand(1,3)) {
      const key = `${emp._id}-${d}`;
      if (used.has(key)) continue;
      used.add(key);
      const date = new Date(); date.setDate(d); date.setHours(9,0,0,0);
      const status = d % 7 === 0 ? "WORK_OFF" : "WORK";
      const entry = await WorkEntry.create({ userId, employee: emp._id, date, quantity: status==="WORK"?rand(10,60):undefined, amount: status==="WORK"?rand(200,800):undefined, status });
      await Employee.findByIdAndUpdate(emp._id, { $push: { workEntries: entry._id } });
      workCount++;
    }
  }
  console.log(`📋 Work entries   →  ${workCount}`);

  /* 8. FACTORY EXPENSES */
  await FactoryExpense.deleteMany({ userId });
  const expenseNames = ["Electricity Bill","Water Bill","Machine Maintenance","Generator Fuel","Rent Payment","Security Guard Salary","Cleaning Supplies","Office Supplies","Internet Bill","Telephone Bill","Pest Control","AC Servicing","Spare Parts","Tool Replacement","Safety Equipment","First Aid Kit","Canteen Supplies","Drinking Water","Firefighting Equipment","Packaging Material"];
  for (let i = 0; i < 20; i++) {
    await FactoryExpense.create({ userId, name: expenseNames[i], amount: rand(500,15000), entryDate: thisMonth(), entryPerson: pick(["Deepak Verma","Rajesh Shah","Priti Doshi"]), shopName: pick(["City Electric","Metro Store","Ram Hardware","Shree Suppliers"]), quantity: rand(1,20), status: pick(["pending","paid","paid"]) });
  }
  console.log(`🏭 Factory exps   →  20`);

  /* 9. RAW MATERIALS */
  await RawMaterial.deleteMany({ userId });
  const materialNames = ["Cotton Yarn","Polyester Thread","Nylon Rope","Elastic Band","Rubber Sheet","Steel Wire","Plastic Granules","Dye Powder Blue","Dye Powder Red","Dye Powder Yellow","Chemical Fixative","Fabric Softener","Wax Block","Foam Sheet","Canvas Roll","Jute Fiber","Synthetic Resin","Adhesive Glue","Packing Tape","Bubble Wrap"];
  for (let i = 0; i < 20; i++) {
    await RawMaterial.create({ userId, materialName: materialNames[i], shopName: pick(["Raj Traders","Shree Raw Mart","Global Supplies","Om Store"]), buyerName: pick(["Deepak Verma","Suresh Patel","Ramesh Yadav"]), quantity: rand(5,100), amount: rand(800,20000), date: thisMonth(), status: pick(["pending","paid","paid"]) });
  }
  console.log(`🧱 Raw materials  →  20`);

  /* Done */
  console.log("\n✅ Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Login     →  seed@supermax.com  ");
  console.log("  Password  →  Seed@1234          ");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message || err);
  mongoose.disconnect();
  process.exit(1);
});
