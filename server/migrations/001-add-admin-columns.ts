/**
 * Migration: Add missing isActive and lastLogin columns to admin_users table
 *
 * This migration adds the isActive and lastLogin columns that the application
 * expects but which were missing from the CREATE TABLE statement.
 */

import { getDb } from "../db";

export async function migrate() {
  console.log("[Migration] Starting migration: add-admin-columns");

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const pool = (db as any).$client;
    const connection = await pool.getConnection();

    try {
      // Check if the columns already exist
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users'`
      ) as any[];

      const columnNames = columns.map((col: any) => col.COLUMN_NAME);
      console.log("[Migration] Existing columns:", columnNames);

      // Add isActive column if it doesn't exist
      if (!columnNames.includes('isActive')) {
        console.log("[Migration] Adding isActive column...");
        await connection.execute(
          `ALTER TABLE admin_users ADD COLUMN isActive BOOLEAN DEFAULT TRUE AFTER role`
        );
        console.log("[Migration] ✓ Added isActive column");
      } else {
        console.log("[Migration] isActive column already exists");
      }

      // Add lastLogin column if it doesn't exist
      if (!columnNames.includes('lastLogin')) {
        console.log("[Migration] Adding lastLogin column...");
        await connection.execute(
          `ALTER TABLE admin_users ADD COLUMN lastLogin TIMESTAMP NULL AFTER isActive`
        );
        console.log("[Migration] ✓ Added lastLogin column");
      } else {
        console.log("[Migration] lastLogin column already exists");
      }

      console.log("[Migration] ✓ Migration completed successfully");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
