/**
 * Migration runner script - tries multiple database hosts
 */

import mysql from 'mysql2/promise';
import bcryptjs from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Try different possible database hostnames for Hostinger
const hostNames = [
  'localhost',                              // Local development
  '127.0.0.1',                              // Local loopback
  'mysql.hostinger.com',                    // Common Hostinger shared host
  'mysql.u263459454.hostinger.com',         // Account-specific host
  'localhost',                              // With different port
];

async function tryConnection(config) {
  try {
    const pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      enableKeepAlive: false,
    });

    const connection = await pool.getConnection();
    console.log(`✓ Connected to ${config.host}:${config.port}`);

    return { pool, connection };
  } catch (error) {
    return null;
  }
}

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://u263459454_alternatives:v8H56U3Jyejj@localhost:3306/u263459454_alternatives';

  const url = new URL(dbUrl);
  const baseConfig = {
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  };

  let connection = null;
  let pool = null;

  // Try each hostname
  for (const host of hostNames) {
    const config = {
      ...baseConfig,
      host,
      port: url.port ? parseInt(url.port) : 3306,
    };

    console.log(`[Migration] Trying connection to: ${config.user}@${config.host}:${config.port}/${config.database}`);

    const result = await tryConnection(config);
    if (result) {
      pool = result.pool;
      connection = result.connection;
      break;
    }
  }

  if (!connection) {
    console.error("[Migration] Failed to connect to any database host");
    process.exit(1);
  }

  try {
    // Check existing columns
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users'`,
      [baseConfig.database]
    );

    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log("[Migration] Existing columns in admin_users:", columnNames);

    // Add isActive column if missing
    if (!columnNames.includes('isActive')) {
      console.log("[Migration] Adding isActive column...");
      try {
        await connection.execute(
          `ALTER TABLE admin_users ADD COLUMN isActive BOOLEAN DEFAULT TRUE AFTER role`
        );
        console.log("[Migration] ✓ Added isActive column");
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error("[Migration] Error adding isActive:", err.message);
        }
      }
    } else {
      console.log("[Migration] isActive column already exists");
    }

    // Add lastLogin column if missing
    if (!columnNames.includes('lastLogin')) {
      console.log("[Migration] Adding lastLogin column...");
      try {
        await connection.execute(
          `ALTER TABLE admin_users ADD COLUMN lastLogin TIMESTAMP NULL AFTER isActive`
        );
        console.log("[Migration] ✓ Added lastLogin column");
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error("[Migration] Error adding lastLogin:", err.message);
        }
      }
    } else {
      console.log("[Migration] lastLogin column already exists");
    }

    // Check if default admin user exists
    const [adminUsers] = await connection.query(
      `SELECT id, email FROM admin_users WHERE email = ?`,
      ['admin@alternative.com']
    );

    if (adminUsers.length === 0) {
      console.log("[Migration] Creating default admin user...");
      const hashedPassword = await bcryptjs.hash('admin123', 10);

      try {
        await connection.execute(
          `INSERT INTO admin_users (email, password, name, role, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          ['admin@alternative.com', hashedPassword, 'Admin User', 'super_admin', true]
        );
        console.log("[Migration] ✓ Created default admin user");
        console.log("[Migration]   Email: admin@alternative.com");
        console.log("[Migration]   Password: admin123");
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log("[Migration] Admin user already exists");
        } else {
          console.error("[Migration] Error creating admin:", err.message);
          throw err;
        }
      }
    } else {
      console.log(`[Migration] Admin user already exists: ${adminUsers[0].email}`);
    }

    console.log("[Migration] ✓ All migrations completed successfully");

    // Update .env file to show what was done
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      console.log("[Migration] Current DATABASE_URL in .env:", envContent.split('\n').find(line => line.startsWith('DATABASE_URL')));
    }

  } finally {
    if (connection) {
      connection.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log("[Migration] Done!");
    process.exit(0);
  })
  .catch(err => {
    console.error("[Migration] Fatal error:", err.message);
    process.exit(1);
  });
