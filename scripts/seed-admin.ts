import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { AdminModel } from "../lib/models/Admin";

async function seed() {
  const uri = process.env.MONGODB_STRING;
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!uri) {
    throw new Error("MONGODB_STRING is missing.");
  }
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed.");
  }

  await mongoose.connect(uri);

  const existing = await AdminModel.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await AdminModel.create({ name, email, passwordHash, role: "admin" });
  console.log(`Created admin ${email}`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
