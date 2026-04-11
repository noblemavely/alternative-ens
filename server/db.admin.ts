import { getDb } from "./db";
import { adminUsers, type AdminUser } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function createAdminUser(email: string, password: string, name: string, role: "super_admin" | "admin" = "admin") {
  const hashedPassword = await bcrypt.hash(password, 10);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(adminUsers).values({
    email,
    password: hashedPassword,
    name,
    role,
    isActive: true,
  });
  
  return result;
}

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });
  return admin;
}

export async function verifyAdminPassword(email: string, password: string) {
  const admin = await getAdminByEmail(email);
  if (!admin) return null;

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) return null;

  return admin;
}

export async function getAllAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  const admins = await db.query.adminUsers.findMany({
    where: eq(adminUsers.isActive, true),
  });
  return admins;
}

export async function getAdminUserById(adminId: number) {
  const db = await getDb();
  if (!db) return null;
  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, adminId),
  });
  return admin;
}

export async function updateAdminLastLogin(adminId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminUsers)
    .set({ lastLogin: new Date() })
    .where(eq(adminUsers.id, adminId));
}

export async function updateAdminUser(adminId: number, data: { name?: string; email?: string; role?: "super_admin" | "admin" }) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminUsers)
    .set(data)
    .where(eq(adminUsers.id, adminId));
}

export async function deleteAdminUser(adminId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminUsers)
    .set({ isActive: false })
    .where(eq(adminUsers.id, adminId));
}
